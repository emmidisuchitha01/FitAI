@echo off
title FitAI Virtual Dressing Room - Server Launcher
echo ========================================================
echo               FITAI VIRTUAL DRESSING ROOM
echo ========================================================
echo.
echo [1/2] Starting FitAI Backend on http://127.0.0.1:5000 ...
start "FitAI Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe app.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting FitAI Frontend on http://localhost:5173 ...
start "FitAI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 2 /nobreak >nul
echo.
echo Opening browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo FitAI is now running!
echo Keep the backend and frontend terminal windows open.
echo ========================================================
pause
