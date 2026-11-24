#!/bin/bash
# Double-click (macOS) or run from Terminal to start Agent Office.
set -e
cd "$(dirname "$0")"
PORT=5184
URL="http://127.0.0.1:${PORT}"

if ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display alert "未找到 npm" message "请先安装 Node.js（https://nodejs.org），然后再试。" as critical' 2>/dev/null || echo "npm not found. Install Node.js first."
  exit 1
fi

# Reuse an already-running server if present.
if curl -sf -o /dev/null "$URL"; then
  open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true
  exit 0
fi

# Open the browser shortly after serve starts.
(sleep 1.5; open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true) &

echo "Starting Agent Office → $URL"
echo "Close this window to stop the server."
exec npm start
