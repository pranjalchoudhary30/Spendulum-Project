"""
Transactions Router.
CRUD endpoints, search/filtering, CSV import with deduplication, and export.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date
from uuid import uuid4
import pandas as pd
import io

from backend.database import get_connection, build_key, seed_demo_transactions_if_empty
from backend.services.ml_bridge import classify_text, record_correction

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


class TransactionCreate(BaseModel):
    date: Optional[str] = None
    description: str
    amount: float
    type: Optional[str] = "Expense"
    category: Optional[str] = None
    confidence: Optional[str] = None
    confidence_score: Optional[float] = None
    prediction_source: Optional[str] = None
    matched_merchant: Optional[str] = None
    review_status: Optional[str] = None


class TransactionUpdate(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    confidence: Optional[str] = None
    confidence_score: Optional[float] = None
    prediction_source: Optional[str] = None
    matched_merchant: Optional[str] = None
    review_status: Optional[str] = None
    learn_feedback: Optional[bool] = False


@router.get("")
def list_transactions(
    search: Optional[str] = None,
    category: Optional[str] = None,
    type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    review_status: Optional[str] = None,
    limit: int = 200,
    offset: int = 0
):
    conn = get_connection()
    cur = conn.cursor()

    conditions = []
    params = []

    if search:
        conditions.append("(description LIKE ? OR matched_merchant LIKE ? OR transaction_id LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

    if category and category != "All":
        conditions.append("category = ?")
        params.append(category)

    if type and type != "All":
        conditions.append("LOWER(type) = LOWER(?)")
        params.append(type)

    if start_date:
        conditions.append("date >= ?")
        params.append(start_date)

    if end_date:
        conditions.append("date <= ?")
        params.append(end_date)

    if review_status:
        conditions.append("review_status = ?")
        params.append(review_status)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    # Total count
    cur.execute(f"SELECT COUNT(*) FROM transactions {where_clause}", params)
    total_count = cur.fetchone()[0]

    # Records
    query = f"""
    SELECT transaction_id, transaction_key, date, description, amount, type, category,
           confidence, confidence_score, prediction_source, matched_merchant, review_status, is_demo, created_at
    FROM transactions
    {where_clause}
    ORDER BY date DESC, created_at DESC
    LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()

    items = [dict(r) for r in rows]
    return {
        "total": total_count,
        "items": items,
        "limit": limit,
        "offset": offset
    }


