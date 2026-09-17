#!/usr/bin/env bash
# Запуск MVP в лёгком режиме (без YOLO/PyTorch): API + дашборд.
# Использование:  bash run.sh
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
PY="$ROOT/.venv/bin/python"

if [ ! -x "$PY" ]; then
  echo "[setup] создаю .venv и ставлю лёгкие зависимости..."
  python3 -m venv "$ROOT/.venv"
  "$PY" -m pip install --upgrade pip -q
  "$PY" -m pip install -q -r "$ROOT/requirements-lite.txt"
fi

echo "[run] API :8000   Дашборд :8501"
( cd "$ROOT/backend" && nohup "$PY" -m uvicorn app.main:app --port 8000 >/tmp/csm-uvicorn.log 2>&1 & )
( cd "$ROOT/frontend" && nohup "$PY" -m streamlit run app.py --server.port 8501 --server.headless true >/tmp/csm-streamlit.log 2>&1 & )
sleep 5
echo "API:      http://localhost:8000/docs"
echo "Дашборд:  http://localhost:8501"
