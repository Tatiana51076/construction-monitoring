from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from app.database import Base


class Camera(Base):
    """Камера и зона, которую она покрывает (для привязки к этапам)."""
    __tablename__ = "cameras"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    zone = Column(String(50), nullable=False)          # A, B, C...
    is_primary_for_zone = Column(Integer, default=1)    # 1 — главная камера зоны (для дедупа)


class Stage(Base):
    """Этап календарного плана."""
    __tablename__ = "stages"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    zone = Column(String(50), nullable=False)
    required_equipment = Column(Text, nullable=False)   # JSON: ["excavator", "dump_truck"]
    min_counts = Column(Text, nullable=True)            # JSON: {"excavator": 1, "dump_truck": 2}


class Observation(Base):
    """Наблюдение техники на снимке (после детекции и дедупликации)."""
    __tablename__ = "observations"
    id = Column(Integer, primary_key=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    equipment_type = Column(String(50), nullable=False)
    count = Column(Integer, default=1)
    confidence = Column(Float, default=0.0)
    image_path = Column(String(500), nullable=True)
    world_x = Column(Float, nullable=True)   # координата на плане (если есть калибровка)
    world_y = Column(Float, nullable=True)


class Deviation(Base):
    """Выявленное отклонение с объяснением."""
    __tablename__ = "deviations"
    id = Column(Integer, primary_key=True)
    stage_id = Column(Integer, ForeignKey("stages.id"), nullable=True)
    stage_name = Column(String(255), nullable=True)
    zone = Column(String(50), nullable=True)
    type = Column(String(50), nullable=False)        # missing/undercapacity/unexpected/zone_mismatch
    severity = Column(String(20), default="medium")  # low/medium/high
    message = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
