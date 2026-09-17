import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:  # dotenv необязателен
    pass

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./constructions.db")
YOLO_MODEL = os.getenv("YOLO_MODEL", "models/best.pt")
CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.35"))
IOU_THRESHOLD = float(os.getenv("IOU_THRESHOLD", "0.45"))

# Дедупликация между камерами
DEDUP_DISTANCE = float(os.getenv("DEDUP_DISTANCE", "3.0"))
DEDUP_WINDOW_MIN = int(os.getenv("DEDUP_WINDOW_MIN", "5"))

# --- Пороги сверки (ТЗ v0.2, разделы 6, 9, 10, 12, 13) ---
DEFAULT_CONFIRM_THRESHOLD = float(os.getenv("CONFIRM_THRESHOLD", "0.6"))
COVERAGE_MIN = float(os.getenv("COVERAGE_MIN", "0.6"))          # R4: ниже — «недостаточно данных»
MISSING_DAYS = int(os.getenv("MISSING_DAYS", "2"))              # R3: N дней подряд «ничего»
FALSE_COMPLETION_MIN_COVERAGE = float(os.getenv("FALSE_COMPLETION_MIN_COVERAGE", "0.6"))
FALSE_COMPLETION_MAX_LEVEL2 = float(os.getenv("FALSE_COMPLETION_MAX_LEVEL2", "0.4"))
AXIS_GAP_PP = float(os.getenv("AXIS_GAP_PP", "20"))             # R8: разрыв осей, п.п.
IDLE_MOVE_REQUIRED = os.getenv("IDLE_MOVE_REQUIRED", "true").lower() == "true"

# Режим недели: 5 — пятидневка, 6 — шестидневка
WEEK_MODE = int(os.getenv("WEEK_MODE", "5"))
HOLIDAYS: list[str] = [h.strip() for h in os.getenv("HOLIDAYS", "").split(",") if h.strip()]

# Коды простоев без вины подрядчика (ТЗ v0.2, раздел 19)
DOWNTIME_REASONS = {
    "weather": "погодные условия",
    "access_not_granted": "не предоставлен доступ/фронт работ",
    "design_documentation": "нет/задержана проектная документация",
    "customer_materials": "не поставлены материалы/оборудование заказчика",
    "adjacent_works": "не завершены работы смежников",
    "technology_break": "технологический перерыв (выдержка/набор прочности)",
    "external_restriction": "внешние ограничения (отключение, режим, погрузка/разгрузка)",
    "force_majeure": "форс-мажор",
    "design_error": "ошибка проектирования/коллизия",
}

# Классы техники (обязательный перечень из ТЗ)
EQUIPMENT_CLASSES = [
    "dump_truck",        # самосвал
    "excavator",         # экскаватор
    "roller",            # каток
    "manipulator_crane", # кран-манипулятор
    "concrete_mixer",    # бетоносмеситель
    "bulldozer",         # бульдозер
    "truck",             # грузовик
    "truck_crane",       # автокран
]
