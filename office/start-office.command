#!/bin/bash
# Double-click (macOS) or run from Terminal to start Agent Office,
# then open the default browser once http://127.0.0.1:5184 is ready.
set -u
cd "$(cd "$(dirname "$0")" && pwd)" || exit 1
OFFICE_DIR="$(pwd -P)"
cd "$OFFICE_DIR" || exit 1

PORT=5184
# Prefer 127.0.0.1 — on some Macs "localhost" resolves to ::1 and fails
# when the server only listens on IPv4.
URL="http://127.0.0.1:${PORT}"
ALT_URL="http://localhost:${PORT}"

CURL_BIN="$(command -v curl || echo /usr/bin/curl)"
OPEN_BIN="$(command -v open || echo /usr/bin/open)"

# GUI-launched .command files often miss Homebrew / nvm PATH.
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -1)/bin:/usr/bin:/bin:$PATH"
# shellcheck disable=SC1090
[[ -s "$HOME/.zprofile" ]] && source "$HOME/.zprofile" 2>/dev/null || true
# shellcheck disable=SC1090
[[ -s "$HOME/.bash_profile" ]] && source "$HOME/.bash_profile" 2>/dev/null || true
# shellcheck disable=SC1090
[[ -s "$HOME/.nvm/nvm.sh" ]] && source "$HOME/.nvm/nvm.sh" 2>/dev/null || true

xattr -d com.apple.quarantine "$0" 2>/dev/null || true

server_up() {
  "$CURL_BIN" -sf -o /dev/null --connect-timeout 1 --max-time 2 "$URL" 2>/dev/null \
    || "$CURL_BIN" -sf -o /dev/null --connect-timeout 1 --max-time 2 "$ALT_URL" 2>/dev/null
}

open_browser() {
  # Try several macOS open strategies; always prefer 127.0.0.1 first.
  if [[ -x "$OPEN_BIN" ]] || command -v open >/dev/null 2>&1; then
    local opener="${OPEN_BIN}"
    command -v open >/dev/null 2>&1 && opener="$(command -v open)"
    "$opener" "$URL" 2>/dev/null && return 0
    "$opener" -a Safari "$URL" 2>/dev/null && return 0
    "$opener" -a "Google Chrome" "$URL" 2>/dev/null && return 0
    "$opener" "$ALT_URL" 2>/dev/null && return 0
  fi
  osascript -e "open location \"$URL\"" 2>/dev/null && return 0
  osascript -e "tell application \"Safari\" to open location \"$URL\"" 2>/dev/null && return 0
  return 1
}

show_manual() {
  osascript -e "display alert \"请手动打开网页\" message \"请在浏览器地址栏粘贴：\n\n${URL}\n\n（终端窗口请保持打开。）\" as informational" 2>/dev/null \
    || echo "Open manually: $URL"
  # Also copy URL to clipboard when possible.
  printf '%s' "$URL" | pbcopy 2>/dev/null || true
}

start_python_fallback() {
  if command -v python3 >/dev/null 2>&1; then
    echo "Falling back to python3 http.server on ${PORT}…"
    python3 -m http.server "$PORT" --bind 127.0.0.1
    return $?
  fi
  return 1
}

if ! command -v npm >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1; then
  osascript -e 'display alert "未找到 npm / python3" message "请先安装 Node.js（https://nodejs.org），然后重新双击启动。\n或在终端执行：\ncd '"$OFFICE_DIR"'\nnpm start\n再打开 '"$URL"'" as critical' 2>/dev/null || true
  echo "Install Node.js, then: cd \"$OFFICE_DIR\" && npm start"
  echo "Then open: $URL"
  read -r -p "Press Enter to close…" _
  exit 1
fi

# Already running → just open browser.
if server_up; then
  echo "Server already up → opening $URL"
  open_browser || show_manual
  # Keep a tiny window so the user sees the URL if browser failed.
  if ! server_up; then show_manual; fi
  exit 0
fi

echo "Starting Agent Office → $URL"
echo "Waiting for server, then opening the browser…"
echo "If the page does not load, paste this in the address bar:"
echo "  $URL"
echo "Keep this window open while you use Agent Office."
echo

NPM_PID=""
if command -v npm >/dev/null 2>&1; then
  npm start &
  NPM_PID=$!
else
  start_python_fallback &
  NPM_PID=$!
fi

cleanup() {
  if [[ -n "${NPM_PID}" ]]; then
    kill "$NPM_PID" 2>/dev/null || true
    wait "$NPM_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

opened=0
for _ in $(seq 1 90); do
  if server_up; then
    if open_browser; then
      opened=1
      echo "Browser open requested → $URL"
    else
      show_manual
      opened=1
    fi
    break
  fi
  if ! kill -0 "$NPM_PID" 2>/dev/null; then
    echo "Primary server process exited early."
    break
  fi
  sleep 1
done

if [[ "$opened" -eq 0 ]]; then
  # npm/serve failed — try python fallback once.
  if command -v python3 >/dev/null 2>&1 && ! server_up; then
    echo "Retrying with python3…"
    kill "$NPM_PID" 2>/dev/null || true
    wait "$NPM_PID" 2>/dev/null || true
    python3 -m http.server "$PORT" --bind 127.0.0.1 &
    NPM_PID=$!
    for _ in $(seq 1 20); do
      if server_up; then
        open_browser || show_manual
        opened=1
        break
      fi
      sleep 1
    done
  fi
fi

if [[ "$opened" -eq 0 ]]; then
  show_manual
  osascript -e "display alert \"无法打开网页\" message \"服务可能未启动成功。\n请看本窗口报错，或手动在终端执行：\ncd ${OFFICE_DIR}\nnpm start\n然后访问 ${URL}\" as critical" 2>/dev/null || true
fi

wait "$NPM_PID"
status=$?
trap - EXIT INT TERM
if [[ $status -ne 0 ]]; then
  osascript -e "display alert \"服务已退出\" message \"退出码 ${status}。请手动执行 npm start 后访问：\n${URL}\" as critical" 2>/dev/null || true
  echo "Server exited ($status). Manual: $URL"
  read -r -p "Press Enter to close…" _
fi
exit "$status"
