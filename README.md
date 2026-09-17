# 🏗️ Construction Site Monitoring (MVP)

Интеллектуальная система мониторинга строительной площадки: по снимкам с камер
обнаруживает строительную технику, сопоставляет её с календарным планом работ
и выявляет отклонения с понятным объяснением.

## Что делает (обязательные функции ТЗ)

1. **Обнаружение и классификация техники** — YOLO (самосвал, экскаватор, каток,
   кран-манипулятор, бетоносмеситель, бульдозер, грузовик, автокран).
2. **Сопоставление с графиком** — правила «этап работ → необходимая техника».
3. **Выявление отклонений** — нет нужной техники, лишняя техника, дефицит, не та зона.
4. **Визуализация** — дашборд: текущий этап, техника, отклонения со снимками.

## Архитектура

```
Снимки + график
      │
  CV-сервис (YOLO + dedup)   ← дедупликация между камерами
      │
  Matching Engine (этап → техника)
      │
  Deviation Detector (+ risk score)
      │
  Web UI (Streamlit) / REST API (FastAPI)
```

- **Backend:** FastAPI
- **CV:** Ultralytics YOLO
- **БД:** PostgreSQL (в демо можно SQLite)
- **Frontend:** Streamlit (быстро) — легко заменить на React
- **Docker:** `docker-compose.yml`

## Быстрый старт (локально)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Дашборд:
```bash
cd frontend
pip install -r requirements.txt
streamlit run app.py
```

Откройте http://localhost:8501 — загрузите снимки и `data/schedule.example.csv`.

## Быстрый старт (Docker)

```bash
docker compose up --build
```
- API: http://localhost:8000/docs
- Dashboard: http://localhost:8501

## Структура

```
backend/app/
  main.py            # FastAPI-приложение
  cv/detector.py     # детекция YOLO
  cv/dedup.py        # дедупликация между камерами (один объект = один)
  matching/schedule.py  # парсинг календарного плана (каноническая форма)
  matching/rules.py     # правила «работа → техника»
  matching/daylevel.py  # уровни дня 0/1/2/null, статусы, три оси, прогноз
  matching/engine.py    # сопоставление + отклонения (R1–R8) + risk score
  services/analyze.py   # сквозной пайплайн
  routes/analyze.py     # POST /api/analyze — по снимкам
  routes/status.py      # POST /api/work-status — статус/оси/прогноз
  routes/schedule.py    # GET  /api/schedule, /api/rules
  routes/deviations.py  # GET  /api/deviations
data/
  schedule.example.csv  # пример графика (каноническая форма)
  equipment_rules.json  # правила работа → техника
frontend/app.py         # Streamlit-дашборд
docs/TZ.md              # ТЗ v0.2
docs/REQUIREMENTS.md    # требования и правила сверки (выжимка)
docs/MODEL.md           # модель данных, ограничения
tests/run_all.py        # прогон тестов без pytest
```

## Статусы и правила (ТЗ v0.2)

Уровень дня: `2` работа идёт · `1` только ресурсы · `0` ничего · `null` кадров нет.
Статусы: `in_progress`, `resources_only`, `nothing_detected`, `insufficient`,
`not_checked`, `not_started`, `manual_resolved`, `false_completion`.
Правила R1–R8 (порог подтверждения, ложное завершение, сроки, отчётность) —
в `matching/daylevel.py` и `matching/engine.py`; пороги — в `app/config.py`.

## Тесты

```bash
python tests/run_all.py          # без pytest
pytest -q                        # если установлен pytest
```

## Классы техники

`dump_truck, excavator, roller, manipulator_crane, concrete_mixer, bulldozer, truck, truck_crane`

## Ограничения MVP

- Модель обучена/протестирована на ограниченном наборе (см. `docs/MODEL.md`).
- Трекинг «поведения» — по серии снимков (присутствие/длительность), без видео.
- Настроены правила для 5 этапов; расширяется через `equipment_rules.json`.

## Лицензия

Учебный/хакатонный прототип.
