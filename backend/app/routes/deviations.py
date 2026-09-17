"""Список сохранённых отклонений."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Deviation

router = APIRouter()


@router.get("/deviations")
def list_deviations(limit: int = 100, db: Session = Depends(get_db)):
    rows = db.query(Deviation).order_by(Deviation.created_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "stage_name": r.stage_name,
            "zone": r.zone,
            "type": r.type,
            "severity": r.severity,
            "message": r.message,
            "image_path": r.image_path,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
