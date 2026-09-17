"""Тесты логики сопоставления (без CV)."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.schemas import ScheduleStage
from app.matching.engine import detect_deviations, risk_score


def _stage():
    return ScheduleStage(
        name="Устройство котлована", start_date="2026-07-06", end_date="2026-07-20",
        zone="A", required_equipment=["excavator", "dump_truck"],
        min_counts={"excavator": 1, "dump_truck": 2},
    )


def test_missing_dump_trucks():
    """Пример из ТЗ: есть экскаватор, нет самосвалов."""
    devs = detect_deviations(_stage(), detected={"excavator": 1}, required={"excavator": 1, "dump_truck": 2})
    types = {d["type"] for d in devs}
    eqs = {d.get("equipment") for d in devs}
    assert "missing_equipment" in types
    assert "dump_truck" in eqs


def test_undercapacity():
    devs = detect_deviations(_stage(), detected={"excavator": 1, "dump_truck": 1},
                             required={"excavator": 1, "dump_truck": 2})
    assert any(d["type"] == "undercapacity" and d["equipment"] == "dump_truck" for d in devs)


def test_unexpected_equipment():
    devs = detect_deviations(_stage(), detected={"excavator": 1, "dump_truck": 2, "roller": 1},
                             required={"excavator": 1, "dump_truck": 2})
    assert any(d["type"] == "unexpected_equipment" and d["equipment"] == "roller" for d in devs)


def test_risk_score_range():
    devs = detect_deviations(_stage(), detected={}, required={"excavator": 1, "dump_truck": 2})
    score = risk_score(devs)
    assert 0 <= score <= 100
