Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Hospital Project Startup Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend
Set-Location "hospital-project\backend"

Write-Host "[1/2] Starting backend server..." -ForegroundColor Green
Write-Host "Backend will run on: http://localhost:5000" -ForegroundColor Green
Start-Process cmd -ArgumentList "/k npm start"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Navigate to frontend
Set-Location "..\frontend"

Write-Host "[2/2] Starting frontend server..." -ForegroundColor Green
Write-Host "Frontend will run on: http://localhost:3000" -ForegroundColor Green
npm start

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "✅ Project Started!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Backend API:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend UI:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Green
