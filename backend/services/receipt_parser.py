"""
Receipt Scanner & OCR Parsing Service.
Extracts store name, date, itemized rows, tax/GST, and grand total from receipt text or images.
Handles Indian retail bills (Supermarkets, Swiggy/Zomato invoices, Fuel receipts, Pharmacy bills).
"""

import re
from datetime import date, datetime
from uuid import uuid4
from typing import Dict, List, Any, Optional

try:
    import pytesseract
    from PIL import Image
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False


def extract_receipt_from_image(image_file_path: str) -> str:
    """
    Attempts OCR using pytesseract. If tesseract binary is unavailable, returns empty string.
    """
    if not HAS_PYTESSERACT:
        return ""
    try:
        img = Image.open(image_file_path)
        text = pytesseract.image_to_string(img)
        return text
    except Exception as e:
        print(f"OCR execution note: {e}")
        return ""


def parse_receipt_text(raw_text: str, classifier_fn: Optional[Any] = None) -> Dict[str, Any]:
    """
    Intelligently parses receipt text for merchant, items, subtotal, tax, and total.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    if not lines:
        return {
            "id": str(uuid4()),
            "merchant": "Unknown Merchant",
            "date": date.today().isoformat(),
            "items": [],
            "subtotal": 0.0,
            "tax": 0.0,
            "total": 0.0,
            "category": "Other expenses",
            "confidence": "Low",
            "confidence_score": 0.5
        }

    # 1. Merchant Detection: usually in the first 3 lines
    merchant = lines[0]
    for line in lines[:4]:
        line_clean = line.strip().lower()
        # Skip generic invoice header labels
        if any(line_clean.startswith(h) for h in ["tax invoice", "retail invoice", "cash memo", "welcome to", "bill to", "gstin:"]):
            continue
        if line_clean in ["tax invoice", "retail invoice", "receipt", "cash memo", "invoice"]:
            continue
        cleaned_line = re.sub(r"[^a-zA-Z0-9\s&.\-]", "", line).strip()
        if len(cleaned_line) > 2:
            merchant = cleaned_line
            break

    # 2. Date Extraction
    receipt_date = date.today().isoformat()
    date_patterns = [
        r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
        r"(\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-?\d{2,4})",
        r"(\d{4}[/\-]\d{1,2}[/\-]\d{1,2})"
    ]
    for p in date_patterns:
        m = re.search(p, raw_text, re.IGNORECASE)
        if m:
            raw_d = m.group(1)
            # Try formatting
            for fmt in ["%d/%m/%Y", "%d-%m-%Y", "%d-%b-%Y", "%Y-%m-%d", "%d/%m/%y", "%d-%m-%y"]:
                try:
                    dt = datetime.strptime(raw_d, fmt)
                    receipt_date = dt.strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue
            if receipt_date != date.today().isoformat():
                break

    # 3. Itemized row parsing
    items = []
    total = 0.0
    subtotal = 0.0
    tax = 0.0

    # Common price regex
    price_regex = re.compile(r"(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d{1,2})?)$")

    for line in lines:
        lower = line.lower()

        # Check for Total / Grand Total / Net Amount
        if any(k in lower for k in ["grand total", "total amount", "net payable", "net amount", "total:"]):
            match = re.search(r"(\d+(?:\.\d{1,2})?)", line.replace(",", ""))
            if match:
                try:
                    total = float(match.group(1))
                except ValueError:
                    pass
            continue

        # Check for Subtotal
        if "subtotal" in lower or "sub total" in lower:
            match = re.search(r"(\d+(?:\.\d{1,2})?)", line.replace(",", ""))
            if match:
                try:
                    subtotal = float(match.group(1))
                except ValueError:
                    pass
            continue

        # Check for Tax / GST / VAT
        if any(k in lower for k in ["gst", "cgst", "sgst", "vat", "tax"]):
            match = re.search(r"(\d+(?:\.\d{1,2})?)", line.replace(",", ""))
            if match:
                try:
                    tax += float(match.group(1))
                except ValueError:
                    pass
            continue

        # Try matching item row: "Item Description   1   ₹150.00"
        parts = line.split()
        if len(parts) >= 2:
            last_token = parts[-1].replace("₹", "").replace("Rs.", "").replace(",", "")
            try:
                item_price = float(last_token)
                if item_price > 0 and item_price < 50000:
                    item_name = " ".join(parts[:-1])
                    # If second to last is quantity
                    qty = 1
                    if len(parts) >= 3 and parts[-2].isdigit():
                        qty = int(parts[-2])
                        item_name = " ".join(parts[:-2])
                    items.append({
                        "item": item_name.strip(),
                        "qty": qty,
                        "price": item_price
                    })
            except ValueError:
                pass

    # If total was not detected from keywords, sum items or look for max number
    if total == 0.0 and items:
        total = sum(i["price"] for i in items)
    elif total == 0.0:
        # Look for largest number in text that looks like a total
        nums = re.findall(r"(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d{2}))", raw_text.replace(",", ""))
        if nums:
            float_nums = [float(n) for n in nums if float(n) > 5]
            if float_nums:
                total = max(float_nums)

    if subtotal == 0.0:
        subtotal = round(total - tax, 2) if total > tax else total

    # Category prediction
    category = "Food and groceries"
    confidence = "Medium"
    confidence_score = 0.85

    if classifier_fn and merchant:
        try:
            pred = classifier_fn(f"{merchant} retail store")
            if pred and "category" in pred:
                category = pred["category"]
                confidence = pred.get("confidence", "Medium")
                confidence_score = float(pred.get("confidence_score", 0.85))
        except Exception:
            pass

    return {
        "id": str(uuid4()),
        "merchant": merchant,
        "date": receipt_date,
        "items": items,
        "subtotal": subtotal,
        "tax": tax,
        "total": total,
        "category": category,
        "confidence": confidence,
        "confidence_score": confidence_score
    }
