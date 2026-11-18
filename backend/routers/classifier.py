"""
AI Classifier & Feedback Router.
Interacts with the hybrid SVM model, merchant knowledge base, and continuous feedback system.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from pathlib import Path
import pandas as pd

from backend.services.ml_bridge import classify_text, record_correction

router = APIRouter(prefix="/api/classifier", tags=["classifier"])

DATA_DIR = Path(__file__).resolve().parents[2] / "ml" / "data"


class PredictRequest(BaseModel):
    description: str


class FeedbackRequest(BaseModel):
    description: str
    corrected_category: str


@router.post("/predict")
def predict_endpoint(req: PredictRequest):
    return classify_text(req.description)


@router.post("/feedback")
def feedback_endpoint(req: FeedbackRequest):
    record_correction(req.description, req.corrected_category)
    return {
        "success": True,
        "message": f"Successfully updated AI feedback rule for '{req.description}' to '{req.corrected_category}'"
    }


@router.get("/knowledge-base")
def get_knowledge_base():
    kb_file = DATA_DIR / "merchant_knowledge_base.csv"
    if kb_file.exists():
        df = pd.read_csv(kb_file)
        return df.to_dict(orient="records")
    return []


@router.get("/categories")
def get_available_categories():
    return [
        "Bills",
        "Education",
        "Entertainment",
        "Food and groceries",
        "Transport and fuel",
        "Healthcare",
        "Housing and utilities",
        "Shopping",
        "Travel",
        "Salary",
        "Freelance",
        "Investments",
        "Other expenses"
    ]
