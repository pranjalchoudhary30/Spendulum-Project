"""
SMS & UPI Parsing Router.
Handles parsing of Indian bank SMS alerts, UPI transaction handles, and batch import.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import date
from uuid import uuid4

from backend.database import get_connection, build_key
from backend.services.sms_parser import parse_batch_sms, parse_single_sms
from backend.services.ml_bridge import classify_text

router = APIRouter(prefix="/api/sms-upi", tags=["sms-upi"])


class SmsParseRequest(BaseModel):
    raw_text: str


class SmsCommitRequest(BaseModel):
    records: List[Dict[str, Any]]


@router.post("/parse")
def parse_sms_endpoint(req: SmsParseRequest):
    if not req.raw_text or not req.raw_text.strip():
        return {"parsed": []}

    parsed_list = parse_batch_sms(req.raw_text, classifier_fn=classify_text)
    return {
        "count": len(parsed_list),
        "parsed": parsed_list
    }


@router.post("/commit")
def commit_sms_transactions(req: SmsCommitRequest):
    if not req.records:
        return {"imported": 0, "duplicates": 0}

    conn = get_connection()
    cur = conn.cursor()

    imported = 0
    duplicates = 0

    for item in req.records:
        desc = item.get("description", "Bank SMS Transaction")
        amt = float(item.get("amount", 0.0))
        if amt <= 0:
            continue

        d_val = item.get("date") or date.today().isoformat()
        ttype = item.get("type", "Expense")
        cat = item.get("category", "Other expenses")
        conf = item.get("confidence", "High")
        cscore = float(item.get("confidence_score", 0.90))
        src = item.get("prediction_source", "SMS Parser")
        merch = item.get("merchant", "—")
        rev = "Prediction Accepted"

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
    return {"success": True, "imported": imported, "duplicates": duplicates}


@router.get("/samples")
def get_sample_sms():
    """
    Returns realistic Indian banking SMS samples for instant testing.
    """
    return [
        {
            "bank": "HDFC Bank",
            "text": "Rs 840.00 debited from HDFC Bank A/c **4921 on 02-Nov-26 to SWIGGY UPI: swiggy@icici. Ref 430718293101."
        },
        {
            "bank": "State Bank of India (SBI)",
            "text": "Dear SBI User, your A/c ending 1084 credited by Rs 95,000.00 on 01-Nov-26 by UPI/394829104821/Tech Corp Salary. Balance: Rs 1,48,250.00."
        },
        {
            "bank": "ICICI Bank",
            "text": "Alert: Your ICICI Bank Credit Card ending 3021 spent INR 3,499.00 at AMAZON INDIA on 31-Oct-26. Avl Lmt: INR 1,85,000."
        },
        {
            "bank": "Axis Bank",
            "text": "Rs 2,500.00 debited from Axis Bank A/c 7829 on 02-Nov-26 towards INDIAN OIL PETROL PUMP BANGALORE. UPI Ref 382910482910."
        },
        {
            "bank": "Kotak Mahindra",
            "text": "Paid Rs 1,120.00 to Blinkit via Kotak UPI (ref 9381029481). Call 18602662666 if not done by you."
        }
    ]
