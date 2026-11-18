"""
SMS & UPI Parser Service for Indian Financial Ecosystem.
Parses bank SMS notifications, credit/debit card alerts, and UPI VPAs across major Indian institutions:
HDFC, SBI, ICICI, Axis, Kotak, PNB, Bank of Baroda, Paytm, PhonePe, Google Pay, CRED.
"""

import re
from datetime import datetime, date
from uuid import uuid4
from typing import Dict, List, Optional, Any

# Common Indian Bank identifiers
BANK_PATTERNS = {
    "HDFC": r"(?:HDFC|HDFCBK)",
    "SBI": r"(?:SBI|SBIN|STATE BANK)",
    "ICICI": r"(?:ICICI|ICICIB)",
    "Axis": r"(?:AXIS|AXISBK)",
    "Kotak": r"(?:KOTAK|KMB)",
    "PNB": r"(?:PNB|PUNJAB)",
    "Bank of Baroda": r"(?:BOB|BARODA)",
    "Canara": r"(?:CANARA|CNRB)",
    "Paytm": r"(?:PAYTM|PYTM)",
    "PhonePe": r"(?:PHONEPE)",
    "Google Pay": r"(?:GPAY|GOOGLE PAY)",
    "CRED": r"(?:CRED)",
    "IndusInd": r"(?:INDUSIND|INDB)",
    "Standard Chartered": r"(?:SCB|STANCHAR)",
}


def clean_text(text: str) -> str:
    return " ".join(text.replace("\r", " ").replace("\n", " ").split())


def extract_amount(text: str) -> Optional[float]:
    """
    Matches amounts formatted like:
    - Rs. 1,450.00 / Rs 1450.50 / INR 500 / ₹4,500.00 / Rs.150
    """
    patterns = [
        r"(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)",
        r"(?:debited|credited|spent|paid)\s+(?:for\s+)?(?:by\s+)?(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
        r"([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹)",
    ]
    for pat in patterns:
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            raw = match.group(1).replace(",", "").strip()
            try:
                val = float(raw)
                if val > 0:
                    return val
            except ValueError:
                continue
    return None


def extract_transaction_type(text: str) -> str:
    """
    Determines if transaction is an Expense (Debit) or Income (Credit).
    """
    lower = text.lower()
    if any(w in lower for w in ["credited", "received", "deposited", "refund", "salary", "cashback"]):
        return "Income"
    if any(w in lower for w in ["debited", "spent", "paid", "withdrawn", "sent", "purchase", "declined"]):
        return "Expense"
    return "Expense"


def extract_bank(text: str) -> str:
    for bank_name, pat in BANK_PATTERNS.items():
        if re.search(pat, text, re.IGNORECASE):
            return bank_name
    return "Bank / UPI"


def extract_account_mask(text: str) -> str:
    match = re.search(r"(?:a/c|acct|ac|card|ending)\s*(?:no\.?)?\s*[*xX]*([0-9]{3,4})", text, re.IGNORECASE)
    if match:
        return f"xx{match.group(1)}"
    match_card = re.search(r"[*xX]+([0-9]{4})", text)
    if match_card:
        return f"xx{match_card.group(1)}"
    return "xx"


