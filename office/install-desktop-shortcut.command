#!/bin/bash
# Creates a one-click Desktop shortcut for Agent Office (macOS).
set -euo pipefail
OFFICE_DIR="$(cd "$(dirname "$0")" && pwd -P)"
DESKTOP="${HOME}/Desktop"
if [[ ! -d "$DESKTOP" ]] && [[ -d "${HOME}/桌面" ]]; then
  DESKTOP="${HOME}/桌面"
fi
NAME="启动智能体办公室.command"
DEST="${DESKTOP}/${NAME}"
URL="http://127.0.0.1:5184"

if [[ ! -d "$DESKTOP" ]]; then
  osascript -e 'display alert "未找到桌面文件夹" message "请手动把 office/start-office.command 复制到桌面。" as critical' 2>/dev/null || true
  echo "Desktop not found. Copy start-office.command to your Desktop manually."
  exit 1
fi

chmod +x "${OFFICE_DIR}/start-office.command" 2>/dev/null || true
chmod +x "$0" 2>/dev/null || true
xattr -cr "${OFFICE_DIR}/start-office.command" 2>/dev/null || true
xattr -d com.apple.quarantine "${OFFICE_DIR}/start-office.command" 2>/dev/null || true
xattr -d com.apple.quarantine "$0" 2>/dev/null || true

cat > "$DEST" <<EOF
#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:\$PATH"
OFFICE_DIR="${OFFICE_DIR}"
cd "\$OFFICE_DIR" || {
  osascript -e "display alert \\"找不到 office 目录\\" message \\"请重新运行 install-desktop-shortcut.command\\" as critical" 2>/dev/null
  exit 1
}
xattr -d com.apple.quarantine "\$OFFICE_DIR/start-office.command" 2>/dev/null || true
exec bash "\$OFFICE_DIR/start-office.command"
EOF

chmod +x "$DEST"
xattr -cr "$DEST" 2>/dev/null || true
xattr -d com.apple.quarantine "$DEST" 2>/dev/null || true

osascript -e "display alert \"快捷方式已就绪\" message \"桌面：${NAME}\n\n双击启动后，浏览器应打开：\n${URL}\n\n若仍无法打开网页，请：\n1. 保持终端窗口打开\n2. 在浏览器地址栏粘贴 ${URL}\n3. 若被拦截：右键快捷方式 → 打开\" as informational" 2>/dev/null || true

echo "Created: $DEST"
echo "Double-click “${NAME}”, then if needed open: $URL"
read -r -p "Press Enter to close…" _
