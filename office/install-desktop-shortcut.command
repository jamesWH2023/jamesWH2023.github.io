#!/bin/bash
# Creates a branded Desktop .app for Agent Office (macOS) with custom icon.
set -euo pipefail
OFFICE_DIR="$(cd "$(dirname "$0")" && pwd -P)"
ASSETS="${OFFICE_DIR}/assets"
DESKTOP="${HOME}/Desktop"
if [[ ! -d "$DESKTOP" ]] && [[ -d "${HOME}/桌面" ]]; then
  DESKTOP="${HOME}/桌面"
fi
APP_NAME="启动智能体办公室"
APP_PATH="${DESKTOP}/${APP_NAME}.app"
URL="http://127.0.0.1:5184"

if [[ ! -d "$DESKTOP" ]]; then
  osascript -e 'display alert "未找到桌面文件夹" message "请手动运行 office/start-office.command。" as critical' 2>/dev/null || true
  echo "Desktop not found."
  exit 1
fi

chmod +x "${OFFICE_DIR}/start-office.command" 2>/dev/null || true
chmod +x "$0" 2>/dev/null || true
xattr -cr "${OFFICE_DIR}/start-office.command" 2>/dev/null || true
xattr -d com.apple.quarantine "${OFFICE_DIR}/start-office.command" 2>/dev/null || true
xattr -d com.apple.quarantine "$0" 2>/dev/null || true

# Prefer prebuilt .icns; rebuild from PNG with iconutil when available.
ICNS_SRC="${ASSETS}/AppIcon.icns"
PNG_SRC="${ASSETS}/app-icon.png"
ICONSET="${ASSETS}/AppIcon.appiconset"
ICNS_BUILD="${TMPDIR:-/tmp}/AgentOfficeAppIcon-$$.icns"

if command -v iconutil >/dev/null 2>&1 && [[ -d "$ICONSET" ]]; then
  if iconutil -c icns "$ICONSET" -o "$ICNS_BUILD" 2>/dev/null; then
    ICNS_SRC="$ICNS_BUILD"
  fi
fi

if [[ ! -f "$ICNS_SRC" && -f "$PNG_SRC" ]] && command -v sips >/dev/null 2>&1; then
  # Last-resort: use PNG as icon source via temporary iconset
  TMPSET="${TMPDIR:-/tmp}/AgentOfficeIconset-$$.iconset"
  mkdir -p "$TMPSET"
  for px in 16 32 128 256 512; do
    sips -z "$px" "$px" "$PNG_SRC" --out "${TMPSET}/icon_${px}x${px}.png" >/dev/null
    sips -z $((px * 2)) $((px * 2)) "$PNG_SRC" --out "${TMPSET}/icon_${px}x${px}@2x.png" >/dev/null
  done
  if iconutil -c icns "$TMPSET" -o "$ICNS_BUILD" 2>/dev/null; then
    ICNS_SRC="$ICNS_BUILD"
  fi
  rm -rf "$TMPSET"
fi

if [[ ! -f "$ICNS_SRC" ]]; then
  osascript -e 'display alert "缺少图标文件" message "未找到 office/assets/AppIcon.icns 或 app-icon.png。请 git pull 最新分支后再试。" as critical' 2>/dev/null || true
  echo "Missing icon assets under office/assets/"
  exit 1
fi

# Remove previous Desktop launcher (.app or legacy .command)
rm -rf "$APP_PATH"
rm -f "${DESKTOP}/${APP_NAME}.command" 2>/dev/null || true

mkdir -p "${APP_PATH}/Contents/MacOS" "${APP_PATH}/Contents/Resources"
cp "$ICNS_SRC" "${APP_PATH}/Contents/Resources/AppIcon.icns"

cat > "${APP_PATH}/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>zh_CN</string>
  <key>CFBundleDisplayName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleExecutable</key>
  <string>AgentOffice</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleIdentifier</key>
  <string>com.jameswh.agent-office.desktop</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>11.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST

cat > "${APP_PATH}/Contents/MacOS/AgentOffice" <<EOF
#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:\$PATH"
OFFICE_DIR="${OFFICE_DIR}"
cd "\$OFFICE_DIR" || {
  osascript -e 'display alert "找不到 office 目录" message "请重新运行 install-desktop-shortcut.command" as critical'
  exit 1
}
xattr -d com.apple.quarantine "\$OFFICE_DIR/start-office.command" 2>/dev/null || true
chmod +x "\$OFFICE_DIR/start-office.command" 2>/dev/null || true

# Open in Terminal so the local server stays visible / stoppable.
osascript <<APPLESCRIPT
tell application "Terminal"
  activate
  do script "cd " & quoted form of "$OFFICE_DIR" & " && bash ./start-office.command"
end tell
APPLESCRIPT
EOF
chmod +x "${APP_PATH}/Contents/MacOS/AgentOffice"

# Clear quarantine so first launch is smoother
xattr -cr "$APP_PATH" 2>/dev/null || true
xattr -d com.apple.quarantine "$APP_PATH" 2>/dev/null || true

# Touch to refresh Finder icon cache
touch "$APP_PATH"
# Ask Finder / Dock to notice the new icon
osascript -e "tell application \"Finder\" to update POSIX file \"${APP_PATH}\"" 2>/dev/null || true

rm -f "$ICNS_BUILD" 2>/dev/null || true

osascript -e "display alert \"桌面图标已就绪\" message \"桌面应用：${APP_NAME}.app\n（带自定义图标）\n\n双击即可启动；终端窗口请保持打开。\n网页地址：${URL}\n\n若被拦截：右键 → 打开\" as informational" 2>/dev/null || true

echo "Created: $APP_PATH"
echo "Double-click “${APP_NAME}.app” on your Desktop (custom icon)."
echo "Manual URL if needed: $URL"
read -r -p "Press Enter to close…" _
