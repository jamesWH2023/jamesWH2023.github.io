@echo off
setlocal EnableExtensions
REM One-click start for Agent Office (Windows) — opens default browser when ready.
cd /d "%~dp0"
set "PORT=5184"
set "URL=http://localhost:%PORT%"
set "ALT_URL=http://127.0.0.1:%PORT%"

where npm >nul 2>&1
if errorlevel 1 (
  echo npm not found. Install Node.js from https://nodejs.org
  echo Then run this file again, or:
  echo   cd /d "%~dp0"
  echo   npm start
  echo Then open %URL%
  pause
  exit /b 1
)

REM If server already up, open browser and exit.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -UseBasicParsing '%URL%' -TimeoutSec 2; if ($r.StatusCode -ge 200) { exit 0 } } catch { }; try { $r = Invoke-WebRequest -UseBasicParsing '%ALT_URL%' -TimeoutSec 2; if ($r.StatusCode -ge 200) { exit 0 } } catch { }; exit 1"
if not errorlevel 1 (
  start "" "%URL%"
  exit /b 0
)

REM Detached waiter: poll up to ~90s, then start default browser.
start "" /b powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$url='%URL%'; $alt='%ALT_URL%'; $opened=$false; for ($i=0; $i -lt 90; $i++) { foreach ($u in @($url,$alt)) { try { $r=Invoke-WebRequest -UseBasicParsing $u -TimeoutSec 1; if ($r.StatusCode -ge 200) { Start-Process $url; $opened=$true; break } } catch {} }; if ($opened) { break }; Start-Sleep -Seconds 1 }; if (-not $opened) { try { Start-Process $url } catch {} }"

echo Starting Agent Office - %URL%
echo Browser opens when the server is ready (first run may take longer).
echo If it does not: open %URL% manually.
echo Close this window to stop the server.
echo.

call npm start
set "ERR=%ERRORLEVEL%"
if not "%ERR%"=="0" (
  echo npm start failed ^(%ERR%^). Fix errors, then open %URL% manually.
  pause
)
exit /b %ERR%
