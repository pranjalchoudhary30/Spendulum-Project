"""
Spendulum 2.0 FastAPI Backend Application.
Provides RESTful APIs for transactions, analytics, budgets, subscriptions, investments,
SMS parsing, receipt OCR, predictive run-rate forecasting, and hybrid AI classification.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import init_db
from backend.routers import (
    transactions,
    analytics,
    budgets,
    subscriptions,
    investments,
    sms_upi,
    receipts,
    predictive,
    classifier,
    settings,
    profile
)

FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

app = FastAPI(
    title="Spendulum Financial API",
    version="2.0.0",
    description="Next-Generation Personal Finance & Wealth Management API for Indian Transactions"
)

# Enable CORS for local Vite dev server and cross-origin access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(transactions.router)
app.include_router(analytics.router)
app.include_router(budgets.router)
app.include_router(subscriptions.router)
app.include_router(investments.router)
app.include_router(sms_upi.router)
app.include_router(receipts.router)
app.include_router(predictive.router)
app.include_router(classifier.router)
app.include_router(settings.router)
app.include_router(profile.router)


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "Spendulum",
        "version": "2.0.0",
        "currency": "INR (₹)"
    }


# Serve static built frontend SPA if frontend/dist exists
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIST / "index.html"))


if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 so the app is reachable from other devices on the same network
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