def extract_reference(text: str) -> str:
    patterns = [
        r"(?:UPI\s*Ref(?:\s*no)?|Ref\s*no|Txn\s*ID|UTR|Ref)\s*[:\-\s]?\s*([0-9a-zA-Z]{6,16})",
        r"(?:UPI/)([0-9]{10,14})",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(1)
    return "—"


def extract_merchant(text: str) -> str:
    """
    Extracts recipient merchant / beneficiary / VPA from Indian bank SMS.
    """
    # 1. UPI VPA format: e.g. swiggy@icici or 9876543210@paytm
    vpa_match = re.search(r"(?:to|vpa|info)\s+([a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+)", text, re.IGNORECASE)
    if vpa_match:
        vpa = vpa_match.group(1)
        # Simplify common merchant VPAs
        prefix = vpa.split("@")[0].lower()
        for known in ["swiggy", "zomato", "blinkit", "zepto", "uber", "ola", "amazon", "flipkart", "myntra", "netflix", "spotify"]:
            if known in prefix:
                return known.capitalize()
        return vpa

    # 2. "to <Merchant>" or "at <Merchant>"
    merchant_match = re.search(r"(?:to|at|info/|towards)\s+([A-Za-z0-9\s&.\-]{3,25})(?:\s+on|\s+ref|\s+upi|\.|\,|$)", text, re.IGNORECASE)
    if merchant_match:
        m = merchant_match.group(1).strip()
        # Filter out bank noise
        if not any(b.lower() in m.lower() for b in ["bank", "account", "a/c", "card", "rs", "inr"]):
            return m.strip(" .-,")

    return "Card / UPI Merchant"


def extract_date(text: str) -> str:
    """
    Tries to find date like 02-Nov-26, 02/11/2026, 2026-11-02. Falls back to today.
    """
    today_iso = date.today().isoformat()
    # DD-Mon-YY or DD-Mon-YYYY
    match_mon = re.search(r"(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-?(\d{2,4})?", text, re.IGNORECASE)
    if match_mon:
        d_str = match_mon.group(1).zfill(2)
        m_str = match_mon.group(2).capitalize()
        y_str = match_mon.group(3) or str(date.today().year)[2:]
        if len(y_str) == 2:
            y_str = f"20{y_str}"
        try:
            dt = datetime.strptime(f"{d_str}-{m_str}-{y_str}", "%d-%b-%Y")
            return dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    # DD/MM/YYYY or DD-MM-YYYY
    match_num = re.search(r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})", text)
    if match_num:
        d = match_num.group(1).zfill(2)
        m = match_num.group(2).zfill(2)
        y = match_num.group(3)
        if len(y) == 2:
            y = f"20{y}"
        try:
            dt = datetime.strptime(f"{d}/{m}/{y}", "%d/%m/%Y")
            return dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    return today_iso


def parse_single_sms(raw_text: str, classifier_fn: Optional[Any] = None) -> Dict[str, Any]:
    """
    Parses a single raw SMS string and returns a structured record ready for transaction import.
    """
    cleaned = clean_text(raw_text)
    amount = extract_amount(cleaned) or 0.0
    ttype = extract_transaction_type(cleaned)
    bank = extract_bank(cleaned)
    account_mask = extract_account_mask(cleaned)
    merchant = extract_merchant(cleaned)
    ref_no = extract_reference(cleaned)
    tdate = extract_date(cleaned)

    # Derive description
    if ttype == "Income":
        description = f"Credit from {merchant} ({bank} {account_mask})"
    else:
        description = f"UPI / POS: {merchant} ({bank} {account_mask})"

    # Category prediction
    category = "Other expenses" if ttype == "Expense" else "Salary"
    confidence = "High"
    confidence_score = 0.90
    prediction_source = "SMS Parser Rule"

    if classifier_fn and amount > 0:
        try:
            pred = classifier_fn(description)
            if pred and "category" in pred:
                category = pred["category"]
                confidence = pred.get("confidence", "Medium")
                confidence_score = float(pred.get("confidence_score", 0.85))
                prediction_source = pred.get("prediction_source", "AI Classifier")
        except Exception:
            pass

    return {
        "id": str(uuid4()),
        "raw_text": raw_text.strip(),
        "date": tdate,
        "description": description,
        "amount": amount,
        "type": ttype,
        "category": category,
        "bank": bank,
        "account_mask": account_mask,
        "merchant": merchant,
        "reference_no": ref_no,
        "confidence": confidence,
        "confidence_score": confidence_score,
        "prediction_source": prediction_source,
        "status": "ready" if amount > 0 else "unrecognized"
    }


def parse_batch_sms(text_block: str, classifier_fn: Optional[Any] = None) -> List[Dict[str, Any]]:
    """
    Splits text block by double newlines or common SMS delimiters and parses each.
    """
    # Split by empty lines or lines starting with 'Dear', 'Alert:', 'Txn'
    chunks = re.split(r"\n\s*\n|(?=Dear\s+|Alert:\s+|Rs\.?\s*\d+|INR\s*\d+|₹\s*\d+)", text_block)
    results = []
    for chunk in chunks:
        chunk = chunk.strip()
        if len(chunk) > 15:
            parsed = parse_single_sms(chunk, classifier_fn)
            if parsed["amount"] > 0:
                results.append(parsed)
    return results
