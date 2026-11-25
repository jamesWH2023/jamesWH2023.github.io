@echo off
setlocal EnableExtensions
REM Creates a Desktop shortcut with Agent Office icon (Windows).
cd /d "%~dp0"
set "OFFICE_DIR=%cd%"
set "ICON=%OFFICE_DIR%\assets\app-icon.ico"
set "TARGET=%OFFICE_DIR%\start-office.bat"
set "DESKTOP=%USERPROFILE%\Desktop"
if not exist "%DESKTOP%" if exist "%USERPROFILE%\桌面" set "DESKTOP=%USERPROFILE%\桌面"
set "LNK=%DESKTOP%\启动智能体办公室.lnk"

if not exist "%ICON%" (
  echo Missing icon: %ICON%
  echo Run: git pull, then try again.
  pause
  exit /b 1
)
if not exist "%TARGET%" (
  echo Missing %TARGET%
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%LNK%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%OFFICE_DIR%'; $s.IconLocation = '%ICON%'; $s.Description = 'Agent Office'; $s.Save(); Write-Host 'Created' '%LNK%'"

if errorlevel 1 (
  echo Failed to create shortcut.
  pause
  exit /b 1
)

echo.
echo Desktop shortcut created: 启动智能体办公室.lnk
echo Double-click it to start. Keep the console window open.
echo URL: http://127.0.0.1:5184
pause
