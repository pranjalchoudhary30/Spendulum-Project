#!/usr/bin/env python3
"""
Spendulum 2.0 — Cross-Platform One-Command Launcher
Works on Windows, macOS, and Linux.

Usage:
    python start.py           # Normal startup
    python start.py --dev     # Backend + Frontend hot-reload mode
    python start.py --reset   # Drop & reseed demo data, then start
"""

import sys
import os
import subprocess
import platform
import argparse
import shutil
import time
import webbrowser
from pathlib import Path

# ─── Minimum versions ────────────────────────────────────────────────────────
MIN_PYTHON = (3, 9)
MIN_NODE   = (18,)

ROOT    = Path(__file__).resolve().parent
VENV    = ROOT / "venv"
FRONT   = ROOT / "frontend"
DATA    = ROOT / "data"
DIST    = FRONT / "dist"

SYSTEM  = platform.system()   # "Windows" | "Darwin" | "Linux"

# ─── Helpers ─────────────────────────────────────────────────────────────────

def step(msg: str):
    print(f"\n\033[1;36m▶  {msg}\033[0m")

def ok(msg: str):
    print(f"   \033[32m✔  {msg}\033[0m")

def warn(msg: str):
    print(f"   \033[33m⚠  {msg}\033[0m")

def err(msg: str):
    print(f"   \033[31m✖  {msg}\033[0m")

def abort(msg: str):
    err(msg)
    sys.exit(1)

# ─── Python version check ─────────────────────────────────────────────────────

def check_python():
    step("Checking Python version …")
    if sys.version_info < MIN_PYTHON:
        abort(
            f"Python {MIN_PYTHON[0]}.{MIN_PYTHON[1]}+ required, "
            f"but you have {sys.version}.\n"
            "   Download it from https://www.python.org/downloads/"
        )
    ok(f"Python {sys.version.split()[0]}")

# ─── Virtual-env setup ────────────────────────────────────────────────────────

def python_bin(*parts: str) -> Path:
    """Return path to a binary inside the venv."""
    if SYSTEM == "Windows":
        return VENV / "Scripts" / parts[0]
    return VENV / "bin" / parts[0]

def setup_venv():
    step("Setting up Python virtual environment …")
    if not VENV.exists():
        subprocess.check_call([sys.executable, "-m", "venv", str(VENV)])
        ok("Created venv/")
    else:
        ok("venv/ already exists")

def install_deps():
    step("Installing Python dependencies …")
    pip = python_bin("pip")
    req = ROOT / "requirements.txt"
    subprocess.check_call([str(pip), "install", "-q", "--upgrade", "pip"])
    subprocess.check_call([str(pip), "install", "-q", "-r", str(req)])
    ok("All Python packages installed")

# ─── Node / npm ───────────────────────────────────────────────────────────────

def node_version() -> tuple:
    try:
        out = subprocess.check_output(["node", "--version"],
                                      stderr=subprocess.DEVNULL).decode().strip()
        # "v18.17.0" → (18, 17, 0)
        return tuple(int(x) for x in out.lstrip("v").split("."))
    except (FileNotFoundError, subprocess.CalledProcessError):
        return ()

def setup_frontend(force_rebuild=False):
    step("Setting up frontend …")
    ver = node_version()
    if ver < MIN_NODE:
        warn(
            "Node.js 18+ not found — skipping frontend build.\n"
            "   Install it from https://nodejs.org and re-run start.py.\n"
            "   The app will still work via the API at http://localhost:8000/docs"
        )
        return

    ok(f"Node.js v{''.join(str(v)+'.' for v in ver).rstrip('.')}")
    nm = FRONT / "node_modules"
    if not nm.exists():
        step("Installing npm packages (first run — this takes a minute) …")
        subprocess.check_call(["npm", "install"], cwd=str(FRONT),
                              shell=(SYSTEM == "Windows"))
        ok("node_modules ready")

    if force_rebuild or not DIST.exists():
        step("Building React frontend …")
        subprocess.check_call(["npm", "run", "build"], cwd=str(FRONT),
                              shell=(SYSTEM == "Windows"))
        ok("frontend/dist/ built")
    else:
        ok("frontend/dist/ already built (use --reset to force rebuild)")

# ─── Database init ────────────────────────────────────────────────────────────

def init_database(reset=False):
    step("Initialising database …")
    DATA.mkdir(parents=True, exist_ok=True)
    db_file = DATA / "spendulum.db"
    if reset and db_file.exists():
        db_file.unlink()
        ok("Old database removed")

    py = python_bin("python")
    # Import init_db from backend.database via venv python
    code = (
        "import sys, pathlib; "
        f"sys.path.insert(0, r'{ROOT}'); "
        "from backend.database import init_db; init_db(); "
        "print('DB OK')"
    )
    result = subprocess.run([str(py), "-c", code],
                            capture_output=True, text=True)
    if result.returncode != 0:
        warn(f"DB init issue: {result.stderr.strip()}")
    else:
        ok("Database ready")

# ─── Launch servers ───────────────────────────────────────────────────────────

def start_backend(dev=False):
    py   = python_bin("python")
    args = [
        str(py), "-m", "uvicorn",
        "backend.main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
    ]
    if dev:
        args.append("--reload")
    return subprocess.Popen(args, cwd=str(ROOT))

def start_frontend_dev():
    return subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(FRONT),
        shell=(SYSTEM == "Windows"),
    )

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Spendulum 2.0 Launcher")
    parser.add_argument("--dev",   action="store_true",
                        help="Start in hot-reload dev mode (backend + Vite)")
    parser.add_argument("--reset", action="store_true",
                        help="Reseed demo data and force frontend rebuild")
    args = parser.parse_args()

    print("\n\033[1;35m╔══════════════════════════════╗")
    print("║   Spendulum 2.0  🚀          ║")
    print("╚══════════════════════════════╝\033[0m")
    print(f"   Platform : {SYSTEM} ({platform.machine()})")
    print(f"   Project  : {ROOT}")

    check_python()
    setup_venv()
    install_deps()
    setup_frontend(force_rebuild=args.reset)
    init_database(reset=args.reset)

    step("Launching Spendulum …")
    backend_proc  = start_backend(dev=args.dev)
    frontend_proc = None
    if args.dev:
        frontend_proc = start_frontend_dev()

    # Give backend a moment to start
    time.sleep(2)

    url = "http://localhost:8000" if not args.dev else "http://localhost:5173"
    print(f"\n\033[1;32m   ✔  Spendulum is running at  {url}\033[0m")
    print(f"   ✔  API docs              at  http://localhost:8000/docs")
    print("\n   Press  Ctrl+C  to stop.\n")

    webbrowser.open(url)

    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\n\n   Shutting down …")
        backend_proc.terminate()
        if frontend_proc:
            frontend_proc.terminate()
        print("   Goodbye! 👋\n")


if __name__ == "__main__":
    main()
