"""Тесты дедупликации между камерами (ядро ответа на вопрос о 3 камерах).

Запуск: pytest -q
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.schemas import Detection
from app.cv.dedup import deduplicate


def test_same_bulldozer_three_cameras_no_calibration():
    """3 камеры видят один бульдозер в одной зоне -> должно быть 1, а не 3."""
    dets = [
        Detection(equipment_type="bulldozer", confidence=0.9, bbox=[0, 0, 10, 10],
                  zone="A", timestamp="2026-07-10T10:00:00"),
        Detection(equipment_type="bulldozer", confidence=0.8, bbox=[1, 1, 11, 11],
                  zone="A", timestamp="2026-07-10T10:00:30"),
        Detection(equipment_type="bulldozer", confidence=0.7, bbox=[2, 2, 12, 12],
                  zone="A", timestamp="2026-07-10T10:01:00"),
    ]
    result = deduplicate(dets)
    assert result.get("bulldozer") == 1


def test_two_bulldozers_different_zones():
    """Два бульдозера в разных зонах -> 2."""
    dets = [
        Detection(equipment_type="bulldozer", confidence=0.9, bbox=[0, 0, 10, 10],
                  zone="A", timestamp="2026-07-10T10:00:00"),
        Detection(equipment_type="bulldozer", confidence=0.9, bbox=[0, 0, 10, 10],
                  zone="B", timestamp="2026-07-10T10:00:00"),
    ]
    assert deduplicate(dets).get("bulldozer") == 2


def test_cluster_by_world_coords():
    """С калибровкой: близкие детекции одного типа -> один объект, дальняя -> второй."""
    dets = [
        Detection(equipment_type="excavator", confidence=0.9, bbox=[0, 0, 10, 10],
                  zone="A", timestamp="2026-07-10T10:00:00", world_x=0.0, world_y=0.0),
        Detection(equipment_type="excavator", confidence=0.9, bbox=[0, 0, 10, 10],
                  zone="A", timestamp="2026-07-10T10:01:00", world_x=1.0, world_y=1.0),
        Detection(equipment_type="excavator", confidence=0.9, bbox=[0, 0, 10, 10],
                  zone="A", timestamp="2026-07-10T10:01:00", world_x=50.0, world_y=50.0),
    ]
    assert deduplicate(dets).get("excavator") == 2
