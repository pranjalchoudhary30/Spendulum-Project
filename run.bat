@echo off
REM ─────────────────────────────────────────────────────────────────
REM  Spendulum 2.0 — Windows Quick-Launcher (double-click friendly)
REM  For more options use:  python start.py --help
REM ─────────────────────────────────────────────────────────────────

echo.
echo ╔══════════════════════════════╗
echo ║   Spendulum 2.0  🚀          ║
echo ╚══════════════════════════════╝
echo.

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Download from https://python.org
    pause
    exit /b 1
)

python start.py %*
if %errorlevel% neq 0 pause
