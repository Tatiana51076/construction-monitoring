"""Правила соответствия «этап работ → необходимая техника».

Правила можно задавать:
  - в самом графике (колонки required_equipment / min_counts), и/или
  - в файле data/equipment_rules.json (методика, единая для всех объектов).

Приоритет — данные из графика; файл правил используется как справочник/дефолт.
"""
import json
from typing import Dict, List


def load_rules(path: str = "data/equipment_rules.json") -> Dict[str, dict]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def required_for(stage_name: str, schedule_required: List[str],
                 rules: Dict[str, dict]) -> Dict[str, int]:
    """Возвращает {тип: мин.кол-во} для этапа.

    Если в графике указан список техники — берём его (min=1 либо из min_counts).
    Иначе ищем этап в файле правил по ключу (точное или частичное совпадение).
    """
    if schedule_required:
        return {e: 1 for e in schedule_required}

    for key, spec in rules.items():
        if key.lower() in stage_name.lower():
            return {e: (spec.get("min_counts", {}) or {}).get(e, 1)
                    for e in spec.get("equipment", [])}
    return {}
