@echo off
REM One-click start for Agent Office (Windows)
cd /d "%~dp0"
set PORT=5184
set URL=http://127.0.0.1:%PORT%

where npm >nul 2>&1
if errorlevel 1 (
  echo npm not found. Install Node.js from https://nodejs.org
  pause
  exit /b 1
)

curl -sf -o nul %URL% >nul 2>&1
if not errorlevel 1 (
  start "" %URL%
  exit /b 0
)

start "" cmd /c "timeout /t 2 /nobreak >nul & start %URL%"
echo Starting Agent Office - %URL%
echo Close this window to stop the server.
call npm start
pause
