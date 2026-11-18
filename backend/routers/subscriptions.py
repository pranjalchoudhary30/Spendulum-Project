"""
Subscriptions & Recurring Bills Router.
Tracks recurring monthly and annual subscriptions, upcoming billing dates, and renewal countdowns.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from uuid import uuid4
from backend.database import get_connection

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


class SubscriptionCreate(BaseModel):
    name: str
    category: str
    amount: float
    billing_cycle: Optional[str] = "monthly"
    next_renewal_date: Optional[str] = None
    payment_method: Optional[str] = "UPI Autopay"
    status: Optional[str] = "active"
    icon: Optional[str] = "Tv"
    notes: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    billing_cycle: Optional[str] = None
    next_renewal_date: Optional[str] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    icon: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
def list_subscriptions():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM subscriptions ORDER BY next_renewal_date ASC")
    rows = cur.fetchall()
    conn.close()

    today = date.today()
    items = []
    total_monthly_drain = 0.0
    renewing_soon_count = 0

    for r in rows:
        d = dict(r)
        cycle = d.get("billing_cycle", "monthly").lower()
        amt = float(d.get("amount", 0.0))
        status = d.get("status", "active")

        # Normalize to monthly burden
        if status == "active":
            if cycle == "yearly":
                total_monthly_drain += (amt / 12.0)
            else:
                total_monthly_drain += amt

        # Calculate days until renewal
        renew_date_str = d.get("next_renewal_date")
        days_until = None
        if renew_date_str:
            try:
                r_date = datetime.strptime(renew_date_str[:10], "%Y-%m-%d").date()
                delta = (r_date - today).days
                days_until = delta
                if 0 <= delta <= 7 and status == "active":
                    renewing_soon_count += 1
            except ValueError:
                pass

        d["days_until_renewal"] = days_until
        items.append(d)

    return {
        "subscriptions": items,
        "total_active": sum(1 for i in items if i.get("status") == "active"),
        "total_monthly_drain": round(total_monthly_drain, 2),
        "renewing_soon_count": renewing_soon_count
    }


@router.post("")
def add_subscription(sub: SubscriptionCreate):
    conn = get_connection()
    cur = conn.cursor()
    sub_id = str(uuid4())
    r_date = sub.next_renewal_date or date.today().isoformat()

    cur.execute("""
    INSERT INTO subscriptions (id, name, category, amount, billing_cycle, next_renewal_date, payment_method, status, icon, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (sub_id, sub.name, sub.category, sub.amount, sub.billing_cycle, r_date, sub.payment_method, sub.status, sub.icon, sub.notes))
    conn.commit()
    conn.close()
    return {"success": True, "id": sub_id}


@router.put("/{sub_id}")
def update_subscription(sub_id: str, updates: SubscriptionUpdate):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM subscriptions WHERE id = ?", (sub_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Subscription not found")

    fields = []
    values = []
    for k, v in updates.dict(exclude_unset=True).items():
        if v is not None:
            fields.append(f"{k} = ?")
            values.append(v)

    if fields:
        values.append(sub_id)
        cur.execute(f"UPDATE subscriptions SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    conn.close()
    return {"success": True, "id": sub_id}


@router.delete("/{sub_id}")
def delete_subscription(sub_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM subscriptions WHERE id = ?", (sub_id,))
    conn.commit()
    conn.close()
    return {"success": True, "deleted_id": sub_id}
