# -*- coding: utf-8 -*-
"""Сравнение «наряд + найденная техника -> вердикт».

Зависимостей нет. Положите рядом expected_equipment.json.

Использование:
    from verdict import load_rules, parse_filename, verdict
    rules = load_rules("expected_equipment.json")
    slug, brigade = parse_filename("ef6e2d89_br-1.t-pit-0922.xxx.jpg")
    result = verdict(slug, detections, rules)
    # result -> {"work": "Котлован", "status": "confirmed", "found": ["excavator"]}
"""
import json
import os
import re
from typing import List, Dict, Optional

DEFAULT_PATH = os.path.join(os.path.dirname(__file__), "expected_equipment.json")


def load_rules(path: str = DEFAULT_PATH) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def parse_filename(filename: str) -> (Optional[str], Optional[str]):
    """<uuid>_br-1.t-pit-0922.<rand>.jpg -> (slug, brigade).

    slug = код работы из 't-<slug>' (pit, rebar, concrete, doors ...)
    brigade = 'br-<N>'
    """
    base = os.path.splitext(os.path.basename(filename or ""))[0]
    m = re.search(r"t-([a-z]+)", base)
    slug = m.group(1) if m else None
    b = re.search(r"br-(\d+)", base)
    brigade = f"br-{b.group(1)}" if b else None
    return slug, brigade


def resolve_work(work_name: str, rules: dict) -> Optional[str]:
    """slug / имя наряда -> каноническое имя работы из таблицы."""
    works = rules.get("works", {})
    if not work_name:
        return None
    if work_name in works:
        return work_name
    slugs = rules.get("work_slugs", {})
    if work_name in slugs:
        return slugs[work_name]
    low = _norm(work_name)
    m = re.search(r"t-([a-z]+)", low)
    if m and m.group(1) in slugs:
        return slugs[m.group(1)]
    for key in works:
        k = _norm(key)
        if k and (k in low or low in k):
            return key
    for syn, target in rules.get("synonyms", {}).items():
        if _norm(syn) in low:
            return target
    return None


def resolve_class(name: str, rules: dict) -> str:
    """Класс из YOLO (Excavator / excavator / Экскаватор) -> slug модели."""
    low = _norm(name)
    for c in rules.get("classes", []):
        if low in (_norm(c["slug"]), _norm(c.get("en", "")), _norm(c.get("ru", ""))):
            return c["slug"]
    for c in rules.get("classes", []):
        en = _norm(c.get("en", ""))
        if en and (en in low or low in en):
            return c["slug"]
    return low


def verdict(work_name: str, detections: List[Dict], rules: dict) -> Dict:
    """Главная функция. detections — [{"class": "...", "confidence": 0.9, "bbox": [...]}].

    Возвращает:
      work        — каноническая работа («Котлован»)
      status      — confirmed | not_confirmed | review | unsure
      required    — ожидаемые классы
      found       — найденные классы (slug), с уверенностью >= min_confidence
      detections  — сколько детекций всего
    """
    key = resolve_work(work_name, rules)
    if not key or key not in rules.get("works", {}):
        return {"work": work_name, "status": "unsure",
                "required": [], "found": [], "detections": len(detections or []),
                "reason": "работа не найдена в таблице"}

    required = rules["works"][key].get("required", {})
    min_conf = rules.get("verdict", {}).get("min_confidence", 0.5)

    found: Dict[str, int] = {}
    for d in (detections or []):
        if (d.get("confidence") or 0) >= min_conf:
            slug = resolve_class(d.get("class", ""), rules)
            found[slug] = found.get(slug, 0) + 1

    if not detections:
        status = "review"              # нейросеть ничего не нашла -> прорабу «переснять»
    elif any(found.get(c, 0) >= m for c, m in required.items()):
        status = "confirmed"           # нашлась ожидаемая техника
    else:
        status = "not_confirmed"       # детекции были, но не те

    return {
        "work": key,
        "status": status,
        "required": list(required.keys()),
        "found": list(found.keys()),
        "detections": len(detections or []),
    }


if __name__ == "__main__":
    rules = load_rules()
    demo = [
        ("pit",      [{"class": "Excavator", "confidence": 0.9}]),
        ("concrete", [{"class": "Mixer", "confidence": 0.89}]),
        ("rebar",    []),
        ("doors",    [{"class": "Excavator", "confidence": 0.8}]),
    ]
    for w, dets in demo:
        print(w, "->", verdict(w, dets, rules))
