"""Эндпоинт сквозного анализа."""
import os
import shutil
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, File, Form, UploadFile

from app.config import YOLO_MODEL
from app.services.analyze import analyze_images

router = APIRouter()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/analyze")
async def analyze(
    files: List[UploadFile] = File(..., description="Снимки с камер"),
    camera_id: Optional[str] = Form(None),
    zone: Optional[str] = Form(None),
    timestamp: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    schedule_path: str = Form("data/schedule.example.csv"),
):
    """Принимает снимки и возвращает этап, технику и отклонения."""
    images = []
    for f in files:
        dest = os.path.join(UPLOAD_DIR, f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{f.filename}")
        with open(dest, "wb") as out:
            shutil.copyfileobj(f.file, out)
        images.append({
            "path": dest,
            "camera_id": int(camera_id) if camera_id else None,
            "zone": zone,
            "timestamp": timestamp,
        })

    return analyze_images(images, schedule_path=schedule_path, on_date=date)
