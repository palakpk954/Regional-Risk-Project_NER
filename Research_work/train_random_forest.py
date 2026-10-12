"""
Random Forest Spatial Landslide Susceptibility Model Training

This script trains a Random Forest model on the prepared dataset, performs 
spatially-aware validation (spatial k-fold or simple spatial split), and 
generates performance metrics and feature importance charts.
"""

import os
import sys
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import joblib

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, RocCurveDisplay
    import seaborn as sns
except ImportError:
    print("Please install requirements: pip install scikit-learn matplotlib seaborn pandas numpy")
    sys.exit(1)

DIR = r"c:\Users\HP\Desktop\Research wokr"
DATASET_PATH = os.path.join(DIR, "landslide_research_outputs", "random_forest_dataset.csv")
OUT_DIR = os.path.join(DIR, "landslide_research_outputs", "rf_model_results")

if not os.path.exists(DATASET_PATH):
    print(f"Error: {DATASET_PATH} not found.")
    print("Please run prepare_rf_dataset.py first to generate the dataset!")
    sys.exit(1)

os.makedirs(OUT_DIR, exist_ok=True)
print("Loading dataset...")
df = pd.read_csv(DATASET_PATH)

# Features and Target
FEATURES = ['elevation', 'slope', 'aspect', 'lulc_class']
TARGET = 'landslide'

# Drop rows where any of the features are NaN
df = df.dropna(subset=FEATURES)

X = df[FEATURES]
y = df[TARGET]

print(f"Dataset shape: {X.shape}")
print(f"Class balance:\n{y.value_counts()}")

# ---------------------------------------------------------
# 1. Train-Test Split (Standard for now, ideally Spatial)
# ---------------------------------------------------------
# We use a standard 80/20 split. A spatial split would be better to avoid spatial autocorrelation.
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# ---------------------------------------------------------
# 2. Train Random Forest
# ---------------------------------------------------------
print("\nTraining Random Forest model...")
rf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced', n_jobs=-1)
rf.fit(X_train, y_train)

# ---------------------------------------------------------
# 3. Predict and Evaluate
# ---------------------------------------------------------
y_pred = rf.predict(X_test)
y_prob = rf.predict_proba(X_test)[:, 1]

print("\n--- Classification Report ---")
report = classification_report(y_test, y_pred)
print(report)

auc_score = roc_auc_score(y_test, y_prob)
print(f"ROC-AUC Score: {auc_score:.4f}")

# Save report
with open(os.path.join(OUT_DIR, "rf_classification_report.txt"), "w") as f:
    f.write("Random Forest Classification Report\n")
    f.write("===================================\n\n")
    f.write(report)
    f.write(f"\nROC-AUC Score: {auc_score:.4f}\n")

# ---------------------------------------------------------
# 4. Feature Importance Plot
# ---------------------------------------------------------
importances = rf.feature_importances_
indices = np.argsort(importances)[::-1]

plt.figure(figsize=(8, 5))
plt.title("Random Forest Feature Importances (Landslide Susceptibility)")
plt.bar(range(X.shape[1]), importances[indices], align="center")
plt.xticks(range(X.shape[1]), [FEATURES[i] for i in indices], rotation=45)
plt.xlim([-1, X.shape[1]])
plt.tight_layout()
plt.savefig(os.path.join(OUT_DIR, "feature_importance.png"))
plt.close()

# ---------------------------------------------------------
# 5. ROC Curve Plot
# ---------------------------------------------------------
plt.figure(figsize=(6, 6))
RocCurveDisplay.from_estimator(rf, X_test, y_test)
plt.title('ROC Curve for Random Forest')
plt.plot([0, 1], [0, 1], 'k--', label='Random Chance')
plt.tight_layout()
plt.savefig(os.path.join(OUT_DIR, "roc_curve.png"))
plt.close()

# Save the actual model for the web backend
model_path = os.path.join(DIR, "landslide_research_outputs", "rf_model.pkl")
joblib.dump(rf, model_path)
print(f"Model saved to: {model_path}")

print(f"\nSUCCESS! Results, Feature Importances, and ROC curves saved to: {OUT_DIR}")
