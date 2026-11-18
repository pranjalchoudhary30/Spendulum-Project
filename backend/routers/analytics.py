"""
Analytics & Financial Insights Router.
Aggregates summary balances, category distributions, cash flows, and time-series trends.
"""

from fastapi import APIRouter
import pandas as pd
from datetime import date
from backend.database import get_connection

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary():
    conn = get_connection()
    df = pd.read_sql_query("SELECT amount, type, review_status, date FROM transactions", conn)
    conn.close()

    if df.empty:
        return {
            "total_income": 0.0,
            "total_expense": 0.0,
            "net_cashflow": 0.0,
            "savings_rate": 0.0,
            "transaction_count": 0,
            "pending_reviews": 0
        }

    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    income = float(df[df["type"].str.lower() == "income"]["amount"].sum())
    expense = float(df[df["type"].str.lower() == "expense"]["amount"].sum())
    net_cashflow = income - expense
    savings_rate = round(((income - expense) / income * 100), 1) if income > 0 else 0.0
    pending_reviews = int((df["review_status"] == "User Confirmation Required").sum())

    return {
        "total_income": round(income, 2),
        "total_expense": round(expense, 2),
        "net_cashflow": round(net_cashflow, 2),
        "savings_rate": max(savings_rate, 0.0),
        "transaction_count": len(df),
        "pending_reviews": pending_reviews
    }


@router.get("/categories")
def get_categories():
    conn = get_connection()
    df = pd.read_sql_query("SELECT category, amount, type FROM transactions WHERE LOWER(type) = 'expense'", conn)
    conn.close()

    if df.empty:
        return []

    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    grouped = df.groupby("category")["amount"].sum().reset_index()
    total_spend = grouped["amount"].sum()

    results = []
    # Palette mapping for clean dark financial aesthetics
    color_map = {
        "Housing and utilities": "#3b82f6",
        "Food and groceries": "#10b981",
        "Transport and fuel": "#f59e0b",
        "Healthcare": "#ec4899",
        "Shopping": "#8b5cf6",
        "Entertainment": "#06b6d4",
        "Education": "#6366f1",
        "Travel": "#14b8a6",
        "Bills": "#eab308",
        "Other expenses": "#64748b"
    }

    for _, row in grouped.sort_values(by="amount", ascending=False).iterrows():
        cat = row["category"]
        amt = float(row["amount"])
        pct = round((amt / total_spend * 100), 1) if total_spend > 0 else 0.0
        results.append({
            "category": cat,
            "amount": round(amt, 2),
            "percentage": pct,
            "color": color_map.get(cat, "#10b981")
        })

    return results


@router.get("/trends")
def get_trends():
    conn = get_connection()
    df = pd.read_sql_query("SELECT date, amount, type FROM transactions ORDER BY date ASC", conn)
    conn.close()

    if df.empty:
        return {"monthly": [], "daily": []}

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    df["month"] = df["date"].dt.strftime("%Y-%m")

    # Monthly Trends
    months = sorted(df["month"].unique())
    monthly_trends = []
    for m in months[-6:]: # Last 6 months
        m_df = df[df["month"] == m]
        m_inc = float(m_df[m_df["type"].str.lower() == "income"]["amount"].sum())
        m_exp = float(m_df[m_df["type"].str.lower() == "expense"]["amount"].sum())
        monthly_trends.append({
            "month": m,
            "income": round(m_inc, 2),
            "expense": round(m_exp, 2),
            "net": round(m_inc - m_exp, 2)
        })

    # Daily trends in current active month
    today = date.today()
    curr_month = today.strftime("%Y-%m")
    curr_df = df[df["month"] == curr_month]
    daily_trends = []
    if not curr_df.empty:
        daily_grouped = curr_df.groupby([curr_df["date"].dt.strftime("%Y-%m-%d"), "type"])["amount"].sum().unstack(fill_value=0.0).reset_index()
        for _, row in daily_grouped.iterrows():
            d_str = row["date"]
            exp = float(row.get("Expense", 0.0))
            inc = float(row.get("Income", 0.0))
            daily_trends.append({
                "date": d_str,
                "expense": round(exp, 2),
                "income": round(inc, 2)
            })

    return {
        "monthly": monthly_trends,
        "daily": daily_trends
    }


@router.get("/insights")
def get_insights():
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM transactions", conn)
    conn.close()

    if df.empty:
        return []

    insights = []
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    expenses = df[df["type"].str.lower() == "expense"]

    if not expenses.empty:
        top_cat = expenses.groupby("category")["amount"].sum().idxmax()
        top_cat_amt = expenses.groupby("category")["amount"].sum().max()
        insights.append({
            "type": "top_category",
            "title": "Largest Expense Bucket",
            "description": f"'{top_cat}' accounts for ₹{top_cat_amt:,.0f} of total logged expenses."
        })

        if "matched_merchant" in expenses.columns:
            merchants = expenses[expenses["matched_merchant"] != "—"].groupby("matched_merchant")["amount"].sum()
            if not merchants.empty:
                top_m = merchants.idxmax()
                top_m_amt = merchants.max()
                insights.append({
                    "type": "top_merchant",
                    "title": "Frequent Merchant Destination",
                    "description": f"Highest volume merchant is {top_m} with ₹{top_m_amt:,.0f} spent."
                })

    income = df[df["type"].str.lower() == "income"]["amount"].sum()
    expense = expenses["amount"].sum()
    if income > 0:
        ratio = (income - expense) / income
        if ratio >= 0.30:
            insights.append({
                "type": "healthy_savings",
                "title": "Healthy Savings Discipline",
                "description": f"Retaining {round(ratio*100, 1)}% of your income, beating the traditional 20% benchmark."
            })

    return insights
