"""Оффлайн-демо сквозного пайплайна без UI.

Пример:
  python scripts/demo.py --images data/images --zone A --camera 1 --date 2026-07-10

Если модель YOLO не найдена — детекций не будет; чтобы проверить логику
сопоставления без CV, используйте tests/test_pipeline.py.
"""
import argparse
import glob
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.analyze import analyze_images  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", default="data/images")
    ap.add_argument("--zone", default="A")
    ap.add_argument("--camera", default="1")
    ap.add_argument("--timestamp", default="2026-07-10T10:00:00")
    ap.add_argument("--date", default="2026-07-10")
    args = ap.parse_args()

    paths = []
    for ext in ("*.jpg", "*.jpeg", "*.png"):
        paths.extend(glob.glob(os.path.join(args.images, ext)))
    images = [{"path": p, "camera_id": int(args.camera), "zone": args.zone,
               "timestamp": args.timestamp} for p in paths]

    print(f"Изображений: {len(images)}")
    result = analyze_images(images, on_date=args.date)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
