from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from catboost import CatBoostClassifier
except Exception:  # pragma: no cover - optional dependency for demo mode
    CatBoostClassifier = None

APP_ROOT = Path(__file__).resolve().parent
ARTIFACTS_DIR = APP_ROOT.parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "placement_pipeline.joblib"
CATBOOST_PATH = ARTIFACTS_DIR / "catboost_placement_model.cbm"
META_PATH = ARTIFACTS_DIR / "insights_metadata.json"
SUMMARY_PATH = ARTIFACTS_DIR / "insights_summary.json"

app = FastAPI(title="Placify Prediction API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StudentProfile(BaseModel):
    cgpa: float = Field(..., ge=0, le=10)
    internships: int = Field(0, ge=0, le=10)
    branch: str
    gender: Optional[str] = None
    work_experience: int = Field(0, ge=0, le=10)


class PredictionResponse(BaseModel):
    is_placed: int
    placement_probability: float
    model_used: str
    top_features: List[str]


class PlacementPredictionInput(BaseModel):
    cgpa: float = Field(0, ge=0, le=10)
    attendance: float = Field(75, ge=0, le=100)
    active_backlogs: int = Field(0, ge=0, le=20)
    branch: str = "CSE"
    ats_score: float = Field(60, ge=0, le=100)
    aptitude_score: float = Field(55, ge=0, le=100)
    communication_score: float = Field(55, ge=0, le=100)
    projects: int = Field(1, ge=0, le=20)
    internships: int = Field(0, ge=0, le=10)
    skills_count: int = Field(3, ge=0, le=80)
    applications_count: int = Field(0, ge=0, le=100)


class PlacementPredictionResponse(BaseModel):
    probability: float
    shortlist_probability: float
    risk_category: str
    score_breakdown: dict
    explanations: List[str]
    suggestions: List[str]
    model_used: str
    catboost_available: bool


class InsightsSummary(BaseModel):
    model_used: str
    accuracy: float
    roc_auc: Optional[float] = None
    top_features: List[dict]
    cgpa_thresholds: dict
    branch_performance: List[dict]
    salary_trends: dict
    baseline_prediction: dict


pipeline = None
catboost_model = None
metadata = None
summary = None


def load_artifacts() -> None:
    global pipeline, catboost_model, metadata, summary
    if catboost_model is None and CatBoostClassifier is not None and CATBOOST_PATH.exists():
        catboost_model = CatBoostClassifier()
        catboost_model.load_model(str(CATBOOST_PATH))

    if pipeline is None and MODEL_PATH.exists():
        pipeline = joblib.load(MODEL_PATH)

    if metadata is None:
        if META_PATH.exists():
            metadata = json.loads(META_PATH.read_text(encoding="utf-8"))
        else:
            metadata = {}

    if summary is None:
        if SUMMARY_PATH.exists():
            summary = json.loads(SUMMARY_PATH.read_text(encoding="utf-8"))
        else:
            summary = {}


@app.on_event("startup")
def on_startup() -> None:
    try:
        load_artifacts()
    except FileNotFoundError:
        # Defer errors to request time so the app can still start.
        pass


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def category(probability: float) -> str:
    if probability >= 72:
        return "High Chance"
    if probability >= 46:
        return "Medium"
    return "At Risk"


def rule_prediction(profile: PlacementPredictionInput) -> PlacementPredictionResponse:
    academics = clamp(profile.cgpa * 10 - profile.active_backlogs * 11, 0, 100)
    attendance = clamp(profile.attendance, 0, 100)
    resume = clamp(profile.ats_score, 0, 100)
    performance = clamp(profile.aptitude_score * 0.55 + profile.communication_score * 0.45, 0, 100)
    proof = clamp(profile.projects * 15 + profile.internships * 22 + profile.skills_count * 4, 0, 100)
    activity = clamp(42 + profile.applications_count * 7, 0, 100)
    probability = round(
        academics * 0.22
        + attendance * 0.1
        + resume * 0.18
        + performance * 0.2
        + proof * 0.22
        + activity * 0.08,
        1,
    )
    shortlist_probability = round(clamp(probability * 0.92 + resume * 0.08, 0, 98), 1)

    explanations = []
    if academics >= 75:
        explanations.append("CGPA and backlog profile supports eligibility.")
    else:
        explanations.append("Academic or backlog profile is reducing probability.")
    if resume < 70:
        explanations.append("ATS score is below the ideal screening range.")
    if proof < 62:
        explanations.append("Projects, internships, or skills need stronger proof.")
    if performance >= 72:
        explanations.append("Aptitude and communication signals improve confidence.")

    suggestions = []
    if profile.active_backlogs > 0:
        suggestions.append("Clear active backlogs before strict eligibility drives.")
    if resume < 72:
        suggestions.append("Improve resume keywords, formatting, and role-specific sections.")
    if profile.projects < 2:
        suggestions.append("Add at least one deployed or measurable project.")
    if profile.internships < 1:
        suggestions.append("Add internship, open-source, freelance, or hackathon proof.")
    if profile.skills_count < 5:
        suggestions.append("Increase role-relevant technical skill coverage.")

    return PlacementPredictionResponse(
        probability=probability,
        shortlist_probability=shortlist_probability,
        risk_category=category(probability),
        score_breakdown={
            "academics": round(academics, 1),
            "attendance": round(attendance, 1),
            "resume": round(resume, 1),
            "performance": round(performance, 1),
            "proof": round(proof, 1),
            "activity": round(activity, 1),
        },
        explanations=explanations,
        suggestions=suggestions[:5],
        model_used="rules-fallback-v1",
        catboost_available=CatBoostClassifier is not None and CATBOOST_PATH.exists(),
    )


def build_input_frame(profile: StudentProfile) -> pd.DataFrame:
    if not metadata:
        raise HTTPException(status_code=503, detail="Artifacts are missing. Train the model first.")

    raw_columns = metadata.get("raw_feature_columns", [])
    if not raw_columns:
        raise HTTPException(status_code=500, detail="Model metadata missing raw feature columns.")

    payload = {
        "cgpa": profile.cgpa,
        "internships": profile.internships,
        "branch": profile.branch,
        "gender": profile.gender or "Unknown",
        "work_experience": profile.work_experience,
    }

    row = {col: payload.get(col) for col in raw_columns}
    return pd.DataFrame([row])


@app.get("/prediction/status")
def prediction_status():
    return {
        "preferred_model": "catboost-tabular-v1",
        "active_model": "catboost-tabular-v1" if catboost_model is not None else "rules-fallback-v1",
        "catboost_available": CatBoostClassifier is not None,
        "catboost_artifact_present": CATBOOST_PATH.exists(),
        "fallback_ready": True,
        "features": [
            "cgpa",
            "attendance",
            "active_backlogs",
            "branch",
            "ats_score",
            "aptitude_score",
            "communication_score",
            "projects",
            "internships",
            "skills_count",
            "applications_count",
        ],
    }


@app.post("/prediction/predict", response_model=PlacementPredictionResponse)
def predict_placement(profile: PlacementPredictionInput):
    fallback = rule_prediction(profile)

    if catboost_model is None:
        return fallback

    frame = pd.DataFrame([profile.model_dump()])
    try:
        probability = round(float(catboost_model.predict_proba(frame)[:, 1][0]) * 100, 1)
    except Exception:
        return fallback

    fallback.probability = probability
    fallback.shortlist_probability = round(clamp(probability * 0.92 + profile.ats_score * 0.08, 0, 98), 1)
    fallback.risk_category = category(probability)
    fallback.model_used = "catboost-tabular-v1"
    fallback.catboost_available = True
    return fallback


@app.get("/insights/summary", response_model=InsightsSummary)
def get_summary():
    if not metadata:
        raise HTTPException(status_code=503, detail="Artifacts are missing. Train the model first.")

    response = {
        "model_used": metadata.get("model_used", "catboost-tabular-v1"),
        "accuracy": metadata.get("accuracy", 0.0),
        "roc_auc": metadata.get("roc_auc"),
        "top_features": metadata.get("top_features", []),
        "cgpa_thresholds": summary.get("cgpa_thresholds", {}),
        "branch_performance": summary.get("branch_performance", []),
        "salary_trends": summary.get("salary_trends", {}),
        "baseline_prediction": summary.get("baseline_prediction", {}),
    }

    return response


@app.post("/insights/predict", response_model=PredictionResponse)
def predict(profile: StudentProfile):
    if catboost_model is None and pipeline is None:
        raise HTTPException(status_code=503, detail="Artifacts are missing. Train the model first.")

    if catboost_model is not None:
        frame = pd.DataFrame([{
            "cgpa": profile.cgpa,
            "attendance": 78,
            "active_backlogs": 0,
            "branch": profile.branch,
            "ats_score": 68,
            "aptitude_score": 65,
            "communication_score": 65,
            "projects": 2,
            "internships": profile.internships,
            "skills_count": 5,
            "applications_count": 1,
        }])
        proba = catboost_model.predict_proba(frame)[:, 1][0]
    else:
        frame = build_input_frame(profile)
        model = pipeline.get("model") if isinstance(pipeline, dict) else pipeline
        proba = model.predict_proba(frame)[:, 1][0]
    placement_probability = round(float(proba) * 100, 1)
    is_placed = 1 if placement_probability >= 50 else 0

    top_features = [item.get("feature") for item in metadata.get("top_features", [])][:5]

    return PredictionResponse(
        is_placed=is_placed,
        placement_probability=placement_probability,
        model_used=metadata.get("model_used", "catboost-tabular-v1"),
        top_features=[feature for feature in top_features if feature],
    )
