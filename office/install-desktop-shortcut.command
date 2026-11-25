#!/bin/bash
# Creates a one-click Desktop shortcut for Agent Office (macOS).
set -euo pipefail
OFFICE_DIR="$(cd "$(dirname "$0")" && pwd -P)"
DESKTOP="${HOME}/Desktop"
# Localized Desktop folder (e.g. 桌面) if present.
if [[ ! -d "$DESKTOP" ]] && [[ -d "${HOME}/桌面" ]]; then
  DESKTOP="${HOME}/桌面"
fi
NAME="启动智能体办公室.command"
DEST="${DESKTOP}/${NAME}"

if [[ ! -d "$DESKTOP" ]]; then
  osascript -e 'display alert "未找到桌面文件夹" message "请手动把 office/start-office.command 复制到桌面并允许执行。" as critical' 2>/dev/null || true
  echo "Desktop not found. Copy start-office.command to your Desktop manually."
  exit 1
fi

chmod +x "${OFFICE_DIR}/start-office.command" 2>/dev/null || true
chmod +x "$0" 2>/dev/null || true

# Clear Gatekeeper quarantine so double-click works after git clone / download.
xattr -cr "${OFFICE_DIR}/start-office.command" 2>/dev/null || true
xattr -d com.apple.quarantine "${OFFICE_DIR}/start-office.command" 2>/dev/null || true
xattr -d com.apple.quarantine "$0" 2>/dev/null || true

# Desktop launcher: resolve office dir, then hand off to start-office.command.
cat > "$DEST" <<EOF
#!/bin/bash
# Auto-generated Agent Office desktop launcher — do not edit path by hand.
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:\$PATH"
OFFICE_DIR="${OFFICE_DIR}"
cd "\$OFFICE_DIR" || {
  osascript -e "display alert \\"找不到 office 目录\\" message \\"路径已失效：\${OFFICE_DIR}\\n请重新运行 install-desktop-shortcut.command\\" as critical" 2>/dev/null
  exit 1
}
xattr -d com.apple.quarantine "\$OFFICE_DIR/start-office.command" 2>/dev/null || true
exec bash "\$OFFICE_DIR/start-office.command"
EOF

chmod +x "$DEST"
xattr -cr "$DEST" 2>/dev/null || true
xattr -d com.apple.quarantine "$DEST" 2>/dev/null || true

osascript -e "display notification \"已创建桌面快捷方式：${NAME}\" with title \"智能体办公室\"" 2>/dev/null || true
osascript -e "display alert \"快捷方式已就绪\" message \"桌面文件：${NAME}\n\n双击即可启动并打开浏览器（http://localhost:5184）。\n若系统拦截：右键 → 打开。\n若仍无浏览器：手动访问 http://localhost:5184\" as informational" 2>/dev/null || true

echo "Created: $DEST"
echo "Double-click “${NAME}” on your Desktop to start."
echo "Manual fallback: open http://localhost:5184 after the server starts."
read -r -p "Press Enter to close…" _