@router.post("")
def create_transaction(txn: TransactionCreate):
    conn = get_connection()
    cur = conn.cursor()

    d_val = txn.date or date.today().isoformat()
    desc = txn.description.strip()
    amt = float(txn.amount)
    ttype = txn.type or "Expense"

    # Run AI classifier if category is not provided
    if not txn.category:
        pred = classify_text(desc)
        cat = pred["category"]
        conf = pred["confidence"]
        cscore = pred["confidence_score"]
        src = pred["prediction_source"]
        merch = pred["matched_merchant"]
        rev = pred["review_status"]
    else:
        cat = txn.category
        conf = txn.confidence or "High"
        cscore = txn.confidence_score or 1.0
        src = txn.prediction_source or "Manual Entry"
        merch = txn.matched_merchant or "—"
        rev = txn.review_status or "Prediction Accepted"

    record_dict = {"date": d_val, "description": desc, "amount": amt, "type": ttype}
    tkey = build_key(record_dict)
    tid = uuid4().hex

    try:
        cur.execute("""
        INSERT INTO transactions 
        (transaction_id, transaction_key, date, description, amount, type, category,
         confidence, confidence_score, prediction_source, matched_merchant, review_status, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (tid, tkey, d_val, desc, amt, ttype, cat, conf, cscore, src, merch, rev))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Transaction could not be added (possible duplicate): {e}")

    conn.close()
    return {
        "success": True,
        "transaction_id": tid,
        "category": cat,
        "confidence": conf,
        "prediction_source": src
    }


@router.put("/{transaction_id}")
def update_transaction(transaction_id: str, updates: TransactionUpdate):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM transactions WHERE transaction_id = ?", (transaction_id,))
    existing = cur.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Transaction not found")

    old_row = dict(existing)
    fields = []
    values = []

    update_dict = updates.dict(exclude_unset=True)
    learn = update_dict.pop("learn_feedback", False)

    for col in ["date", "description", "amount", "type", "category", "confidence",
                "confidence_score", "prediction_source", "matched_merchant", "review_status"]:
        if col in update_dict and update_dict[col] is not None:
            fields.append(f"{col} = ?")
            values.append(update_dict[col])

    if fields:
        values.append(transaction_id)
        cur.execute(f"UPDATE transactions SET {', '.join(fields)} WHERE transaction_id = ?", values)
        conn.commit()

    conn.close()

    # If category changed and user requested to learn
    if learn and updates.category and updates.category != old_row["category"]:
        desc_to_learn = updates.description or old_row["description"]
        record_correction(desc_to_learn, updates.category)

    return {"success": True, "transaction_id": transaction_id}


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM transactions WHERE transaction_id = ?", (transaction_id,))
    conn.commit()
    conn.close()
    return {"success": True, "deleted_id": transaction_id}


@router.post("/import-csv")
async def import_csv(file: UploadFile = File(...)):
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file format: {e}")

    # Standardize column names
    col_map = {}
    for col in df.columns:
        c_lower = str(col).strip().lower()
        if c_lower in ["description", "narration", "merchant", "details", "particulars", "transaction"]:
            col_map[col] = "description"
        elif c_lower in ["amount", "value", "transaction amount", "amt"]:
            col_map[col] = "amount"
        elif c_lower in ["date", "transaction date", "posted date", "value date", "txndate"]:
            col_map[col] = "date"
        elif c_lower in ["type", "transaction type", "dr/cr"]:
            col_map[col] = "type"
        elif c_lower in ["category"]:
            col_map[col] = "category"

    df = df.rename(columns=col_map)
    if "description" not in df.columns or "amount" not in df.columns:
        raise HTTPException(status_code=400, detail="CSV must contain at least 'description' and 'amount' columns.")

    conn = get_connection()
    cur = conn.cursor()

    imported = 0
    duplicates = 0

    for _, row in df.iterrows():
        desc = str(row.get("description", "")).strip()
        amt = float(pd.to_numeric(row.get("amount", 0), errors="coerce") or 0.0)
        if not desc or amt <= 0:
            continue

        raw_date = str(row.get("date", date.today().isoformat()))
        try:
            d_val = pd.to_datetime(raw_date, errors="coerce").strftime("%Y-%m-%d")
        except Exception:
            d_val = date.today().isoformat()

        ttype = str(row.get("type", "Expense")).capitalize()
        if ttype not in ["Expense", "Income"]:
            ttype = "Expense"

        provided_cat = str(row.get("category", "")).strip()
        if provided_cat and provided_cat.lower() != "nan":
            cat = provided_cat
            conf = "High"
            cscore = 1.0
            src = "CSV File"
            merch = "—"
            rev = "Prediction Accepted"
        else:
            pred = classify_text(desc)
            cat = pred["category"]
            conf = pred["confidence"]
            cscore = pred["confidence_score"]
            src = pred["prediction_source"]
            merch = pred["matched_merchant"]
            rev = pred["review_status"]

        record_dict = {"date": d_val, "description": desc, "amount": amt, "type": ttype}
        tkey = build_key(record_dict)
        tid = uuid4().hex

        try:
            cur.execute("""
            INSERT INTO transactions 
            (transaction_id, transaction_key, date, description, amount, type, category,
             confidence, confidence_score, prediction_source, matched_merchant, review_status, is_demo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            """, (tid, tkey, d_val, desc, amt, ttype, cat, conf, cscore, src, merch, rev))
            conn.commit()
            imported += 1
        except Exception:
            duplicates += 1

    conn.close()
    return {
        "success": True,
        "imported": imported,
        "duplicates_skipped": duplicates,
        "total_rows": len(df)
    }


@router.get("/export-csv")
def export_csv():
    conn = get_connection()
    df = pd.read_sql_query("SELECT date, description, amount, type, category, confidence, prediction_source, matched_merchant FROM transactions ORDER BY date DESC", conn)
    conn.close()

    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)

    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=spendulum_transactions.csv"
    return response


@router.post("/reseed")
def reseed_data():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM transactions WHERE is_demo = 1")
    conn.commit()
    conn.close()
    seed_demo_transactions_if_empty()
    return {"success": True, "message": "Demo profile reseeded successfully."}
