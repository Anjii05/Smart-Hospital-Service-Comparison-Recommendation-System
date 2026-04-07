@echo off
echo ============================================
echo Hospital Project Startup Script
echo ============================================
echo.

cd hospital-project\backend
echo [1/3] Installing backend dependencies...
call npm install
echo.

echo [2/3] Initializing database...
call node db-setup.js
echo.

echo [3/3] Starting backend server...
start "Backend Server" cmd /k "npm start"
echo.

cd ..\frontend
echo [4/4] Installing frontend dependencies...
call npm install
echo.

echo Starting frontend server...
start "Frontend Server" cmd /k "npm start"
echo.

echo ============================================
echo ✅ Project started!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo ============================================
pause
