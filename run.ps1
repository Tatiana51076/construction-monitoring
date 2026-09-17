# Запуск MVP в лёгком режиме (без YOLO/PyTorch): API + дашборд.
# Использование:  powershell -ExecutionPolicy Bypass -File .\run.ps1
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$venv = Join-Path $root '.venv'
$py   = Join-Path $venv 'Scripts\python.exe'

if (-not (Test-Path $py)) {
    Write-Host '[setup] создаю .venv и ставлю лёгкие зависимости...'
    python -m venv $venv
    & $py -m pip install --upgrade pip -q
    & $py -m pip install -q -r (Join-Path $root 'requirements-lite.txt')
}

Write-Host '[run] API :8000   Дашборд :8501'
Start-Process -FilePath $py -ArgumentList '-m','uvicorn','app.main:app','--port','8000' -WorkingDirectory (Join-Path $root 'backend')
Start-Process -FilePath $py -ArgumentList '-m','streamlit','run','app.py','--server.port','8501','--server.headless','true' -WorkingDirectory (Join-Path $root 'frontend')
Start-Sleep -Seconds 8
Write-Host ''
Write-Host 'API:      http://localhost:8000/docs'
Write-Host 'Дашборд:  http://localhost:8501'
Write-Host 'Остановить: .\stop.ps1'
