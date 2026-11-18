"""
Investments & Net Worth Router.
Tracks portfolio holdings across Mutual Funds, Stocks, Gold, Fixed Deposits, EPF/PPF, and Crypto.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from uuid import uuid4
from backend.database import get_connection

router = APIRouter(prefix="/api/investments", tags=["investments"])


class InvestmentCreate(BaseModel):
    name: str
    asset_class: str
    invested_amount: float
    current_value: float
    units: Optional[float] = 1.0
    monthly_sip: Optional[float] = 0.0
    institution: Optional[str] = "Groww / Zerodha"
    notes: Optional[str] = None


class InvestmentUpdate(BaseModel):
    name: Optional[str] = None
    asset_class: Optional[str] = None
    invested_amount: Optional[float] = None
    current_value: Optional[float] = None
    units: Optional[float] = None
    monthly_sip: Optional[float] = None
    institution: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
def list_investments():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM investments ORDER BY current_value DESC")
    rows = cur.fetchall()
    conn.close()

    items = [dict(r) for r in rows]

    total_invested = sum(float(i.get("invested_amount", 0.0)) for i in items)
    total_current = sum(float(i.get("current_value", 0.0)) for i in items)
    total_gain = total_current - total_invested
    gain_pct = round((total_gain / total_invested * 100), 2) if total_invested > 0 else 0.0
    total_sip = sum(float(i.get("monthly_sip", 0.0)) for i in items)

    # Asset class distribution
    class_map = {}
    for i in items:
        ac = i.get("asset_class", "Other")
        class_map[ac] = class_map.get(ac, 0.0) + float(i.get("current_value", 0.0))

    asset_allocation = []
    colors = {
        "Mutual Fund": "#10b981",
        "Stock": "#3b82f6",
        "Fixed Deposit": "#f59e0b",
        "Gold": "#eab308",
        "EPF/PPF": "#8b5cf6",
        "Crypto": "#ec4899",
        "Real Estate": "#14b8a6",
        "Other": "#64748b"
    }

    for ac, val in sorted(class_map.items(), key=lambda x: x[1], reverse=True):
        pct = round((val / total_current * 100), 1) if total_current > 0 else 0.0
        asset_allocation.append({
            "asset_class": ac,
            "value": round(val, 2),
            "percentage": pct,
            "color": colors.get(ac, "#10b981")
        })

    return {
        "holdings": items,
        "total_invested": round(total_invested, 2),
        "total_current_value": round(total_current, 2),
        "total_unrealized_gain": round(total_gain, 2),
        "gain_percentage": gain_pct,
        "monthly_sip_commitment": round(total_sip, 2),
        "asset_allocation": asset_allocation
    }


@router.post("")
def add_investment(inv: InvestmentCreate):
    conn = get_connection()
    cur = conn.cursor()
    inv_id = str(uuid4())

    cur.execute("""
    INSERT INTO investments (id, name, asset_class, invested_amount, current_value, units, monthly_sip, institution, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (inv_id, inv.name, inv.asset_class, inv.invested_amount, inv.current_value, inv.units, inv.monthly_sip, inv.institution, inv.notes))
    conn.commit()
    conn.close()
    return {"success": True, "id": inv_id}


@router.put("/{inv_id}")
def update_investment(inv_id: str, updates: InvestmentUpdate):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM investments WHERE id = ?", (inv_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Investment not found")

    fields = []
    values = []
    for k, v in updates.dict(exclude_unset=True).items():
        if v is not None:
            fields.append(f"{k} = ?")
            values.append(v)

    if fields:
        values.append(inv_id)
        cur.execute(f"UPDATE investments SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    conn.close()
    return {"success": True, "id": inv_id}


@router.delete("/{inv_id}")
def delete_investment(inv_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM investments WHERE id = ?", (inv_id,))
    conn.commit()
    conn.close()
    return {"success": True, "deleted_id": inv_id}
