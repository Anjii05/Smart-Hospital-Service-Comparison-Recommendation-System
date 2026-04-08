@echo off
echo ============================================
echo Hospital Project Startup Script
echo ============================================
echo.

cd hospital-project\backend
echo [1/2] Starting backend server...
start "Backend Server" cmd /k "npm start"
echo.

cd ..\frontend
echo [2/2] Starting frontend server...
start "Frontend Server" cmd /k "npm start"
echo.

echo ============================================
echo ✅ Project started!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo ============================================
pause
