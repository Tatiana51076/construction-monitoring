"""Парсинг календарного графика производства работ из CSV.

Поддерживается каноническая форма (ТЗ v0.2, п.6) и старый короткий формат:
    object_id,name,zone,contractor,plan_start,plan_end,required_equipment,min_counts,
    confirm_threshold,fact_percent,zone_type,min_people
    stage,start,end,zone,required_equipment,min_counts        # устаревшие заголовки

Синонимы колонок: stage/name, start/plan_start, end/plan_end, contractor/Исполнитель.
"""
from datetime import date
from typing import Dict, List, Optional

import pandas as pd

from app.config import DEFAULT_CONFIRM_THRESHOLD
from app.schemas import Work


def _parse_map(s: str) -> Dict[str, int]:
    out: Dict[str, int] = {}
    if not s or not isinstance(s, str):
        return out
    for part in s.replace(";", "|").split("|"):
        part = part.strip()
        if not part:
            continue
        if ":" in part:
            k, v = part.split(":", 1)
            try:
                out[k.strip()] = int(float(v.strip()))
            except ValueError:
                out[k.strip()] = 1
        else:
            out[part] = 1
    return out


def _parse_list(s) -> List[str]:
    if not s or not isinstance(s, str):
        return []
    return [e.strip() for e in s.replace(";", "|").split("|") if e.strip()]


def _col(df: pd.DataFrame, *names: str) -> Optional[str]:
    for n in names:
        if n in df.columns:
            return n
    return None


def _val(row, col: Optional[str], default=None):
    if not col:
        return default
    v = row.get(col)
    if v is None:
        return default
    if isinstance(v, float) and pd.isna(v):
        return default
    return v


def _num(row, col: Optional[str], default: float = 0.0) -> float:
    try:
        return float(_val(row, col, default))
    except (TypeError, ValueError):
        return default


def load_schedule(csv_path: str) -> List[Work]:
    """Читает CSV и приводит строки к канонической форме Work."""
    df = pd.read_csv(csv_path, dtype=str).fillna("")

    c_name = _col(df, "name", "stage", "работа", "вид работ")
    c_ps = _col(df, "plan_start", "start", "начало")
    c_pe = _col(df, "plan_end", "end", "окончание")
    c_zone = _col(df, "zone", "зона")
    c_req = _col(df, "required_equipment", "техника")
    c_min = _col(df, "min_counts")
    c_conf = _col(df, "confirm_threshold")
    c_fact = _col(df, "fact_percent", "факт")
    c_obj = _col(df, "object_id", "object", "объект")
    c_contr = _col(df, "contractor", "исполнитель")
    c_zt = _col(df, "zone_type")
    c_mp = _col(df, "min_people")

    works: List[Work] = []
    for _, row in df.iterrows():
        if not str(_val(row, c_name, "")).strip():
            continue
        works.append(Work(
            id=str(_val(row, _col(df, "id"), "") or "") or None,
            object_id=str(_val(row, c_obj, "") or "") or None,
            name=str(_val(row, c_name, "")).strip(),
            zone=str(_val(row, c_zone, "")).strip(),
            contractor=str(_val(row, c_contr, "") or "") or None,
            plan_start=str(_val(row, c_ps, "")).strip(),
            plan_end=str(_val(row, c_pe, "")).strip(),
            required_equipment=_parse_list(_val(row, c_req, "")),
            min_counts=_parse_map(str(_val(row, c_min, ""))),
            confirm_threshold=_num(row, c_conf, DEFAULT_CONFIRM_THRESHOLD),
            fact_percent=_num(row, c_fact, 0.0),
            zone_type=str(_val(row, c_zt, "area") or "area"),
            min_people=int(_num(row, c_mp, 1)),
            source=csv_path,
        ))
    return works


def active_stage(stages: List[Work], on_date: Optional[str] = None,
                 zone: Optional[str] = None) -> Optional[Work]:
    """Возвращает активную работу на дату (и, если задано, в зоне)."""
    d = on_date or date.today().isoformat()
    candidates = [s for s in stages if s.plan_start <= d <= s.plan_end]
    if zone:
        zoned = [s for s in candidates if s.zone == zone]
        if zoned:
            return zoned[0]
    return candidates[0] if candidates else None
