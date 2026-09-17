"""Дедупликация техники между несколькими камерами (ТЗ v0.2, п.10.1).

Проблема: одну и ту же машину могут видеть 3 камеры с разных ракурсов —
нельзя просто сложить детекции, иначе бульдозер посчитается за 3.

Решение (два режима):

1) Если есть привязка к плану (world_x/world_y через гомографию):
   детекции одного типа кластеризуются по расстоянию (<= DEDUP_DISTANCE);
   один кластер = один объект.

2) Если калибровки нет (fallback): считаем «присутствие», а не сумму —
   число зон, в которых данный тип был замечен (не число детекций).

Модуль чистый (без БД) — легко тестируется.
"""
from collections import defaultdict
from typing import Dict, List, Tuple

from app.config import DEDUP_DISTANCE
from app.schemas import Detection


def _cluster_by_distance(items: List[Detection], max_dist: float) -> int:
    """Жадная кластеризация одного типа по координатам на плане.

    Возвращает число уникальных кластеров (объектов).
    """
    clusters: List[Tuple[float, float]] = []
    for d in items:
        if d.world_x is None or d.world_y is None:
            continue
        placed = False
        for cx, cy in clusters:
            if ((d.world_x - cx) ** 2 + (d.world_y - cy) ** 2) ** 0.5 <= max_dist:
                placed = True
                break
        if not placed:
            clusters.append((d.world_x, d.world_y))
    return len(clusters)


def _presence_zones(items: List[Detection]) -> int:
    """Присутствие: сколько зон содержит данный тип (без двойного счёта камер)."""
    return len({d.zone or "_" for d in items})


def deduplicate(detections: List[Detection],
                max_dist: float = DEDUP_DISTANCE) -> Dict[str, int]:
    """Возвращает уникальное количество техники по типам.

    :param detections: все детекции со всех камер (с zone/world/timestamp).
    :param max_dist: порог расстояния для объединения объектов на плане.
    """
    by_type: Dict[str, List[Detection]] = defaultdict(list)
    for d in detections:
        by_type[d.equipment_type].append(d)

    unique: Dict[str, int] = {}
    for etype, items in by_type.items():
        has_world = any(i.world_x is not None and i.world_y is not None for i in items)
        if has_world:
            n = _cluster_by_distance(items, max_dist)
            unique[etype] = n if n else _presence_zones(items)
        else:
            unique[etype] = _presence_zones(items)
    return unique
