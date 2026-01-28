@echo off
echo ========================================
echo ARDS Backend Server Restart Script
echo ========================================
echo.

echo Step 1: Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo ✅ Node processes stopped
) else (
    echo ℹ️  No Node processes were running
)
echo.

echo Step 2: Waiting for processes to fully stop...
timeout /t 2 /nobreak >nul
echo.

echo Step 3: Starting backend server...
echo.
cd /d "%~dp0"
npm start
