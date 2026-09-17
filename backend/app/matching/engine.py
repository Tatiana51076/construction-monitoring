"""Ядро сопоставления: сравнение наблюдаемой техники с требуемой по работе
и формирование отклонений с понятным объяснением (ТЗ v0.2, разделы 10, 12).
"""
from datetime import date
from typing import Dict, List, Optional

from app.matching.daylevel import (
    STATUS_FALSE_COMPLETION,
    STATUS_INSUFFICIENT,
    STATUS_NOTHING_DETECTED,
    STATUS_RESOURCES_ONLY,
)


def detect_deviations(stage, detected: Dict[str, int],
                      required: Dict[str, int]) -> List[dict]:
    """Отклонения по составу техники (R2/R5, snapshot)."""
    deviations: List[dict] = []

    # 1) Нет нужной техники / дефицит
    for etype, need in required.items():
        have = detected.get(etype, 0)
        if have == 0:
            deviations.append({
                "type": "missing_equipment",
                "severity": "high" if need >= 2 else "medium",
                "equipment": etype,
                "required": need,
                "detected": 0,
                "message": f"На работе «{stage.name}» (зона {stage.zone}) не обнаружена техника "
                           f"«{etype}» (нужно минимум {need}). Возможен простой и снижение темпа работ.",
            })
        elif have < need:
            deviations.append({
                "type": "undercapacity",
                "severity": "medium",
                "equipment": etype,
                "required": need,
                "detected": have,
                "message": f"На работе «{stage.name}» (зона {stage.zone}) техники «{etype}» "
                           f"меньше плана: {have} из {need}.",
            })

    # 2) Лишняя техника (не соответствует текущему этапу)
    for etype, have in detected.items():
        if etype not in required and have > 0:
            deviations.append({
                "type": "unexpected_equipment",
                "severity": "low",
                "equipment": etype,
                "required": 0,
                "detected": have,
                "message": f"На работе «{stage.name}» (зона {stage.zone}) замечена техника "
                           f"«{etype}», не предусмотренная планом.",
            })

    return deviations


def false_completion_deviation(stage, level2_days: int, working_days: int,
                               coverage: float) -> Optional[dict]:
    """R6 ⭐ «Ложное завершение»: работа закрыта на 100%, но камерой не подтверждена."""
    if stage.fact_percent < 100 or coverage < 0.6 or not working_days:
        return None
    ratio = level2_days / working_days
    if ratio >= 0.4:
        return None
    return {
        "type": "false_completion",
        "severity": "high",
        "required": None,
        "detected": level2_days,
        "message": (f"Работа «{stage.name}» (зона {stage.zone}) закрыта на 100%, но выполнение "
                    f"не подтверждено видеонаблюдением: за период не обнаружена требуемая техника "
                    f"({level2_days} из {working_days} дней)."),
    }


def schedule_delay_deviation(stage, forecast_end: Optional[str] = None,
                             today: Optional[str] = None) -> Optional[dict]:
    """R7 «Сроки»: просрочка окончания и/или прогноз сдвига."""
    today_d = date.fromisoformat(today) if today else date.today()
    plan_end = date.fromisoformat(stage.plan_end)
    overdue = (today_d - plan_end).days
    if overdue <= 0 and not forecast_end:
        return None
    if overdue > 0:
        message = (f"Работа «{stage.name}» (зона {stage.zone}) не завершена: план окончился "
                   f"{stage.plan_end}, просрочка +{overdue} дн.")
        severity = "high" if overdue > 7 else "medium"
    else:
        message = (f"Работа «{stage.name}» (зона {stage.zone}) идёт с отставанием, "
                   f"прогноз окончания — {forecast_end} (план {stage.plan_end}).")
        severity = "medium"
    return {
        "type": "schedule_delay",
        "severity": severity,
        "equipment": None,
        "required": None,
        "detected": overdue if overdue > 0 else None,
        "forecast_end": forecast_end,
        "message": message,
    }


def status_deviations(stage, status_info: dict, today: Optional[str] = None) -> List[dict]:
    """Отклонения из результата work_status(): R3, R6, R7."""
    devs: List[dict] = []
    status = status_info.get("status")

    if status == STATUS_FALSE_COMPLETION:
        d = false_completion_deviation(stage, status_info.get("level2_days", 0),
                                       status_info.get("working_days", 0),
                                       status_info.get("coverage", 0.0))
        if d:
            devs.append(d)

    if status == STATUS_NOTHING_DETECTED:
        devs.append({
            "type": "missing_equipment",
            "severity": "high",
            "equipment": None,
            "required": None,
            "detected": 0,
            "message": (f"Работа «{stage.name}» (зона {stage.zone}): кадры есть, но требуемая "
                        f"техника/бригада не обнаружены несколько дней подряд."),
        })

    if status == STATUS_RESOURCES_ONLY:
        devs.append({
            "type": "idle",
            "severity": "medium",
            "equipment": None,
            "required": None,
            "detected": None,
            "message": (f"Работа «{stage.name}» (зона {stage.zone}): техника есть, но признаков "
                        f"движения нет — возможен простой. Запросить причину."),
        })

    delay = schedule_delay_deviation(stage, status_info.get("forecast_end"), today)
    if delay and status != STATUS_INSUFFICIENT:
        devs.append(delay)

    return devs


def risk_score(deviations: List[dict], days_overdue: int = 0) -> int:
    """Оценка риска срыва сроков 0..100 (чем выше — тем хуже)."""
    weights = {
        "false_completion": 40,
        "schedule_delay": 25,
        "missing_equipment": 30,
        "undercapacity": 15,
        "idle": 10,
        "unexpected_equipment": 5,
    }
    score = sum(weights.get(d["type"], 5) for d in deviations)
    score += min(max(days_overdue, 0), 10) * 5
    return max(0, min(100, score))
