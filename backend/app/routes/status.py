"""Эндпоинт сверки работы: статус, три оси, прогноз, отклонения (ТЗ v0.2)."""
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import WEEK_MODE
from app.schemas import DayLevel, Downtime, Work
from app.matching.daylevel import work_status
from app.matching.engine import status_deviations, risk_score

router = APIRouter()


class StatusRequest(BaseModel):
    work: Work
    days: List[DayLevel] = []
    downtimes: List[Downtime] = []
    today: Optional[str] = None
    week_mode: Optional[int] = None
    holidays: Optional[List[str]] = None


@router.post("/work-status")
def work_status_endpoint(req: StatusRequest):
    """Возвращает статус работы, метрики, три оси, прогноз и отклонения."""
    info = work_status(
        req.work,
        req.days,
        req.downtimes,
        today=req.today,
        week_mode=req.week_mode or WEEK_MODE,
        holidays=req.holidays,
    )
    devs = status_deviations(req.work, info, today=req.today)
    info["deviations"] = devs
    info["risk_score"] = risk_score(devs)
    return info
