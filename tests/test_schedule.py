"""Тесты парсера графика: каноническая форма и поля источника факта.

См. Q1 Жасмин: report_date / author / fact_source — необязательные.
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.matching.schedule import load_schedule

DATA = os.path.join(os.path.dirname(__file__), "..", "data", "schedule.example.csv")


def test_reads_fact_meta():
    works = {w.name: w for w in load_schedule(DATA)}
    wk = works["Устройство котлована"]
    assert wk.fact_percent == 40
    assert wk.report_date == "2026-07-10"
    assert wk.author == "Петров П.П."
    assert wk.fact_source == "plan_column"


def test_optional_fact_meta_absent():
    works = {w.name: w for w in load_schedule(DATA)}
    wf = works["Устройство фундамента"]
    assert wf.fact_percent == 0
    assert wf.report_date is None
    assert wf.author is None
    assert wf.fact_source is None


def test_backward_compatible_old_header():
    """Старый график без новых колонок читается, поля остаются пустыми."""
    old = ("stage,start,end,zone,required_equipment,min_counts\n"
           "Котлован,2026-07-06,2026-07-20,A,excavator|dump_truck,excavator:1|dump_truck:2\n")
    with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8") as f:
        f.write(old)
        path = f.name
    try:
        works = load_schedule(path)
        assert len(works) == 1
        assert works[0].name == "Котлован"
        assert works[0].plan_start == "2026-07-06"
        assert works[0].report_date is None
        assert works[0].author is None
        assert works[0].fact_source is None
    finally:
        os.remove(path)
