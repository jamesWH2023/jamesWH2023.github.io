#!/bin/bash
# Creates a one-click Desktop shortcut for Agent Office (macOS).
set -e
OFFICE_DIR="$(cd "$(dirname "$0")" && pwd)"
DESKTOP="${HOME}/Desktop"
NAME="启动智能体办公室.command"
DEST="${DESKTOP}/${NAME}"

if [[ ! -d "$DESKTOP" ]]; then
  echo "Desktop not found: $DESKTOP"
  exit 1
fi

cat > "$DEST" <<EOF
#!/bin/bash
cd "${OFFICE_DIR}"
exec "${OFFICE_DIR}/start-office.command"
EOF

chmod +x "$DEST"
chmod +x "${OFFICE_DIR}/start-office.command"

# Clear macOS quarantine so double-click works after download.
xattr -d com.apple.quarantine "$DEST" 2>/dev/null || true
xattr -d com.apple.quarantine "${OFFICE_DIR}/start-office.command" 2>/dev/null || true

osascript -e "display notification \"已创建：桌面/${NAME}\" with title \"智能体办公室\"" 2>/dev/null || true
echo "Created: $DEST"
echo "Double-click “${NAME}” on your Desktop to start."
read -r -p "Press Enter to close…" _
