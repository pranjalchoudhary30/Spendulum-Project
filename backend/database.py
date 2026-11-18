"""
Spendulum 2.0 Database Layer (SQLite).
Comprehensive SQLite database for transactions, budgets, subscriptions, investments,
SMS parsing logs, OCR receipts, and user preferences.
"""

import sqlite3
import pandas as pd
import hashlib
from pathlib import Path
from uuid import uuid4
from datetime import datetime, date, timedelta
import json

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "spendulum.db"
CSV_FALLBACK = DATA_DIR / "user_transactions.csv"


def get_connection():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    # 1. Transactions table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        transaction_id TEXT PRIMARY KEY,
        transaction_key TEXT UNIQUE,
        date TEXT,
        description TEXT,
        amount REAL,
        type TEXT,
        category TEXT,
        confidence TEXT,
        confidence_score REAL,
        prediction_source TEXT,
        matched_merchant TEXT,
        review_status TEXT,
        is_demo INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Budgets table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS budgets (
        category TEXT PRIMARY KEY,
        monthly_limit REAL,
        alert_threshold REAL DEFAULT 0.85
    );
    """)

    # 3. Subscriptions & Recurring Bills table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        amount REAL,
        billing_cycle TEXT DEFAULT 'monthly',
        next_renewal_date TEXT,
        payment_method TEXT,
        status TEXT DEFAULT 'active',
        icon TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. Investments & Net Worth table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS investments (
        id TEXT PRIMARY KEY,
        name TEXT,
        asset_class TEXT,
        invested_amount REAL,
        current_value REAL,
        units REAL DEFAULT 1.0,
        monthly_sip REAL DEFAULT 0.0,
        institution TEXT,
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. SMS / UPI logs table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sms_records (
        id TEXT PRIMARY KEY,
        raw_text TEXT,
        bank TEXT,
        account_mask TEXT,
        amount REAL,
        type TEXT,
        merchant TEXT,
        date TEXT,
        reference_no TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. Receipt records table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS receipt_records (
        id TEXT PRIMARY KEY,
        merchant TEXT,
        date TEXT,
        subtotal REAL,
        tax REAL,
        total REAL,
        category TEXT,
        items_json TEXT,
        image_path TEXT,
        status TEXT DEFAULT 'extracted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 7. Settings table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    """)

    # 8. User Profile table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        full_name TEXT DEFAULT 'Aarav Sharma',
        email TEXT DEFAULT 'aarav.sharma@techcorp.in',
        phone TEXT DEFAULT '+91 98765 43210',
        city TEXT DEFAULT 'Bangalore, Karnataka',
        pan_mask TEXT DEFAULT 'ABCDE1234F',
        monthly_salary REAL DEFAULT 95000.0,
        annual_ctc REAL DEFAULT 1550000.0,
        tax_regime TEXT DEFAULT 'New Tax Regime (Sec 115BAC)',
        risk_appetite TEXT DEFAULT 'Moderate-Aggressive',
        emergency_fund_target REAL DEFAULT 300000.0,
        emergency_fund_current REAL DEFAULT 210000.0,
        primary_bank TEXT DEFAULT 'HDFC Bank (A/c **4921)',
        primary_upi_vpa TEXT DEFAULT 'aarav.sharma@okhdfcbank',
        currency TEXT DEFAULT 'INR (₹)',
        number_format TEXT DEFAULT 'Indian System (Lakhs / Crores)',
        date_format TEXT DEFAULT 'DD-MM-YYYY',
        financial_year TEXT DEFAULT 'April - March',
        ai_threshold TEXT DEFAULT 'High (Margin ≥ 0.50)',
        data_storage_mode TEXT DEFAULT '100% Local SQLite'
    );
    """)

    conn.commit()

    # Seed default user profile if empty
    cur.execute("SELECT COUNT(*) FROM user_profile")
    if cur.fetchone()[0] == 0:
        cur.execute("""
        INSERT INTO user_profile (
            id, full_name, email, phone, city, pan_mask,
            monthly_salary, annual_ctc, tax_regime, risk_appetite,
            emergency_fund_target, emergency_fund_current, primary_bank,
            primary_upi_vpa, currency, number_format, date_format,
            financial_year, ai_threshold, data_storage_mode
        ) VALUES (
            'primary_user', 'Aarav Sharma', 'aarav.sharma@techcorp.in', '+91 98765 43210',
            'Bangalore, Karnataka', 'ABCDE1234F', 95000.0, 1550000.0,
            'New Tax Regime (Sec 115BAC)', 'Moderate-Aggressive',
            300000.0, 210000.0, 'HDFC Bank (A/c **4921)',
            'aarav.sharma@okhdfcbank', 'INR (₹)', 'Indian System (Lakhs / Crores)',
            'DD-MM-YYYY', 'April - March', 'High (Margin ≥ 0.50)', '100% Local SQLite'
        )
        """)
        conn.commit()

    # Seed initial budgets if empty
    cur.execute("SELECT COUNT(*) FROM budgets")
    if cur.fetchone()[0] == 0:
        default_budgets = [
            ("Housing and utilities", 18000.0, 0.85),
            ("Food and groceries", 12000.0, 0.85),
            ("Transport and fuel", 7000.0, 0.85),
            ("Healthcare", 3000.0, 0.85),
            ("Shopping", 5000.0, 0.85),
            ("Entertainment", 3000.0, 0.85),
            ("Education", 4000.0, 0.85),
            ("Travel", 4000.0, 0.85),
            ("Bills", 4000.0, 0.85),
            ("Other expenses", 5000.0, 0.85),
            ("_monthly_total", 65000.0, 0.90)
        ]
        cur.executemany("INSERT INTO budgets (category, monthly_limit, alert_threshold) VALUES (?, ?, ?)", default_budgets)
        conn.commit()

    # Seed initial subscriptions if empty
    cur.execute("SELECT COUNT(*) FROM subscriptions")
    if cur.fetchone()[0] == 0:
        today = date.today()
        seed_subs = [
            (str(uuid4()), "Netflix Premium", "Entertainment", 649.0, "monthly", (today + timedelta(days=12)).isoformat(), "HDFC Credit Card", "active", "Tv", "4K Ultra HD Family Plan"),
            (str(uuid4()), "Spotify Duo", "Entertainment", 149.0, "monthly", (today + timedelta(days=5)).isoformat(), "UPI Autopay", "active", "Music", "Music streaming subscription"),
            (str(uuid4()), "Cult.fit Elite Gym", "Healthcare", 1499.0, "monthly", (today + timedelta(days=21)).isoformat(), "ICICI NetBanking", "active", "Activity", "Unlimited gym & yoga pass"),
            (str(uuid4()), "Airtel Xstream Fiber", "Bills", 999.0, "monthly", (today + timedelta(days=3)).isoformat(), "HDFC Credit Card", "active", "Wifi", "200 Mbps broadband + landline"),
            (str(uuid4()), "Amazon Prime", "Shopping", 1499.0, "yearly", (today + timedelta(days=140)).isoformat(), "SBI Debit Card", "active", "ShoppingBag", "Annual Prime delivery & Video"),
            (str(uuid4()), "Google One 200GB", "Bills", 210.0, "monthly", (today + timedelta(days=18)).isoformat(), "UPI Autopay", "active", "Cloud", "Drive & Photos storage"),
        ]
        cur.executemany("""
        INSERT INTO subscriptions (id, name, category, amount, billing_cycle, next_renewal_date, payment_method, status, icon, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_subs)
        conn.commit()

    # Seed initial investments if empty
    cur.execute("SELECT COUNT(*) FROM investments")
    if cur.fetchone()[0] == 0:
        seed_investments = [
            (str(uuid4()), "Parag Parikh Flexi Cap Fund", "Mutual Fund", 125000.0, 154200.0, 1940.5, 10000.0, "Groww", "Equity Flexi Cap SIP on 5th"),
            (str(uuid4()), "UTI Nifty 50 Index Fund", "Mutual Fund", 90000.0, 108400.0, 680.2, 5000.0, "Zerodha Coin", "Large cap index tracker"),
            (str(uuid4()), "HDFC Bank Ltd Shares", "Stock", 58000.0, 64200.0, 40.0, 0.0, "Zerodha Kite", "Direct equity banking bluechip"),
            (str(uuid4()), "Tata Motors Ltd Shares", "Stock", 42000.0, 56800.0, 65.0, 0.0, "Zerodha Kite", "Automotive & EV play"),
            (str(uuid4()), "Sovereign Gold Bond (SGB 2023-IV)", "Gold", 61000.0, 78400.0, 10.0, 0.0, "RBI Retail Direct", "2.5% p.a. semi-annual interest"),
            (str(uuid4()), "HDFC Senior/Flexi Fixed Deposit", "Fixed Deposit", 150000.0, 162500.0, 1.0, 0.0, "HDFC Bank", "7.25% p.a. matures in 18 months"),
            (str(uuid4()), "Employee Provident Fund (EPF)", "EPF/PPF", 210000.0, 228000.0, 1.0, 7500.0, "EPFO", "Mandatory statutory retirement balance"),
        ]
        cur.executemany("""
        INSERT INTO investments (id, name, asset_class, invested_amount, current_value, units, monthly_sip, institution, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_investments)
        conn.commit()

    # Check if transactions table is empty; if so, populate from CSV or seed
    cur.execute("SELECT COUNT(*) FROM transactions")
    if cur.fetchone()[0] == 0:
        if CSV_FALLBACK.exists():
            try:
                df = pd.read_csv(CSV_FALLBACK)
                if not df.empty:
                    for _, row in df.iterrows():
                        tid = str(row.get("Transaction ID", "") or row.get("transaction_id", "") or uuid4().hex)
                        tkey = str(row.get("Transaction Key", "") or row.get("transaction_key", "") or build_key(row))
                        d_val = str(row.get("Date", "") or row.get("date", "") or date.today().isoformat())
                        desc = str(row.get("Description", "") or row.get("description", "") or "").strip()
                        amt = float(pd.to_numeric(row.get("Amount") or row.get("amount") or 0, errors="coerce") or 0.0)
                        ttype = str(row.get("Type", "Expense") or row.get("type", "Expense"))
                        cat = str(row.get("Category", "Other expenses") or row.get("category", "Other expenses"))
                        conf = str(row.get("Confidence", "High") or row.get("confidence", "High"))
                        cscore = float(pd.to_numeric(row.get("Confidence Score") or row.get("confidence_score") or 1.0, errors="coerce") or 1.0)
                        src = str(row.get("Prediction Source", "Machine Learning Model") or row.get("prediction_source", "Machine Learning Model"))
                        merch = str(row.get("Matched Merchant", "—") or row.get("matched_merchant", "—"))
                        rev = str(row.get("Review Status", "Prediction Accepted") or row.get("review_status", "Prediction Accepted"))
                        
                        cur.execute("""
                        INSERT OR IGNORE INTO transactions 
                        (transaction_id, transaction_key, date, description, amount, type, category, confidence, confidence_score, prediction_source, matched_merchant, review_status, is_demo)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                        """, (tid, tkey, d_val, desc, amt, ttype, cat, conf, cscore, src, merch, rev))
                    conn.commit()
            except Exception as e:
                print("CSV migration note:", e)

    conn.close()
    seed_demo_transactions_if_empty()


def build_key(row):
    d_val = str(row.get("Date") or row.get("date") or "")
    desc = str(row.get("Description") or row.get("description") or "").strip().lower()
    amt = f"{float(pd.to_numeric(row.get('Amount') or row.get('amount') or 0, errors='coerce') or 0):.2f}"
    ttype = str(row.get("Type") or row.get("type") or "Expense").strip().lower()
    fp = f"{d_val}|{desc}|{amt}|{ttype}"
    return hashlib.sha256(fp.encode("utf-8")).hexdigest()


def seed_demo_transactions_if_empty():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM transactions")
    count = cur.fetchone()[0]
    if count > 5:
        conn.close()
        return

    today = date.today()
    demo_txns = []

    # Helper to generate dates in last 3 months
    def get_date(days_ago):
        return (today - timedelta(days=days_ago)).isoformat()

    items = [
        # Income
        (get_date(2), "Monthly Tech Salary Credit - Infosys Ltd", 95000.0, "Income", "Salary", "High", 1.0, "System", "Infosys"),
        (get_date(32), "Monthly Tech Salary Credit - Infosys Ltd", 95000.0, "Income", "Salary", "High", 1.0, "System", "Infosys"),
        (get_date(62), "Monthly Tech Salary Credit - Infosys Ltd", 95000.0, "Income", "Salary", "High", 1.0, "System", "Infosys"),
        (get_date(14), "Freelance UI Design Milestone - Upwork", 18500.0, "Income", "Freelance", "High", 0.98, "Manual Entry", "Upwork"),
        (get_date(44), "Mutual Fund Dividend Payout - HDFC MF", 2400.0, "Income", "Investments", "High", 0.95, "Merchant KB", "HDFC MF"),

        # Housing & Utilities
        (get_date(1), "Apartment Maintenance & Society Dues", 3500.0, "Expense", "Housing and utilities", "High", 0.95, "Feedback", "MyGate"),
        (get_date(3), "House Rent Transfer to Landlord", 18000.0, "Expense", "Housing and utilities", "High", 1.0, "Merchant KB", "Rent"),
        (get_date(33), "House Rent Transfer to Landlord", 18000.0, "Expense", "Housing and utilities", "High", 1.0, "Merchant KB", "Rent"),
        (get_date(6), "BESCOM Electricity Bill Payment", 2450.0, "Expense", "Bills", "High", 0.92, "Merchant KB", "BESCOM"),

        # Food & Groceries
        (get_date(0), "Swiggy Gourmet Dinner Order", 740.0, "Expense", "Food and groceries", "High", 0.96, "Merchant KB", "Swiggy"),
        (get_date(2), "Blinkit Instant Groceries & Veggies", 1120.0, "Expense", "Food and groceries", "High", 0.98, "Merchant KB", "Blinkit"),
        (get_date(4), "DMart Supermarket Monthly Essentials", 5430.0, "Expense", "Food and groceries", "High", 0.94, "Merchant KB", "DMart"),
        (get_date(7), "Zomato Biryani Night with Friends", 960.0, "Expense", "Food and groceries", "High", 0.96, "Merchant KB", "Zomato"),
        (get_date(9), "Starbucks Coffee & Snacks Indiranagar", 680.0, "Expense", "Food and groceries", "High", 0.91, "Merchant KB", "Starbucks"),
        (get_date(11), "Zepto Dairy & Snacks late night delivery", 480.0, "Expense", "Food and groceries", "High", 0.95, "Merchant KB", "Zepto"),

        # Transport & Fuel
        (get_date(1), "Uber Premier Ride to Tech Park", 480.0, "Expense", "Transport and fuel", "High", 0.97, "Merchant KB", "Uber"),
        (get_date(5), "Indian Oil Petrol Pump Fuel Refill", 2500.0, "Expense", "Transport and fuel", "High", 0.95, "Merchant KB", "Indian Oil"),
        (get_date(8), "Ola Electric Cabs Airport Roundtrip", 1320.0, "Expense", "Transport and fuel", "High", 0.93, "Merchant KB", "Ola"),
        (get_date(12), "Fastag Toll Auto Debit - NHAI Bangalore", 340.0, "Expense", "Transport and fuel", "High", 0.89, "Merchant KB", "Fastag"),

        # Shopping
        (get_date(3), "Amazon Great Indian Festival - Electronics", 4299.0, "Expense", "Shopping", "High", 0.94, "Merchant KB", "Amazon"),
        (get_date(10), "Myntra Festive Apparel & Shoes", 3150.0, "Expense", "Shopping", "High", 0.92, "Merchant KB", "Myntra"),
        (get_date(15), "Uniqlo Winter Jacket & Basics", 4990.0, "Expense", "Shopping", "High", 0.88, "Merchant KB", "Uniqlo"),

        # Healthcare
        (get_date(8), "Apollo Pharmacy Prescription Medicines", 1240.0, "Expense", "Healthcare", "High", 0.96, "Merchant KB", "Apollo Pharmacy"),
        (get_date(22), "Dentist Consultation & Polishing", 1800.0, "Expense", "Healthcare", "High", 0.85, "ML Model", "Clinic"),

        # Entertainment
        (get_date(5), "BookMyShow Movie Tickets IMAX Dune", 1200.0, "Expense", "Entertainment", "High", 0.97, "Merchant KB", "BookMyShow"),
        (get_date(13), "Steam Video Games Weekend Sale", 1750.0, "Expense", "Entertainment", "High", 0.91, "Merchant KB", "Steam"),

        # Education & Courses
        (get_date(16), "Coursera Professional Specialization Sub", 3200.0, "Expense", "Education", "High", 0.90, "Merchant KB", "Coursera"),

        # Travel
        (get_date(20), "MakeMyTrip Flight to Goa Weekend Trip", 7400.0, "Expense", "Travel", "High", 0.93, "Merchant KB", "MakeMyTrip"),
        (get_date(21), "Airbnb Goa Beach Villa 2 Nights", 6200.0, "Expense", "Travel", "High", 0.91, "Merchant KB", "Airbnb"),
    ]

    for d, desc, amt, ttype, cat, conf, cscore, src, merch in items:
        row = {"date": d, "description": desc, "amount": amt, "type": ttype}
        key = build_key(row)
        tid = uuid4().hex
        rev = "Prediction Accepted"
        cur.execute("""
        INSERT OR IGNORE INTO transactions 
        (transaction_id, transaction_key, date, description, amount, type, category, confidence, confidence_score, prediction_source, matched_merchant, review_status, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (tid, key, d, desc, amt, ttype, cat, conf, cscore, src, merch, rev))

    conn.commit()
    conn.close()


# Initialize database upon import
init_db()
