"""Правила соответствия «этап работ → необходимая техника».

Единый источник: data/expected_equipment.json (ключ "works"):
    { "Бетонирование": { "required": { "mixer": 1, "autocran": 1 } } }
Совместимость: также читается старый data/equipment_rules.json:
    { "Этап": { "equipment": [...], "min_counts": {...} } }

Правила можно переопределять прямо в графике (колонки required_equipment / min_counts).
Приоритет — данные из графика; файл используется как справочник/дефолт.
"""
import json
from typing import Dict, List

CANDIDATES = ("data/expected_equipment.json", "data/equipment_rules.json")


def load_rules(path: str = None) -> Dict[str, dict]:
    """Загружает таблицу работ. Новый формат хранит работы в ключе "works"."""
    paths = [path] if path else list(CANDIDATES)
    for p in paths:
        try:
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get("works", data)
        except Exception:
            continue
    return {}


def _spec_to_dict(spec: dict) -> Dict[str, int]:
    """Нормализует запись работы к виду {класс: мин.кол-во}."""
    req = spec.get("required")
    if req:
        return dict(req)
    return {e: (spec.get("min_counts", {}) or {}).get(e, 1)
            for e in spec.get("equipment", [])}


def required_for(stage_name: str, schedule_required: List[str],
                 rules: Dict[str, dict]) -> Dict[str, int]:
    """Возвращает {тип: мин.кол-во} для этапа.

    Если в графике указан список техники — берём его (min=1).
    Иначе ищем этап в таблице работ (точное или частичное совпадение).
    """
    if schedule_required:
        return {e: 1 for e in schedule_required}

    low = stage_name.lower()
    for key, spec in rules.items():
        k = key.lower()
        if k in low or low in k:
            return _spec_to_dict(spec)
    return {}
