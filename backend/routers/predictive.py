"""
Predictive Budget & Forecasting Router.
Delivers real-time run-rate projections, daily velocity metrics, category pacing, and anomaly alerts.
"""

from fastapi import APIRouter
import pandas as pd
from backend.database import get_connection
from backend.services.predictive_engine import calculate_predictive_metrics

router = APIRouter(prefix="/api/predictive", tags=["predictive"])


@router.get("")
def get_predictive_analysis():
    conn = get_connection()
    df_txns = pd.read_sql_query("SELECT date, description, amount, type, category FROM transactions", conn)
    cur = conn.cursor()
    cur.execute("SELECT category, monthly_limit FROM budgets")
    b_rows = cur.fetchall()
    conn.close()

    budgets_dict = {r["category"]: float(r["monthly_limit"]) for r in b_rows}
    result = calculate_predictive_metrics(df_txns, budgets_dict)
    return result
