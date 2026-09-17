# Остановить API (8000) и дашборд (8501).
Get-NetTCPConnection -State Listen -LocalPort 8000,8501 -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Write-Host 'Серверы остановлены.'
