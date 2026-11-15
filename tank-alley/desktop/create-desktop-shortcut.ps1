# Creates a Desktop shortcut for Tank Alley with the international icon.
# Run:  Right-click → Run with PowerShell
#   or: powershell -ExecutionPolicy Bypass -File .\create-desktop-shortcut.ps1

$ErrorActionPreference = "Stop"
$DesktopDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$GameRoot = Resolve-Path (Join-Path $DesktopDir "..")
$IconPath = Join-Path $DesktopDir "icons\tank-alley.ico"
$BatPath = Join-Path $DesktopDir "launch-tank-alley.bat"
$UserDesktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $UserDesktop "Tank Alley.lnk"

if (-not (Test-Path $IconPath)) {
  Write-Error "Icon not found: $IconPath"
}
if (-not (Test-Path $BatPath)) {
  Write-Error "Launcher not found: $BatPath"
}

$Wsh = New-Object -ComObject WScript.Shell
$Sc = $Wsh.CreateShortcut($ShortcutPath)
$Sc.TargetPath = $BatPath
$Sc.WorkingDirectory = $GameRoot.Path
$Sc.WindowStyle = 7
$Sc.Description = "Tank Alley — WWII-inspired alley combat"
$Sc.IconLocation = "$IconPath,0"
$Sc.Save()

Write-Host "Created Desktop shortcut:"
Write-Host "  $ShortcutPath"
Write-Host "Icon: $IconPath"
Write-Host "Double-click 'Tank Alley' on your Desktop after Node.js is installed."
