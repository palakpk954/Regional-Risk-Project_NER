import pypandoc
import os

print("Downloading Pandoc (this may take a moment)...")
pypandoc.download_pandoc()

print("Converting Markdown to Word (.docx)...")
md_file = r"c:\Users\HP\Desktop\Research wokr\Thesis_Final.md"
docx_file = r"c:\Users\HP\Desktop\Research wokr\Thesis_Final_v2.docx"

pypandoc.convert_file(md_file, 'docx', outputfile=docx_file)
print(f"Success! Saved Word file to: {docx_file}")
Writes: rain_results_*.csv, rain_analysis_figure.png, rain_results_summary.txt  (suffix _MOCK in mock mode)

Design notes (documented so they can be quoted in the thesis methodology):
 * Positive sample  = event day of a RAINFALL-triggered event (mining/unknown-trigger events are excluded).
 * Negative samples = days in the 60-day windows that are > 3 days from ANY catalogue event date (conservative).
   Only days with a full 30-day antecedent record are used.
 * Features = 1,3,5,7,10,15,30-day accumulated rainfall (mm, ending on the sample day) and max daily rainfall in 30 days.
 * Consecutive days from one window are correlated, so all cross-validation is GROUPED by event window.
 * With ~30 positives an LSTM cannot be trained reliably; logistic regression and a shallow random forest are the
   honest baselines. Report them as such.
