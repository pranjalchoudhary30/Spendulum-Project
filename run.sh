#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Spendulum 2.0 — macOS / Linux launcher
#  Usage:
#    chmod +x run.sh
#    ./run.sh           # normal start
#    ./run.sh --dev     # hot-reload dev mode
#    ./run.sh --reset   # reseed demo data
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════╗"
echo "║   Spendulum 2.0  🚀          ║"
echo "╚══════════════════════════════╝"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "✖  Python 3 not found. Install from https://python.org" && exit 1
fi
PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "✔  Python $PY_VER"

# Virtual environment
if [ ! -d "venv" ]; then
  echo "▶  Creating virtual environment …"
  python3 -m venv venv
fi
source venv/bin/activate

# Install Python deps
echo "▶  Installing Python dependencies …"
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✔  Python packages ready"

# Frontend
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  echo "✔  Node.js $NODE_VER"
  if [ ! -d "frontend/node_modules" ]; then
    echo "▶  Installing npm packages …"
    npm install --prefix frontend
  fi
  if [ ! -d "frontend/dist" ] || [ "$1" == "--reset" ]; then
    echo "▶  Building React frontend …"
    npm run build --prefix frontend
  fi
  echo "✔  Frontend ready"
else
  echo "⚠  Node.js not found — skipping frontend build."
fi

# DB init
echo "▶  Initialising database …"
python3 -c "
import sys; sys.path.insert(0, '.')
from backend.database import init_db
init_db()
print('✔  Database ready')
"

# Launch
echo ""
echo "▶  Starting Spendulum at http://localhost:8000"
echo "   API docs → http://localhost:8000/docs"
echo "   Press Ctrl+C to stop."
echo ""

if [ "${1:-}" == "--dev" ]; then
  npm run dev --prefix frontend &
  uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
else
  uvicorn backend.main:app --host 0.0.0.0 --port 8000
fi
