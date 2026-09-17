"""Сквозной пайплайн: снимки + график -> детекция -> дедуп -> сопоставление -> отклонения."""
from typing import List, Optional
from datetime import date

from app.cv.detector import EquipmentDetector
from app.cv.dedup import deduplicate
from app.matching.schedule import load_schedule, active_stage
from app.matching.rules import load_rules, required_for
from app.matching.engine import detect_deviations, risk_score
from app.schemas import Detection


def analyze_images(images: List[dict],
                   schedule_path: str = "data/schedule.example.csv",
                   rules_path: str = "data/equipment_rules.json",
                   on_date: Optional[str] = None) -> dict:
    """
    :param images: список словарей: {path, camera_id, zone, timestamp}
    :param schedule_path: CSV календарного графика
    :param rules_path: JSON методики «этап → техника»
    :param on_date: дата анализа (ISO), по умолчанию — сегодня
    :return: результат анализа (текущий этап, техника, требуемое, отклонения, риск)
    """
    detector = EquipmentDetector()
    all_detections: List[Detection] = []

    for img in images:
        dets = detector.detect(img["path"], camera_id=img.get("camera_id"), zone=img.get("zone"))
        for d in dets:
            d.timestamp = img.get("timestamp")
            d.world_x = img.get("world_x")
            d.world_y = img.get("world_y")
        all_detections.extend(dets)

    # Дедупликация между камерами: один объект считается один раз
    detected = deduplicate(all_detections)

    stages = load_schedule(schedule_path)
    stage = active_stage(stages, on_date=on_date)

    result = {
        "date": on_date or date.today().isoformat(),
        "stage_name": stage.name if stage else None,
        "zone": stage.zone if stage else None,
        "detected": detected,
        "required": {},
        "deviations": [],
        "risk_score": 0,
    }

    if stage:
        rules = load_rules(rules_path)
        required = required_for(stage.name, stage.required_equipment, rules)
        # применяем минимумы из графика, если заданы
        for e, c in (stage.min_counts or {}).items():
            required[e] = c
        devs = detect_deviations(stage, detected, required)
        result["required"] = required
        result["deviations"] = devs
        result["risk_score"] = risk_score(devs)

    return result