"""
import sys, numpy as np, pandas as pd, matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.stats import mannwhitneyu
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.metrics import roc_auc_score, average_precision_score, roc_curve, precision_recall_fscore_support

MOCK = "--mock" in sys.argv; SFX = "_MOCK" if MOCK else ""
SUMS = (1,3,5,7,10,15,30); GAP = 3
ser = pd.read_csv(f"Meghalaya_GPM_daily_series{SFX}.csv", parse_dates=["date"])
ev  = pd.read_csv(f"Meghalaya_events_with_GPM_rainfall{SFX}.csv", parse_dates=["event_date_clean"])
rain_ev = ev[ev.trigger_group.str.startswith("Rainfall")]
all_event_dates = ev.event_date_clean.values

# ---------- build labelled dataset ----------
rows = []
for eid, g in ser.groupby("event_id"):
    s = g.set_index("date").rain_mm.sort_index()
    edate = ev.loc[ev.event_id == eid, "event_date_clean"].iloc[0]
    is_rain = eid in set(rain_ev.event_id)
    for k in range(29, len(s)):                                  # need 30 days ending on day k
        d = s.index[k]; w = s.iloc[k-29:k+1]
        if w.isna().any(): continue
        if d == edate:
            if not is_rain: continue
            y = 1
        else:
            if np.abs((all_event_dates - np.datetime64(d)).astype("timedelta64[D]").astype(int)).min() <= GAP: continue
            y = 0
        r = {"event_id": eid, "date": d, "y": y, "max30": w.max()}
        for n in SUMS: r[f"r{n}"] = s.iloc[k-n+1:k+1].sum()
        rows.append(r)
D = pd.DataFrame(rows)
feats = [f"r{n}" for n in SUMS] + ["max30"]
pos, neg = D[D.y == 1], D[D.y == 0]
print(f"samples: {len(pos)} positive event days, {len(neg)} non-event days from {D.event_id.nunique()} windows")
if len(pos) < 8: sys.exit("Too few positive samples with complete rainfall data.")

# ---------- 1. descriptive ----------
desc = pd.DataFrame({f: {"event_median": pos[f].median(), "event_IQR": f"{pos[f].quantile(.25):.1f}-{pos[f].quantile(.75):.1f}",
        "nonevent_median": neg[f].median(), "nonevent_IQR": f"{neg[f].quantile(.25):.1f}-{neg[f].quantile(.75):.1f}",
        "AUC_single_feature": roc_auc_score(D.y, D[f]), "MannWhitney_p": mannwhitneyu(pos[f], neg[f], alternative="greater").pvalue} for f in feats}).T
desc.round(3).to_csv(f"rain_results_descriptive{SFX}.csv"); print("\nDESCRIPTIVE\n", desc.round(3).to_string())

# ---------- 2. empirical lower-bound thresholds (10th percentile of triggering totals) ----------
thr = []
for n in SUMS:
    t = pos[f"r{n}"].quantile(0.10)
    thr.append({"duration_days": n, "threshold_mm (P10 of events)": round(t,1), "events_above_%": round((pos[f"r{n}"]>=t).mean()*100,1),
                "nonevent_days_above_% (false alarm rate)": round((neg[f"r{n}"]>=t).mean()*100,1)})
thr = pd.DataFrame(thr); thr.to_csv(f"rain_results_thresholds{SFX}.csv", index=False); print("\nTHRESHOLDS\n", thr.to_string(index=False))

# ---------- 3. intensity-duration lower-envelope (Caine-type), I = a * D^b ----------
lp = np.array([[np.log(n), np.log(r[f"r{n}"]/n)] for _, r in pos.iterrows() for n in SUMS if r[f"r{n}"] > 0])
b, la = np.polyfit(lp[:,0], lp[:,1], 1); res = lp[:,1] - (la + b*lp[:,0]); la10 = la + np.quantile(res, 0.10)
def id_rule(df): return np.any([df[f"r{n}"]/n >= np.exp(la10)*n**b for n in SUMS], axis=0)
id_tpr, id_fpr = id_rule(pos).mean(), id_rule(neg).mean()
print(f"\nI-D threshold  I = {np.exp(la10):.2f} * D^{b:.2f}  (mm/day, D in days): TPR {id_tpr:.2f}, false-alarm rate {id_fpr:.3f}")

# ---------- 4. ML baselines, grouped CV ----------
X = np.log1p(D[feats].values); y = D.y.values; g = D.event_id.values
models = {"Logistic regression": make_pipeline(StandardScaler(), LogisticRegression(class_weight="balanced", max_iter=2000, C=0.5)),
          "Random forest": RandomForestClassifier(n_estimators=300, max_depth=4, min_samples_leaf=5, class_weight="balanced_subsample", random_state=0)}
oof = {k: np.zeros(len(D)) for k in models}
for tr, te in StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=0).split(X, y, g):
    for k, mdl in models.items(): oof[k][te] = mdl.fit(X[tr], y[tr]).predict_proba(X[te])[:,1]
best_f = desc.AUC_single_feature.idxmax(); oof[f"Single feature ({best_f})"] = D[best_f].values
ml = []
for k, p in oof.items():
    fpr, tpr, th = roc_curve(y, p); i = np.argmax(tpr >= 0.80)           # operating point at >=80% recall
    pr, rc, f1, _ = precision_recall_fscore_support(y, p >= th[i], average="binary", zero_division=0)
    ml.append({"model": k, "ROC_AUC": roc_auc_score(y, p), "PR_AUC": average_precision_score(y, p),
               "recall@op": rc, "precision@op": pr, "F1@op": f1, "false_alarm_rate@op": fpr[i]})
ml = pd.DataFrame(ml).round(3); ml.to_csv(f"rain_results_models{SFX}.csv", index=False); print("\nMODELS (grouped 5-fold CV; operating point chosen for >=80% recall)\n", ml.to_string(index=False))

# ---------- 5. figure ----------
fig, ax = plt.subplots(1, 3, figsize=(13, 4))
for j, f in enumerate(["r3", "r7", "r15"]):
    ax[0].boxplot([neg[f], pos[f]], positions=[j*3, j*3+1], widths=.8, showfliers=False)
ax[0].set_xticks([0.5, 3.5, 6.5]); ax[0].set_xticklabels(["3-day", "7-day", "15-day"]); ax[0].set_ylabel("accumulated rainfall (mm)")
ax[0].set_title("Non-event (left) vs event (right) days")
for k, p in oof.items():
    fpr, tpr, _ = roc_curve(y, p); ax[1].plot(fpr, tpr, label=f"{k} (AUC {roc_auc_score(y,p):.2f})")
ax[1].plot([0,1],[0,1],"k:"); ax[1].set_xlabel("false-alarm rate"); ax[1].set_ylabel("recall"); ax[1].legend(fontsize=7); ax[1].set_title("ROC (grouped CV)")
ax[2].scatter(np.repeat(SUMS, len(neg)), (neg[[f"r{n}" for n in SUMS]].values/np.array(SUMS)).T.ravel()[:len(SUMS)*len(neg)] if False else
              np.concatenate([neg[f"r{n}"]/n for n in SUMS]), s=3, c="#BBBBBB", label="non-event days")
for n in SUMS: ax[2].scatter([n]*len(pos), pos[f"r{n}"]/n, s=14, c="#C00000")
ax[2].scatter([], [], s=14, c="#C00000", label="event days"); dd = np.linspace(1, 30, 50); ax[2].plot(dd, np.exp(la10)*dd**b, "b-", label="I-D threshold")
ax[2].set_xscale("log"); ax[2].set_yscale("log"); ax[2].set_xlabel("duration D (days)"); ax[2].set_ylabel("mean intensity (mm/day)"); ax[2].legend(fontsize=7); ax[2].set_title("Intensity-duration")
if MOCK: fig.suptitle("SYNTHETIC DATA - LOGIC TEST ONLY", color="red", weight="bold")
plt.tight_layout(); plt.savefig(f"rain_analysis_figure{SFX}.png", dpi=200)
with open(f"rain_results_summary{SFX}.txt", "w") as fh:
    fh.write(f"{'SYNTHETIC DATA - NOT RESULTS' if MOCK else 'Real GPM results'}\n{len(pos)} event days, {len(neg)} non-event days\n\n{desc.round(3).to_string()}\n\n{thr.to_string(index=False)}\n\nI-D: I={np.exp(la10):.2f}*D^{b:.2f}; TPR {id_tpr:.2f}; FAR {id_fpr:.3f}\n\n{ml.to_string(index=False)}\n")
print("\nsaved figure + csv files")
