# Iniciar todo el sistema DocuClas
Write-Host "=== Iniciando DocuClas ===" -ForegroundColor Cyan

# Docker - Envoy
Write-Host "Iniciando Envoy..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\gateway'; docker-compose up"

# Clasificador Python
Write-Host "Iniciando Clasificador..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\classifier'; .\venv\Scripts\activate; uvicorn main:app --host 0.0.0.0 --port 8090 --reload"

# Servicios Rust
Write-Host "Iniciando servicios Rust..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; cargo run -p auth-service"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; cargo run -p topic-service"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; cargo run -p doc-service"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; cargo run -p admin-service"

# Frontend
Write-Host "Iniciando Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; npm run dev"

Write-Host "=== Todo iniciado ===" -ForegroundColor Cyan