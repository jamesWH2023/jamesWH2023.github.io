#!/bin/bash
# Double-click (macOS) or run from Terminal to start Agent Office,
# then open the default browser once http://localhost:5184 is ready.
set -u
cd "$(cd "$(dirname "$0")" && pwd)" || exit 1
OFFICE_DIR="$(pwd -P)"
cd "$OFFICE_DIR" || exit 1

PORT=5184
URL="http://localhost:${PORT}"
ALT_URL="http://127.0.0.1:${PORT}"

# GUI-launched .command files often miss Homebrew / nvm PATH.
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
# shellcheck disable=SC1090
[[ -s "$HOME/.zprofile" ]] && source "$HOME/.zprofile" 2>/dev/null || true
# shellcheck disable=SC1090
[[ -s "$HOME/.bash_profile" ]] && source "$HOME/.bash_profile" 2>/dev/null || true
# shellcheck disable=SC1090
[[ -s "$HOME/.nvm/nvm.sh" ]] && source "$HOME/.nvm/nvm.sh" 2>/dev/null || true

# Soften Gatekeeper quarantine on this launcher (best-effort).
xattr -d com.apple.quarantine "$0" 2>/dev/null || true

server_up() {
  curl -sf -o /dev/null --connect-timeout 1 --max-time 2 "$URL" 2>/dev/null \
    || curl -sf -o /dev/null --connect-timeout 1 --max-time 2 "$ALT_URL" 2>/dev/null
}

open_browser() {
  # Prefer localhost as documented; fall back to 127.0.0.1 / AppleScript.
  if command -v open >/dev/null 2>&1; then
    open "$URL" 2>/dev/null && return 0
    open "$ALT_URL" 2>/dev/null && return 0
  fi
  osascript -e "open location \"$URL\"" 2>/dev/null && return 0
  return 1
}

show_manual() {
  osascript -e "display alert \"智能体办公室\" message \"浏览器未自动打开时，请手动访问：\n${URL}\n\n（也可在 Safari/Chrome 地址栏粘贴。）\" as informational" 2>/dev/null \
    || echo "Open manually: $URL"
}

if ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display alert "未找到 npm" message "请先安装 Node.js（https://nodejs.org），安装后重新双击启动。\n若已安装仍提示，请用终端执行：\ncd '"$OFFICE_DIR"'\nnpm start" as critical' 2>/dev/null \
    || echo "npm not found. Install Node.js from https://nodejs.org"
  echo "Manual: cd \"$OFFICE_DIR\" && npm start"
  echo "Then open: $URL"
  read -r -p "Press Enter to close…" _
  exit 1
fi

# Already running → just open browser.
if server_up; then
  open_browser || show_manual
  exit 0
fi

# Poll in a detached process so it survives even if this shell is replaced.
# Do NOT use `exec npm` before the opener finishes — that killed the old sleeper.
LOG="${TMPDIR:-/tmp}/agent-office-open.log"
(
  opened=0
  for _ in $(seq 1 90); do
    if server_up; then
      if open_browser; then
        opened=1
        break
      fi
    fi
    sleep 1
  done
  if [[ "$opened" -eq 0 ]]; then
    open_browser || true
    show_manual
  fi
) >"$LOG" 2>&1 &
disown 2>/dev/null || true

echo "Starting Agent Office → $URL"
echo "Browser opens when the server is ready (first run may take longer)."
echo "If it does not: open $URL manually."
echo "Close this window to stop the server."
echo

npm start
status=$?
if [[ $status -ne 0 ]]; then
  osascript -e "display alert \"启动失败\" message \"npm start 退出码 ${status}。\n请在终端检查：\ncd ${OFFICE_DIR}\nnpm start\n然后手动打开 ${URL}\" as critical" 2>/dev/null || true
  echo "npm start failed ($status). Manual: open $URL after fixing."
  read -r -p "Press Enter to close…" _
fi
exit "$status"
