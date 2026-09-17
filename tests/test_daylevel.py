"""Тесты уровней дня, статусов и трёх осей (ТЗ v0.2, разделы 8–11).

Запуск без pytest: см. tests/run_all.py
"""
import os
import sys
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.schemas import DayLevel, Downtime, Work
from app.matching.daylevel import (
    LEVEL_NOTHING,
    LEVEL_NO_FRAMES,
    LEVEL_RESOURCES,
    LEVEL_WORKING,
    STATUS_FALSE_COMPLETION,
    STATUS_IN_PROGRESS,
    STATUS_INSUFFICIENT,
    STATUS_NOTHING_DETECTED,
    STATUS_RESOURCES_ONLY,
    day_level,
    is_working_day,
    work_status,
)

REQ = {"excavator": 1, "dump_truck": 2}


def _work(fact_percent: float = 40.0, start: str = "2026-07-06",
          end: str = "2026-07-20", threshold: float = 0.6) -> Work:
    return Work(
        name="Устройство котлована", zone="A", contractor="ООО СтройМонтаж",
        plan_start=start, plan_end=end, required_equipment=list(REQ),
        min_counts=dict(REQ), confirm_threshold=threshold, fact_percent=fact_percent,
    )


def _days(levels, start_day=6):
    out = []
    d = start_day
    for lv in levels:
        out.append(DayLevel(date=f"2026-07-{d:02d}", level=lv))
        d += 1
    return out


def test_day_level_states():
    assert day_level(REQ, {}, frames_present=False) is LEVEL_NO_FRAMES
    assert day_level(REQ, {}) == LEVEL_NOTHING
    assert day_level(REQ, {"excavator": 1}, moved=False) == LEVEL_RESOURCES
    assert day_level(REQ, {"excavator": 1, "dump_truck": 2}, moved=True, people=1) == LEVEL_WORKING
    # техника есть и движется, но не хватает ключевого класса -> только ресурсы
    assert day_level(REQ, {"excavator": 1}, moved=True, people=1) == LEVEL_RESOURCES


def test_weekday_calendar():
    assert is_working_day(date(2026, 7, 6)) is True    # понедельник
    assert is_working_day(date(2026, 7, 11)) is False   # суббота
    assert is_working_day(date(2026, 7, 11), week_mode=6) is True


def test_in_progress_by_threshold():
    days = _days([LEVEL_WORKING] * 5)                    # 06–10 июля, все дни «работа идёт»
    info = work_status(_work(), days, today="2026-07-10")
    assert info["status"] == STATUS_IN_PROGRESS
    assert info["working_days"] == 5
    assert info["coverage"] == 1.0


def test_false_completion_rule_r6():
    # закрыто на 100%, покрытие есть, но подтверждено 1 день из 5 -> ложное завершение
    days = _days([LEVEL_WORKING, LEVEL_RESOURCES, LEVEL_RESOURCES, LEVEL_NOTHING, LEVEL_NOTHING])
    info = work_status(_work(fact_percent=100), days, today="2026-07-10")
    assert info["status"] == STATUS_FALSE_COMPLETION


def test_insufficient_coverage_rule_r4():
    days = _days([LEVEL_WORKING, LEVEL_WORKING, None, None, None])
    info = work_status(_work(), days, today="2026-07-10")
    assert info["status"] == STATUS_INSUFFICIENT
    assert info["coverage"] == 0.4


def test_nothing_detected_rule_r3():
    days = _days([LEVEL_NOTHING] * 5)
    info = work_status(_work(fact_percent=0), days, today="2026-07-10")
    assert info["status"] == STATUS_NOTHING_DETECTED


def test_resources_only():
    days = _days([LEVEL_RESOURCES] * 5)
    info = work_status(_work(fact_percent=0), days, today="2026-07-10")
    assert info["status"] == STATUS_RESOURCES_ONLY


def test_downtime_excluded_from_denominator():
    # 06.07 исключён документированным простоем; остаётся 4 рабочих дня (07–10.07)
    days = _days([None, LEVEL_WORKING, LEVEL_WORKING, LEVEL_WORKING, LEVEL_WORKING])
    downtimes = [Downtime(date="2026-07-06", reason="weather", document="акт №1")]
    info = work_status(_work(), days, downtimes=downtimes, today="2026-07-10")
    assert info["working_days"] == 4
    assert info["coverage"] == 1.0
    assert info["status"] == STATUS_IN_PROGRESS


def test_three_axes_and_gap():
    days = _days([LEVEL_WORKING] * 5)
    info = work_status(_work(fact_percent=40), days, today="2026-07-10")
    assert info["axes"]["declared"] == 0.4
    assert info["axes"]["confirmed"] == 1.0
    assert info["gap_pp"] == -60.0
    assert 0.0 < info["axes"]["plan_today"] < 0.5   # 5 из 11 рабочих дней
