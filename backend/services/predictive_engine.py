"""
Predictive Budget & Forecasting Engine.
Calculates daily spending velocity, end-of-month projected run rates,
category pacing risk analysis, and transaction spending anomalies.
"""

import pandas as pd
from datetime import date, datetime, timedelta
import calendar
from typing import Dict, List, Any


def calculate_predictive_metrics(transactions_df: pd.DataFrame, budgets_dict: Dict[str, float]) -> Dict[str, Any]:
    """
    Computes real-time run-rate projections for current active month.
    """
    today = date.today()
    current_year = today.year
    current_month = today.month
    _, total_days_in_month = calendar.monthrange(current_year, current_month)

    days_elapsed = max(today.day, 1)
    days_remaining = max(total_days_in_month - days_elapsed, 0)
    month_progress_pct = round((days_elapsed / total_days_in_month) * 100, 1)

    if transactions_df.empty:
        return {
            "month": today.strftime("%B %Y"),
            "days_elapsed": days_elapsed,
            "days_remaining": days_remaining,
            "total_days": total_days_in_month,
            "month_progress_pct": month_progress_pct,
            "current_spent": 0.0,
            "daily_velocity": 0.0,
            "projected_month_end": 0.0,
            "total_budget": budgets_dict.get("_monthly_total", 65000.0),
            "projected_vs_budget_pct": 0.0,
            "overall_status": "Safe",
            "category_pacing": [],
            "anomalies": [],
            "recommendations": []
        }

    # Filter transactions for current month & Expense type
    df = transactions_df.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])

    current_month_mask = (df["date"].dt.year == current_year) & (df["date"].dt.month == current_month)
    month_expenses = df[current_month_mask & (df["type"].str.lower() == "expense")]

    current_spent = float(month_expenses["amount"].sum())
    daily_velocity = round(current_spent / days_elapsed, 2)
    projected_month_end = round(current_spent + (daily_velocity * days_remaining), 2)

    total_budget = float(budgets_dict.get("_monthly_total", 65000.0))
    projected_vs_budget_pct = round((projected_month_end / total_budget) * 100, 1) if total_budget > 0 else 0.0

    if projected_vs_budget_pct > 105:
        overall_status = "Critical"
    elif projected_vs_budget_pct > 90:
        overall_status = "Warning"
    else:
        overall_status = "Safe"

    # Category Pacing breakdown
    category_pacing = []
    category_spends = month_expenses.groupby("category")["amount"].sum().to_dict()

    for cat, budget_limit in budgets_dict.items():
        if cat == "_monthly_total":
            continue
        spent = float(category_spends.get(cat, 0.0))
        cat_velocity = round(spent / days_elapsed, 2)
        cat_projected = round(spent + (cat_velocity * days_remaining), 2)
        pacing_pct = round((cat_projected / budget_limit) * 100, 1) if budget_limit > 0 else 0.0

        if pacing_pct > 105:
            c_status = "Critical"
        elif pacing_pct > 85:
            c_status = "Warning"
        else:
            c_status = "Safe"

        category_pacing.append({
            "category": cat,
            "budget_limit": budget_limit,
            "spent": spent,
            "daily_velocity": cat_velocity,
            "projected": cat_projected,
            "pacing_pct": pacing_pct,
            "status": c_status,
            "buffer_remaining": round(budget_limit - cat_projected, 2)
        })

    # Sort category pacing by highest risk (highest pacing percentage)
    category_pacing.sort(key=lambda x: x["pacing_pct"], reverse=True)

    # Anomaly Detection: transactions > 2.5x category average
    anomalies = []
    if len(month_expenses) > 5:
        cat_means = month_expenses.groupby("category")["amount"].mean().to_dict()
        for _, row in month_expenses.iterrows():
            c = row["category"]
            amt = float(row["amount"])
            mean = cat_means.get(c, amt)
            if amt > 2500 and amt >= (mean * 2.5):
                anomalies.append({
                    "date": row["date"].strftime("%Y-%m-%d"),
                    "description": row["description"],
                    "category": c,
                    "amount": amt,
                    "avg_category_amount": round(mean, 2),
                    "multiplier": round(amt / max(mean, 1), 1)
                })

    # Recommendations
    recommendations = []
    critical_cats = [c for c in category_pacing if c["status"] == "Critical"]
    if critical_cats:
        top_risk = critical_cats[0]
        over_by = top_risk["projected"] - top_risk["budget_limit"]
        recommendations.append(
            f"{top_risk['category']} is trending {top_risk['pacing_pct']}% of its limit (projected ₹{top_risk['projected']:,.0f} vs ₹{top_risk['budget_limit']:,.0f}). Reducing daily spend in this bucket by ₹{round(over_by / max(days_remaining, 1)):,.0f}/day will bring it on track."
        )

    if overall_status == "Safe":
        recommendations.append(
            f"Spending discipline is solid: currently at {month_progress_pct}% of the month with projected burn within budget by ₹{max(total_budget - projected_month_end, 0):,.0f}."
        )
    elif overall_status == "Critical":
        recommendations.append(
            f"Overall run-rate is projected at ₹{projected_month_end:,.0f} against your ₹{total_budget:,.0f} budget. Postponing non-essential shopping or travel will prevent deficit."
        )

    return {
        "month": today.strftime("%B %Y"),
        "days_elapsed": days_elapsed,
        "days_remaining": days_remaining,
        "total_days": total_days_in_month,
        "month_progress_pct": month_progress_pct,
        "current_spent": current_spent,
        "daily_velocity": daily_velocity,
        "projected_month_end": projected_month_end,
        "total_budget": total_budget,
        "projected_vs_budget_pct": projected_vs_budget_pct,
        "overall_status": overall_status,
        "category_pacing": category_pacing,
        "anomalies": anomalies[:5],
        "recommendations": recommendations
    }
