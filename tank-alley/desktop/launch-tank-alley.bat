@echo off
setlocal
rem Tank Alley launcher — starts the local static server and opens the game.
cd /d "%~dp0.."

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install from https://nodejs.org/ then retry.
  pause
  exit /b 1
)

rem Start server only if nothing is listening on 5173 yet (best-effort).
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo Starting Tank Alley on http://localhost:5173 ...
  start "Tank Alley Server" /min cmd /c "npm start"
  timeout /t 3 /nobreak >nul
) else (
  echo Tank Alley server already running.
)
start "" "http://localhost:5173/"
endlocal
