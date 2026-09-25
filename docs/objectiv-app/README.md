# Фронтенд «Объектив» (наша часть)

Статическая сборка интерфейса мониторинга строительной площадки.

**Что это:** готовый фронт (React), который обращается к API по относительным путям —
поэтому его достаточно **отдавать с того же сервера, что и API** (CORS не нужен).

**Как поднять (FastAPI):**
```python
from fastapi.staticfiles import StaticFiles
app.mount("/app", StaticFiles(directory="frontend", html=True), name="frontend")
```
Откроется по адресу `http://<host>:8000/app/`.

**Файлы:**
- `index.html` — точка входа
- `assets/` — скрипты и стили
- `camera-zone-a/b/c.webp` — изображения камер (демо)

**API, которые использует фронт:** `GET /health`, `POST /upload`, `GET /photos`,
`GET /api/foreman/objects`, `GET /api/foreman/leaderboard`.
