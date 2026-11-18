"""
User Profile Router.
Manages comprehensive financial persona, salary baselines, Indian banking stack,
tax regime, risk appetite, emergency fund targets, and regional preferences.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.database import get_connection

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    pan_mask: Optional[str] = None
    monthly_salary: Optional[float] = None
    annual_ctc: Optional[float] = None
    tax_regime: Optional[str] = None
    risk_appetite: Optional[str] = None
    emergency_fund_target: Optional[float] = None
    emergency_fund_current: Optional[float] = None
    primary_bank: Optional[str] = None
    primary_upi_vpa: Optional[str] = None
    currency: Optional[str] = None
    number_format: Optional[str] = None
    date_format: Optional[str] = None
    financial_year: Optional[str] = None
    ai_threshold: Optional[str] = None
    data_storage_mode: Optional[str] = None


@router.get("")
def get_user_profile():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM user_profile LIMIT 1")
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="User profile not initialized")

    return dict(row)


@router.put("")
def update_user_profile(updates: ProfileUpdate):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM user_profile LIMIT 1")
    existing = cur.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="User profile not initialized")

    user_id = existing["id"]
    fields = []
    values = []

    for k, v in updates.dict(exclude_unset=True).items():
        if v is not None:
            fields.append(f"{k} = ?")
            values.append(v)

    if fields:
        values.append(user_id)
        cur.execute(f"UPDATE user_profile SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    conn.close()
    return {"success": True, "message": "Profile updated successfully."}
