"""
ML Bridge Service.
Wraps the hybrid AI classifier (User Feedback -> Merchant Knowledge Base -> SVM Model)
for use in FastAPI endpoints and transaction processing.
"""

import sys
from pathlib import Path
from typing import Dict, Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import ml.src.hybrid_classifier as hc
from ml.src.hybrid_classifier import predict_category, clean_transaction
from ml.src.user_feedback import save_feedback


def classify_text(description: str) -> Dict[str, Any]:
    """
    Returns prediction dictionary:
    {
        "category": str,
        "confidence": "High" | "Medium" | "Low",
        "confidence_score": float,
        "prediction_source": str,
        "matched_merchant": str,
        "review_status": str
    }
    """
    if not description or not description.strip():
        return {
            "category": "Other expenses",
            "confidence": "Low",
            "confidence_score": 0.5,
            "prediction_source": "Default",
            "matched_merchant": "—",
            "review_status": "User Confirmation Required"
        }
        
    res = predict_category(description)
    return {
        "category": res.get("category", "Other expenses"),
        "confidence": res.get("confidence", "Medium"),
        "confidence_score": round(float(res.get("confidence_score", 0.85)), 2),
        "prediction_source": res.get("source", "Machine Learning Model"),
        "matched_merchant": res.get("matched_merchant") or "—",
        "review_status": res.get("action", "Prediction Accepted")
    }


def record_correction(original_description: str, corrected_category: str):
    """
    Saves user feedback and immediately updates feedback rules so future predictions adapt.
    """
    cleaned = clean_transaction(original_description)
    predicted = classify_text(original_description).get("category", "Other expenses")
    save_feedback(original_description, cleaned, predicted, corrected_category)
    
    # Update in-memory feedback rules in hybrid classifier
    hc.feedback_rules[cleaned.lower()] = corrected_category
