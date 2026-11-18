"""
Budgets Router.
Manages per-category monthly spending limits and current month utilization.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List, Any
import pandas as pd
from datetime import date
from backend.database import get_connection

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


class BudgetUpdate(BaseModel):
    budgets: Dict[str, float]


@router.get("")
def get_budgets():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT category, monthly_limit, alert_threshold FROM budgets")
    b_rows = cur.fetchall()

    # Get transactions for current month
    today = date.today()
    curr_month = today.strftime("%Y-%m")
    df = pd.read_sql_query(
        "SELECT category, amount FROM transactions WHERE LOWER(type) = 'expense' AND strftime('%Y-%m', date) = ?",
        conn,
        params=(curr_month,)
    )
    conn.close()

    spends = df.groupby("category")["amount"].sum().to_dict() if not df.empty else {}
    total_spent = sum(spends.values())

    items = []
    total_limit = 0.0

    for r in b_rows:
        cat = r["category"]
        lim = float(r["monthly_limit"])
        thresh = float(r["alert_threshold"] or 0.85)

        if cat == "_monthly_total":
            total_limit = lim
            continue

        spent = float(spends.get(cat, 0.0))
        pct = round((spent / lim * 100), 1) if lim > 0 else 0.0
        rem = round(lim - spent, 2)

        if pct >= 100:
            status = "Over Budget"
        elif pct >= (thresh * 100):
            status = "Warning"
        else:
            status = "Safe"

        items.append({
            "category": cat,
            "monthly_limit": lim,
            "spent": spent,
            "remaining": rem,
            "percentage": pct,
            "status": status
        })

    # Total status
    total_pct = round((total_spent / total_limit * 100), 1) if total_limit > 0 else 0.0
    total_status = "Over Budget" if total_pct >= 100 else ("Warning" if total_pct >= 85 else "Safe")

    return {
        "month": today.strftime("%B %Y"),
        "total_budget": total_limit,
        "total_spent": round(total_spent, 2),
        "total_remaining": round(total_limit - total_spent, 2),
        "total_percentage": total_pct,
        "total_status": total_status,
        "categories": items
    }


@router.put("")
def update_budgets(data: BudgetUpdate):
    conn = get_connection()
    cur = conn.cursor()
    for cat, lim in data.budgets.items():
        cur.execute("""
        INSERT INTO budgets (category, monthly_limit) VALUES (?, ?)
        ON CONFLICT(category) DO UPDATE SET monthly_limit = excluded.monthly_limit
        """, (cat, float(lim)))
    conn.commit()
    conn.close()
    return {"success": True, "updated": len(data.budgets)}
