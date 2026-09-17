"""Pydantic-схемы пайплайна и канонической формы работы (ТЗ v0.2)."""
from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict

from app.config import DEFAULT_CONFIRM_THRESHOLD


class Detection(BaseModel):
    """Обнаружение техники на кадре."""
    equipment_type: str
    confidence: float
    bbox: List[float]          # [x1, y1, x2, y2]
    camera_id: Optional[int] = None
    zone: Optional[str] = None
    timestamp: Optional[str] = None
    world_x: Optional[float] = None
    world_y: Optional[float] = None


class Downtime(BaseModel):
    """Простой без вины подрядчика (ТЗ v0.2, раздел 19).

    День с `document` исключается из расчёта (серый, ни за, ни против подрядчика).
    Без документа — «заявленный простой, требует подтверждения».
    """
    date: str
    reason: str                       # код из config.DOWNTIME_REASONS
    document: Optional[str] = None
    comment: Optional[str] = None
    approved_by: Optional[str] = None


class DayLevel(BaseModel):
    """Оценка наблюдаемости работы за день (ТЗ v0.2, раздел 8)."""
    date: str
    level: Optional[int] = None       # 2 — работа идёт, 1 — только ресурсы, 0 — ничего, None — кадров нет
    detected: Dict[str, int] = {}     # уникальная техника после дедупа
    moved: bool = False               # меняла ли техника положение за смену
    people: int = 0


class Work(BaseModel):
    """Каноническая форма работы (план/факт), ТЗ v0.2, п.6."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Optional[str] = None
    object_id: Optional[str] = None
    name: str
    zone: str
    contractor: Optional[str] = None
    plan_start: str
    plan_end: str
    required_equipment: List[str] = []
    min_counts: Dict[str, int] = {}
    confirm_threshold: float = DEFAULT_CONFIRM_THRESHOLD
    fact_percent: float = 0.0
    zone_type: str = "area"           # area | linear
    fact_start: Optional[str] = None
    fact_end: Optional[str] = None
    responsible: Optional[str] = None
    volume: Optional[float] = None
    unit: Optional[str] = None
    predecessors: List[str] = []
    source: Optional[str] = None
    version: Optional[str] = None
    min_people: int = 1

    # Синонимы для совместимости со старым кодом (start_date/end_date).
    @property
    def start_date(self) -> str:
        return self.plan_start

    @property
    def end_date(self) -> str:
        return self.plan_end


class ScheduleStage(Work):
    """Устаревшее имя `Work`. Принимает start_date/end_date как синонимы plan_start/plan_end."""

    def __init__(self, **data):
        if "start_date" in data and "plan_start" not in data:
            data["plan_start"] = data.pop("start_date")
        if "end_date" in data and "plan_end" not in data:
            data["plan_end"] = data.pop("end_date")
        super().__init__(**data)


class WorkStatus(BaseModel):
    """Результат сверки работы: статус (Ось 1), метрики и три оси (ТЗ v0.2, разделы 9, 11)."""
    work: Optional[str] = None
    zone: Optional[str] = None
    status: str
    level2_days: int = 0
    level1_days: int = 0
    level0_days: int = 0
    no_frames_days: int = 0
    working_days: int = 0
    coverage: float = 0.0
    level2_ratio: float = 0.0
    axes: Dict[str, float] = {}       # plan_today / declared / confirmed
    gap_pp: float = 0.0               # declared - confirmed, п.п.
    forecast_end: Optional[str] = None
    deviations: List[dict] = []


class AnalyzeResponse(BaseModel):
    """Ответ анализа одного набора снимков."""
    stage_name: Optional[str]
    zone: Optional[str]
    detected: Dict[str, int]                 # тип -> количество (уникальных)
    required: Dict[str, int]
    deviations: List[dict]
