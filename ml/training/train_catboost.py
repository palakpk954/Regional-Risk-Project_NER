from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostClassifier
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split


ROOT = Path(__file__).resolve().parents[2]
RAW_GITHUB = ROOT / "data" / "raw" / "github" / "Placement_Data_Full_Class.csv"
SAMPLE_MASTER = ROOT / "sample data" / "JECRC_Placement_Master_2025.csv"
PROCESSED_DIR = ROOT / "data" / "processed"
ARTIFACTS_DIR = ROOT / "ml" / "artifacts"

FEATURES = [
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
]
TARGET = "placed"
CAT_FEATURES = ["branch"]


def clamp(series: pd.Series, lower: float, upper: float) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").clip(lower, upper)


def normalize_status(value: object) -> int:
    text = str(value or "").strip().lower()
    return int(text in {"placed", "yes", "selected", "shortlisted", "hired", "offer", "1", "true"})


def count_skills(value: object) -> int:
    if pd.isna(value):
        return 0
    return len([item.strip() for item in str(value).replace("|", ",").replace(";", ",").split(",") if item.strip()])


def load_github_campus_dataset() -> pd.DataFrame:
    if not RAW_GITHUB.exists():
        return pd.DataFrame(columns=FEATURES + [TARGET, "source"])

    raw = pd.read_csv(RAW_GITHUB)
    df = pd.DataFrame()
    df["cgpa"] = clamp(raw["degree_p"] / 10, 0, 10)
    df["attendance"] = clamp((raw["ssc_p"] * 0.35 + raw["hsc_p"] * 0.35 + raw["etest_p"] * 0.30), 0, 100)
    df["active_backlogs"] = 0
    df["branch"] = raw["degree_t"].replace({
        "Sci&Tech": "CSE",
        "Comm&Mgmt": "MBA",
        "Others": "Other",
    }).fillna("Other")
    df["ats_score"] = clamp(raw["mba_p"] * 1.08, 0, 100)
    df["aptitude_score"] = clamp(raw["etest_p"], 0, 100)
    df["communication_score"] = clamp(raw["hsc_p"] * 0.45 + raw["mba_p"] * 0.55, 0, 100)
    df["projects"] = np.where(raw["workex"].astype(str).str.lower().eq("yes"), 2, 1)
    df["internships"] = np.where(raw["workex"].astype(str).str.lower().eq("yes"), 1, 0)
    df["skills_count"] = np.where(raw["degree_t"].astype(str).str.contains("Sci", case=False, na=False), 6, 4)
    df["applications_count"] = np.where(raw["workex"].astype(str).str.lower().eq("yes"), 2, 1)
    df[TARGET] = raw["status"].map(normalize_status)
    df["source"] = "github_campus_placement_factors"
    return df


def load_jecrc_sample_dataset() -> pd.DataFrame:
    if not SAMPLE_MASTER.exists():
        return pd.DataFrame(columns=FEATURES + [TARGET, "source"])

    raw = pd.read_csv(SAMPLE_MASTER)
    df = pd.DataFrame()
    df["cgpa"] = clamp(raw.get("SGPA", 0), 0, 10)
    df["attendance"] = clamp(raw.get("Attendance %", 75), 0, 100)
    df["active_backlogs"] = pd.to_numeric(raw.get("Current Back", 0), errors="coerce").fillna(0).astype(int)
    df["branch"] = raw.get("Dept", "Other").fillna("Other").astype(str)
    df["ats_score"] = clamp(raw.get("ATS Score", 60), 0, 100)
    df["aptitude_score"] = clamp(raw.get("Aptitude Score", 55), 0, 100)
    df["communication_score"] = clamp(raw.get("Communication Score", 55), 0, 100)
    df["projects"] = pd.to_numeric(raw.get("Projects", 1), errors="coerce").fillna(1).astype(int)
    df["internships"] = pd.to_numeric(raw.get("Internships", 0), errors="coerce").fillna(0).astype(int)
    df["skills_count"] = raw.get("Required Skills", "").map(count_skills) + raw.get("Preferred Skills", "").map(count_skills)
    df["applications_count"] = (
        pd.to_numeric(raw.get("Projects", 1), errors="coerce").fillna(1).clip(0, 4)
        + pd.to_numeric(raw.get("Internships", 0), errors="coerce").fillna(0).clip(0, 3)
    ).clip(1, 6).astype(int)
    df[TARGET] = raw.get("Placed", "No").map(normalize_status)
    df["source"] = "placify_jecrc_synthetic_demo"
    return df


