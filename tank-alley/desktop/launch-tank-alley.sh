#!/usr/bin/env bash
# Cross-platform-ish launcher used by Linux .desktop / macOS.command
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required: https://nodejs.org/" >&2
  exit 1
fi

port_busy() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | grep -q ':5173 '
  elif command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1
  else
    return 1
  fi
}

if ! port_busy; then
  npm start >/tmp/tank-alley-serve.log 2>&1 &
  sleep 2
fi

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:5173/"
elif command -v open >/dev/null 2>&1; then
  open "http://localhost:5173/"
else
  echo "Open http://localhost:5173/ in your browser"
fi
