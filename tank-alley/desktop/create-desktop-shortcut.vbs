' Fallback Windows helper (no PowerShell execution-policy needed).
' Double-click to place "Tank Alley.lnk" on the Desktop.

Option Explicit
Dim sh, fso, here, gameRoot, iconPath, batPath, desktop, shortcut
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

here = fso.GetParentFolderName(WScript.ScriptFullName)
gameRoot = fso.GetAbsolutePathName(here & "\..")
iconPath = here & "\icons\tank-alley.ico"
batPath = here & "\launch-tank-alley.bat"
desktop = sh.SpecialFolders("Desktop")

If Not fso.FileExists(iconPath) Then
  MsgBox "Icon missing: " & iconPath, vbCritical, "Tank Alley"
  WScript.Quit 1
End If
If Not fso.FileExists(batPath) Then
  MsgBox "Launcher missing: " & batPath, vbCritical, "Tank Alley"
  WScript.Quit 1
End If

Set shortcut = sh.CreateShortcut(desktop & "\Tank Alley.lnk")
shortcut.TargetPath = batPath
shortcut.WorkingDirectory = gameRoot
shortcut.WindowStyle = 7
shortcut.Description = "Tank Alley — WWII-inspired alley combat"
shortcut.IconLocation = iconPath & ",0"
shortcut.Save

MsgBox "Desktop shortcut created:" & vbCrLf & desktop & "\Tank Alley.lnk", vbInformation, "Tank Alley"