def prepare_training_data() -> pd.DataFrame:
    frames = [load_github_campus_dataset(), load_jecrc_sample_dataset()]
    data = pd.concat(frames, ignore_index=True)
    data = data.dropna(subset=["cgpa", "branch", TARGET])
    data["branch"] = data["branch"].fillna("Other").astype(str)

    for column in FEATURES:
        if column == "branch":
            continue
        data[column] = pd.to_numeric(data[column], errors="coerce")

    defaults = {
        "attendance": 75,
        "active_backlogs": 0,
        "ats_score": 60,
        "aptitude_score": 55,
        "communication_score": 55,
        "projects": 1,
        "internships": 0,
        "skills_count": 3,
        "applications_count": 1,
    }
    data = data.fillna(defaults)
    data[TARGET] = data[TARGET].astype(int)
    return data[FEATURES + [TARGET, "source"]]


def train() -> dict:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    data = prepare_training_data()
    processed_path = PROCESSED_DIR / "placement_training_data.csv"
    data.to_csv(processed_path, index=False)

    X = data[FEATURES]
    y = data[TARGET]
    stratify = y if y.nunique() > 1 and y.value_counts().min() >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
        stratify=stratify,
    )

    model = CatBoostClassifier(
        iterations=350,
        learning_rate=0.045,
        depth=5,
        loss_function="Logloss",
        eval_metric="AUC",
        random_seed=42,
        verbose=False,
    )
    cat_feature_indices = [FEATURES.index(name) for name in CAT_FEATURES]
    model.fit(X_train, y_train, cat_features=cat_feature_indices, eval_set=(X_test, y_test))

    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)[:, 1]
    accuracy = float(accuracy_score(y_test, predictions))
    roc_auc = float(roc_auc_score(y_test, probabilities)) if y_test.nunique() > 1 else None

    cbm_path = ARTIFACTS_DIR / "catboost_placement_model.cbm"
    model.save_model(str(cbm_path))
    joblib.dump({"model": model, "features": FEATURES, "cat_features": CAT_FEATURES}, ARTIFACTS_DIR / "placement_pipeline.joblib")

    importances = model.get_feature_importance()
    top_features = [
        {"feature": feature, "importance": round(float(score), 4)}
        for feature, score in sorted(zip(FEATURES, importances), key=lambda item: item[1], reverse=True)
    ]

    report = {
        "model_used": "catboost-tabular-v1",
        "rows": int(len(data)),
        "target_distribution": {str(key): int(value) for key, value in y.value_counts().to_dict().items()},
        "accuracy": round(accuracy, 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "features": FEATURES,
        "cat_features": CAT_FEATURES,
        "top_features": top_features[:8],
        "processed_dataset": str(processed_path.relative_to(ROOT)),
        "artifact": str(cbm_path.relative_to(ROOT)),
    }

    (ARTIFACTS_DIR / "model_metadata.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (ARTIFACTS_DIR / "training_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (ARTIFACTS_DIR / "insights_metadata.json").write_text(json.dumps({
        **report,
        "raw_feature_columns": FEATURES,
    }, indent=2), encoding="utf-8")
    (ARTIFACTS_DIR / "insights_summary.json").write_text(json.dumps({
        "cgpa_thresholds": {
            "high_chance": float(data.loc[data[TARGET].eq(1), "cgpa"].quantile(0.65)),
            "risk_zone": float(data.loc[data[TARGET].eq(0), "cgpa"].quantile(0.35)),
        },
        "branch_performance": data.groupby("branch")[TARGET].mean().mul(100).round(2).reset_index(name="placement_rate").to_dict("records"),
        "salary_trends": {},
        "baseline_prediction": {
            "probability": round(float(model.predict_proba(pd.DataFrame([{
                "cgpa": 7.5,
                "attendance": 80,
                "active_backlogs": 0,
                "branch": "CSE",
                "ats_score": 70,
                "aptitude_score": 68,
                "communication_score": 66,
                "projects": 2,
                "internships": 1,
                "skills_count": 5,
                "applications_count": 1,
            }]))[:, 1][0]) * 100, 2),
        },
    }, indent=2), encoding="utf-8")

    return report


if __name__ == "__main__":
    print(json.dumps(train(), indent=2))
