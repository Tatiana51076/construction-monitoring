"""Уровни дня, статусы работ и правила сверки (ТЗ v0.2, разделы 5–9, 11, 19).

Модуль чистый (без БД и CV) — легко тестируется.
Ключевые понятия:
  * уровень дня   — 2 работа идёт / 1 только ресурсы / 0 ничего / None кадров нет;
  * статус работы — Ось 1 «наблюдение» (in_progress, resources_only, …);
  * три оси       — план на сегодня / заявлено подрядчиком / подтверждено камерой;
  * прогноз срока — по наблюдаемому темпу.
"""
from __future__ import annotations

import math
from datetime import date, timedelta
from typing import Dict, Iterable, List, Optional, Sequence

from app.config import (
    COVERAGE_MIN,
    FALSE_COMPLETION_MAX_LEVEL2,
    FALSE_COMPLETION_MIN_COVERAGE,
    HOLIDAYS,
    MISSING_DAYS,
    WEEK_MODE,
)

LEVEL_WORKING = 2
LEVEL_RESOURCES = 1
LEVEL_NOTHING = 0
LEVEL_NO_FRAMES: Optional[int] = None

# Статусы работы (Ось 1, ТЗ v0.2 раздел 9)
STATUS_NOT_STARTED = "not_started"
STATUS_IN_PROGRESS = "in_progress"
STATUS_RESOURCES_ONLY = "resources_only"
STATUS_NOTHING_DETECTED = "nothing_detected"
STATUS_INSUFFICIENT = "insufficient"
STATUS_NOT_CHECKED = "not_checked"
STATUS_FALSE_COMPLETION = "false_completion"
STATUS_MANUAL_RESOLVED = "manual_resolved"


def _as_date(value) -> date:
    return value if isinstance(value, date) else date.fromisoformat(str(value))


def is_working_day(day: date, week_mode: int = WEEK_MODE,
                   holidays: Iterable[str] = ()) -> bool:
    """Рабочий ли день с учётом режима недели (5/6) и праздников."""
    if day.isoformat() in set(holidays or HOLIDAYS or ()):
        return False
    if week_mode >= 6:
        return True
    return day.weekday() < 5


def iter_workdays(start: str, end: str, week_mode: int = WEEK_MODE,
                  holidays: Iterable[str] = ()) -> List[date]:
    """Все рабочие дни периода [start, end]."""
    a, b = _as_date(start), _as_date(end)
    out: List[date] = []
    cur = a
    while cur <= b:
        if is_working_day(cur, week_mode, holidays):
            out.append(cur)
        cur += timedelta(days=1)
    return out


def add_working_days(start: date, n: int, week_mode: int = WEEK_MODE,
                     holidays: Iterable[str] = ()) -> str:
    """Дата через n рабочих дней после start."""
    cur = start
    added = 0
    while added < n:
        cur += timedelta(days=1)
        if is_working_day(cur, week_mode, holidays):
            added += 1
    return cur.isoformat()


def day_level(required: Dict[str, int], detected: Dict[str, int],
              moved: bool = False, people: int = 0, min_people: int = 1,
              frames_present: bool = True) -> Optional[int]:
    """Уровень дня по работе (ТЗ v0.2, раздел 8).

    :param required: {класс: мин.кол-во} для работы.
    :param detected: {класс: кол-во} уникальной техники (после дедупа).
    :param moved: меняла ли техника положение за смену.
    :param people: людей в кадре, :param min_people: минимум по работе.
    :param frames_present: были ли кадры за день.
    """
    if not frames_present:
        return LEVEL_NO_FRAMES
    present = any(detected.get(etype, 0) > 0 for etype in required)
    under = any(detected.get(etype, 0) < need for etype, need in required.items())
    if present and moved and people >= min_people and not under:
        return LEVEL_WORKING
    if present or people > 0:
        return LEVEL_RESOURCES
    return LEVEL_NOTHING


def _levels_map(days: Sequence) -> Dict[str, Optional[int]]:
    out: Dict[str, Optional[int]] = {}
    for d in days:
        key = d["date"] if isinstance(d, dict) else d.date
        val = d.get("level") if isinstance(d, dict) else d.level
        out[key] = val
    return out


def _confirmed_downtime(downtimes: Sequence) -> set:
    """Даты простоев с документом → исключаются из знаменателя."""
    dates = set()
    for d in downtimes or []:
        doc = d.get("document") if isinstance(d, dict) else getattr(d, "document", None)
        key = d["date"] if isinstance(d, dict) else d.date
        if doc:
            dates.add(key)
    return dates


