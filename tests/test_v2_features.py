"""
Spendulum 2.0 Feature Tests.
Tests FastAPI endpoints, SMS parser, Receipt OCR, Subscriptions, Investments, and Predictive engine.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.sms_parser import parse_single_sms, parse_batch_sms
from backend.services.receipt_parser import parse_receipt_text

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "Spendulum"


def test_sms_parser_hdfc():
    sms = "Rs 840.00 debited from HDFC Bank A/c **4921 on 02-Nov-26 to SWIGGY UPI: swiggy@icici. Ref 430718293101."
    res = parse_single_sms(sms)
    assert res["amount"] == 840.0
    assert res["type"] == "Expense"
    assert res["bank"] == "HDFC"
    assert res["account_mask"] == "xx4921"
    assert "SWIGGY" in res["merchant"].upper()


def test_sms_parser_sbi_salary():
    sms = "Dear SBI User, your A/c ending 1084 credited by Rs 95,000.00 on 01-Nov-26 by UPI/394829104821/Tech Corp Salary."
    res = parse_single_sms(sms)
    assert res["amount"] == 95000.0
    assert res["type"] == "Income"
    assert res["bank"] == "SBI"


def test_receipt_text_parser():
    receipt_text = """
    DMART SUPERMARKET
    INDIRANAGAR BANGALORE
    Date: 02/11/2026
    -----------------------------
    1. Aashirvaad Atta 5kg   Rs 285.00
    2. Amul Butter 500g      Rs 275.00
    -----------------------------
    Sub Total:              Rs 560.00
    GRAND TOTAL:            Rs 560.00
    """
    res = parse_receipt_text(receipt_text)
    assert res["merchant"] == "DMART SUPERMARKET"
    assert res["total"] == 560.0
    assert len(res["items"]) >= 2


def test_subscriptions_endpoints():
    res = client.get("/api/subscriptions")
    assert res.status_code == 200
    data = res.json()
    assert "subscriptions" in data
    assert "total_monthly_drain" in data


def test_investments_endpoints():
    res = client.get("/api/investments")
    assert res.status_code == 200
    data = res.json()
    assert "holdings" in data
    assert "total_current_value" in data
    assert "asset_allocation" in data


def test_predictive_budget_endpoint():
    res = client.get("/api/predictive")
    assert res.status_code == 200
    data = res.json()
    assert "daily_velocity" in data
    assert "projected_month_end" in data
    assert "category_pacing" in data


def test_ai_classifier_predict():
    res = client.post("/api/classifier/predict", json={"description": "UPI-CHAAYOS-94821"})
    assert res.status_code == 200
    data = res.json()
    assert "category" in data
    assert "confidence" in data
