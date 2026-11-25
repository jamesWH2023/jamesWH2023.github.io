@echo off
setlocal EnableExtensions
REM One-click start for Agent Office (Windows) — opens default browser when ready.
cd /d "%~dp0"
set "PORT=5184"
REM Prefer 127.0.0.1 to avoid localhost/IPv6 quirks.
set "URL=http://127.0.0.1:%PORT%"
set "ALT_URL=http://localhost:%PORT%"

where npm >nul 2>&1
if errorlevel 1 (
  where python >nul 2>&1
  if errorlevel 1 (
    echo npm/python not found. Install Node.js from https://nodejs.org
    echo Then open %URL% after: npm start
    pause
    exit /b 1
  )
)

REM If server already up, open browser and exit.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -UseBasicParsing '%URL%' -TimeoutSec 2; if ($r.StatusCode -ge 200) { exit 0 } } catch { }; try { $r = Invoke-WebRequest -UseBasicParsing '%ALT_URL%' -TimeoutSec 2; if ($r.StatusCode -ge 200) { exit 0 } } catch { }; exit 1"
if not errorlevel 1 (
  start "" "%URL%"
  exit /b 0
)

echo Starting Agent Office - %URL%
echo Waiting for server, then opening the browser...
echo If the page does not load, paste this in the address bar:
echo   %URL%
echo Keep this window open while you use Agent Office.
echo.

REM Start server in background via start /b, then poll in this window.
where npm >nul 2>&1
if not errorlevel 1 (
  start "AgentOfficeServer" /b cmd /c "npm start"
) else (
  start "AgentOfficeServer" /b cmd /c "python -m http.server %PORT% --bind 127.0.0.1"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$url='%URL%'; $alt='%ALT_URL%'; $opened=$false; for ($i=0; $i -lt 90; $i++) { foreach ($u in @($url,$alt)) { try { $r=Invoke-WebRequest -UseBasicParsing $u -TimeoutSec 1; if ($r.StatusCode -ge 200) { Start-Process $url; $opened=$true; break } } catch {} }; if ($opened) { break }; Start-Sleep -Seconds 1 }; if (-not $opened) { try { Start-Process $url } catch {}; Write-Host \"Open manually: $url\" }"

echo.
echo Server is running. Close this window to stop using Task Manager if needed.
echo Manual URL: %URL%
pause
