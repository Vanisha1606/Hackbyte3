#!/usr/bin/env bash
# PharmaHub - convenience launcher
# Spawns the Node API, FastAPI AI service, and the React dev server,
# then waits for Ctrl+C to shut them all down.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT/.run-logs"
mkdir -p "$LOG_DIR"

cleanup() {
  echo ""
  echo "→ Stopping PharmaHub services…"
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null || true
  echo "✔ All services stopped."
}
trap cleanup INT TERM EXIT

PIDS=()

echo "→ Starting Node API (backend) on :5001"
(cd "$ROOT/backend" && npm run dev) > "$LOG_DIR/backend.log" 2>&1 &
PIDS+=("$!")

echo "→ Starting FastAPI AI service on :8001"
if [ -d "$ROOT/fastapi_backend/.venv" ]; then
  PY="$ROOT/fastapi_backend/.venv/bin/python"
else
  PY="python3"
fi
(cd "$ROOT/fastapi_backend" && "$PY" -m uvicorn app.main:app --reload --port 8001) \
  > "$LOG_DIR/fastapi.log" 2>&1 &
PIDS+=("$!")

echo "→ Starting Frontend (Vite) on :5173"
(cd "$ROOT/frontend" && npm run dev) > "$LOG_DIR/frontend.log" 2>&1 &
PIDS+=("$!")

echo ""
echo "PharmaHub is starting up. Tail these logs to monitor:"
echo "  tail -f $LOG_DIR/backend.log"
echo "  tail -f $LOG_DIR/fastapi.log"
echo "  tail -f $LOG_DIR/frontend.log"
echo ""
echo "Once ready, open http://localhost:5173"
echo "Press Ctrl+C to stop all services."

wait
