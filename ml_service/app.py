import os
import json
import joblib
import pandas as pd
from typing import Dict
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

# Model metadata and artifact paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "difficulty_model.joblib")
METADATA_PATH = os.path.join(BASE_DIR, "model_metadata.json")

model = None
metadata = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, metadata
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Trained model not found at {MODEL_PATH}. Run train_model.py first.")
    
    model = joblib.load(MODEL_PATH)
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            metadata = json.load(f)
    print("Difficulty model and metadata loaded successfully.")
    yield

app = FastAPI(
    title="LinguaQuest Difficulty Recommendation Service (Synthetic ML Demo)",
    description="Recommends quiz difficulty (Easy/Medium/Hard) based on accuracy, response time, attempts, and topic. Trained strictly on synthetic data for demo purposes.",
    version="1.0.0",
    lifespan=lifespan,
)

class PredictRequest(BaseModel):
    accuracy: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Historical accuracy score between 0.0 and 1.0",
        examples=[0.75]
    )
    avg_response_time_sec: float = Field(
        ...,
        gt=0.0,
        description="Average response time in seconds (must be strictly greater than 0)",
        examples=[10.5]
    )
    previous_attempts: int = Field(
        ...,
        ge=0,
        description="Count of previous lesson attempts (non-negative integer)",
        examples=[3]
    )
    topic: str = Field(
        ...,
        min_length=1,
        description="Topic / unit category name (e.g. Greetings, Basics, Food, etc.)",
        examples=["Greetings"]
    )

class PredictResponse(BaseModel):
    recommended_difficulty: str
    probabilities: Dict[str, float]
    synthetic_model: bool = True

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "synthetic_model": True,
        "note": metadata.get("note", "Trained on SYNTHETIC demo data - not real user data.")
    }

@app.post("/predict", response_model=PredictResponse, status_code=status.HTTP_200_OK)
def predict_difficulty(req: PredictRequest):
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded."
        )

    # DataFrame with EXACT required column ordering
    input_df = pd.DataFrame([{
        "accuracy": float(req.accuracy),
        "avg_response_time_sec": float(req.avg_response_time_sec),
        "previous_attempts": int(req.previous_attempts),
        "topic": str(req.topic).strip()
    }], columns=["accuracy", "avg_response_time_sec", "previous_attempts", "topic"])

    try:
        prediction = model.predict(input_df)[0]
        probs = model.predict_proba(input_df)[0]
        
        # Map class probabilities
        prob_dict = {
            cls_name: round(float(p), 4)
            for cls_name, p in zip(model.classes_, probs)
        }

        return PredictResponse(
            recommended_difficulty=str(prediction),
            probabilities=prob_dict,
            synthetic_model=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )
