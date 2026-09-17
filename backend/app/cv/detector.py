"""Детекция строительной техники через YOLO (Ultralytics).

Модуль намеренно изолирован: чтобы заменить модель, достаточно поменять
внутренности `EquipmentDetector.detect`, не трогая остальной пайплайн.
"""
from typing import List, Optional
from app.config import YOLO_MODEL, CONF_THRESHOLD, IOU_THRESHOLD
from app.schemas import Detection


class EquipmentDetector:
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or YOLO_MODEL
        self.model = None
        self._load()

    def _load(self):
        # Ленивая загрузка: если модель недоступна — модуль всё равно импортируется.
        try:
            from ultralytics import YOLO  # type: ignore
            self.model = YOLO(self.model_path)
        except Exception as e:  # pragma: no cover - зависит от окружения
            print(f"[WARN] YOLO не загружен ({e}). Детекция будет возвращать пусто.")
            self.model = None

    def detect(self, image_path: str, camera_id: Optional[int] = None,
               zone: Optional[str] = None) -> List[Detection]:
        """Возвращает список детекций на изображении."""
        if self.model is None:
            return []
        results = self.model.predict(source=image_path, conf=CONF_THRESHOLD,
                                     iou=IOU_THRESHOLD, verbose=False)
        out: List[Detection] = []
        for r in results:
            names = r.names
            for box in r.boxes:
                cls_id = int(box.cls[0])
                out.append(Detection(
                    equipment_type=names.get(cls_id, str(cls_id)),
                    confidence=float(box.conf[0]),
                    bbox=[float(x) for x in box.xyxy[0].tolist()],
                    camera_id=camera_id,
                    zone=zone,
                ))
        return out
