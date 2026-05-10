# Iniciar todos los servicios de DocuClas
Write-Host "Iniciando DocuClas..." -ForegroundColor Green

# Auth Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; cargo run -p auth-service"

# Topic Service  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; cargo run -p topic-service"

# Doc Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; cargo run -p doc-service"

# Admin Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; cargo run -p admin-service"

Write-Host "Servicios iniciados en terminales separadas." -ForegroundColor Green