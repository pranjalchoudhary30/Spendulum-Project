"""
Settings Router.
Manages user preferences, localization, bank handles, AI tuning, and database backups.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any
from pathlib import Path
from backend.database import get_connection, DB_PATH

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULT_SETTINGS = {
    "currency": "INR",
    "currency_symbol": "₹",
    "date_format": "DD-MM-YYYY",
    "number_system": "Indian (Lakhs / Crores)",
    "run_rate_alert_threshold": "85",
    "auto_learn_ai": "true",
    "security_shield_active": "true",
    "haptic_feedback": "true",
    "dark_mode": "obsidian",
    "financial_year_start": "April",
    "upi_primary_vpa": "user@hdfcbank"
}


class SettingsUpdate(BaseModel):
    settings: Dict[str, str]


@router.get("")
def get_settings():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT key, value FROM settings")
    rows = cur.fetchall()
    conn.close()

    db_settings = {r["key"]: r["value"] for r in rows}
    # Merge defaults with stored values
    merged = {**DEFAULT_SETTINGS, **db_settings}
    return merged


@router.put("")
def update_settings(data: SettingsUpdate):
    conn = get_connection()
    cur = conn.cursor()
    for k, v in data.settings.items():
        cur.execute("""
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
        """, (k, str(v)))
    conn.commit()
    conn.close()
    return {"success": True, "updated": len(data.settings)}


@router.get("/backup-db")
def download_database_backup():
    if not DB_PATH.exists():
        raise HTTPException(status_code=404, detail="Database file not found.")
    return FileResponse(
        str(DB_PATH),
        media_type="application/octet-stream",
        filename="spendulum_backup.db"
    )