def _recent_all(levels: Dict[str, Optional[int]], past: List[date], value: int,
                n: int) -> bool:
    recent = [d for d in past][-n:]
    if len(recent) < n:
        return False
    return all(levels.get(d.isoformat()) == value for d in recent)


def _forecast(work, level2_ratio: float, confirmed: float, today: date,
              week_mode: int, holidays: Iterable[str]) -> Optional[str]:
    """Прогноз даты окончания по наблюдаемому темпу (ТЗ v0.2, раздел 12).

    Если объём закрыт (100%), но камерой не подтверждён — прогноз не выставляется.
    """
    if work.fact_percent >= 100 and level2_ratio < FALSE_COMPLETION_MAX_LEVEL2:
        return None
    if level2_ratio <= 0:
        return None
    if level2_ratio >= 1:
        return today.isoformat()
    remaining = max(0.0, 1.0 - confirmed)
    extra = math.ceil(remaining / level2_ratio)
    return add_working_days(today, extra, week_mode, holidays)


def work_status(work, days: Sequence, downtimes: Sequence = (),
                today: Optional[str] = None, week_mode: int = WEEK_MODE,
                holidays: Iterable[str] = ()) -> dict:
    """Считает статус работы, метрики и три оси (ТЗ v0.2, разделы 9–11).

    :param work: Work — каноническая форма работы.
    :param days: список DayLevel (или словарей) по датам.
    :param downtimes: список Downtime (документированные исключаются из знаменателя).
    :param today: дата анализа (ISO), по умолчанию — сегодня.
    """
    today_d = _as_date(today) if today else date.today()
    plan_start = _as_date(work.plan_start)
    plan_end = _as_date(work.plan_end)
    holidays = holidays or HOLIDAYS or ()

    levels = _levels_map(days)
    downtime_dates = _confirmed_downtime(downtimes)

    all_workdays = [d for d in iter_workdays(work.plan_start, work.plan_end, week_mode, holidays)
                    if d.isoformat() not in downtime_dates]
    past = [d for d in all_workdays if d <= today_d]
    covered = [d for d in past if levels.get(d.isoformat()) is not None]

    n_past = len(past)
    level2_days = sum(1 for d in covered if levels[d.isoformat()] == LEVEL_WORKING)
    level1_days = sum(1 for d in covered if levels[d.isoformat()] == LEVEL_RESOURCES)
    level0_days = sum(1 for d in covered if levels[d.isoformat()] == LEVEL_NOTHING)
    no_frames = len(past) - len(covered)

    coverage = (len(covered) / n_past) if n_past else 0.0
    level2_ratio = (level2_days / n_past) if n_past else 0.0

    # --- Статус (Ось 1) ---
    if today_d < plan_start:
        status = STATUS_NOT_STARTED
    elif not work.required_equipment:
        status = STATUS_NOT_CHECKED
    elif n_past == 0:
        status = STATUS_INSUFFICIENT
    elif coverage < COVERAGE_MIN:
        status = STATUS_INSUFFICIENT
    elif (work.fact_percent >= 100 and coverage >= FALSE_COMPLETION_MIN_COVERAGE
          and level2_ratio < FALSE_COMPLETION_MAX_LEVEL2):
        status = STATUS_FALSE_COMPLETION
    elif level2_ratio >= work.confirm_threshold:
        status = STATUS_IN_PROGRESS
    elif _recent_all(levels, past, LEVEL_NOTHING, MISSING_DAYS):
        status = STATUS_NOTHING_DETECTED
    else:
        status = STATUS_RESOURCES_ONLY

    # --- Три оси ---
    plan_today = (n_past / len(all_workdays)) if all_workdays else 0.0
    declared = max(0.0, min(1.0, work.fact_percent / 100.0))
    confirmed = level2_ratio
    gap_pp = (declared - confirmed) * 100.0

    forecast_end = _forecast(work, level2_ratio, confirmed, today_d, week_mode, holidays)

    return {
        "work": work.name,
        "zone": work.zone,
        "status": status,
        "level2_days": level2_days,
        "level1_days": level1_days,
        "level0_days": level0_days,
        "no_frames_days": no_frames,
        "working_days": n_past,
        "coverage": round(coverage, 4),
        "level2_ratio": round(level2_ratio, 4),
        "axes": {
            "plan_today": round(plan_today, 4),
            "declared": round(declared, 4),
            "confirmed": round(confirmed, 4),
        },
        "gap_pp": round(gap_pp, 1),
        "forecast_end": forecast_end,
    }
