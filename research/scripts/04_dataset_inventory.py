import os
import glob
import json
import pandas as pd
import numpy as np

DIR = r"c:\Users\HP\Desktop\Research wokr"
OUT_DIR = os.path.join(DIR, "landslide_research_outputs")
os.makedirs(OUT_DIR, exist_ok=True)

# 1. Dataset Inventory
inventory = []
for file in glob.glob(os.path.join(DIR, "*.*")):
    if "landslide_research_outputs" in file: continue
    filename = os.path.basename(file)
    size = os.path.getsize(file)
    ext = os.path.splitext(filename)[1].lower()
    
    # Try to extract coverage or info
    info = ""
    if ext == ".csv" and "GLC" in filename:
        try:
            df = pd.read_csv(file, low_memory=False)
            info = f"Cols: {len(df.columns)}, Rows: {len(df)}"
        except:
            info = "CSV file"
    
    inventory.append({
        "Filename": filename,
        "Format": ext,
        "Size_Bytes": size,
        "Info": info,
        "Potential_Research_Use": "Landslide susceptibility / Rainfall modeling" if "GLC" in filename or "rainfall" in filename else "Script"
    })
pd.DataFrame(inventory).to_csv(os.path.join(OUT_DIR, "dataset_inventory.csv"), index=False)

# 2. Data Quality Report
raw_path = os.path.join(DIR, "Global_Landslide_Catalog_Export_rows.csv")
report = ["# Data Quality Report\n"]
if os.path.exists(raw_path):
    df_raw = pd.read_csv(raw_path, low_memory=False)
    report.append("## NASA Global Landslide Catalog")
    report.append(f"- **Total Records**: {len(df_raw)}")
    report.append(f"- **Columns**: {', '.join(df_raw.columns.tolist())}")
    report.append("\n### Missing Values (%)")
    missing = (df_raw.isnull().sum() / len(df_raw)) * 100
    for col, val in missing[missing > 0].items():
        report.append(f"- **{col}**: {val:.2f}%")
else:
    report.append("Raw GLC dataset not found.")

with open(os.path.join(OUT_DIR, "data_quality_report.md"), "w") as f:
    f.write("\n".join(report))

# 3 & 4 & 5. Meghalaya and EKH Events
meghalaya_csv = os.path.join(DIR, "GLC_Meghalaya_clean.csv")
ekh_csv = os.path.join(DIR, "GLC_EastKhasiHills_clean.csv")
excel_file = os.path.join(DIR, "GLC_Landslide_Cleaned_India_Meghalaya.xlsx")

if os.path.exists(meghalaya_csv):
    df_m = pd.read_csv(meghalaya_csv)
    df_m.to_csv(os.path.join(OUT_DIR, "meghalaya_landslide_events.csv"), index=False)
    
if os.path.exists(ekh_csv):
    df_e = pd.read_csv(ekh_csv)
    df_e.to_csv(os.path.join(OUT_DIR, "east_khasi_hills_events.csv"), index=False)

if os.path.exists(excel_file):
    try:
        df_rev = pd.read_excel(excel_file, sheet_name="Meghalaya_REVIEW")
        df_rev.to_csv(os.path.join(OUT_DIR, "events_needing_review.csv"), index=False)
    except:
        pass

# 6 & 7. RF Dataset and LSTM Dataset
# RF Dataset: Not possible (no DEM, Sentinel, LULC, Soil data)
# LSTM Dataset: Requires downloading from NASA EarthData via gpm_rainfall_extract.py

# 8. Data Sources and Limitations
limitations = """# Data Sources and Limitations

## Data Sources
1. **NASA Global Landslide Catalog (GLC)**: Provided locally via CSV/Excel exports.
2. **Rainfall Data (NASA GPM IMERG)**: Script `gpm_rainfall_extract.py` is present but rainfall data is not yet downloaded.

## Missing Datasets (Limitations)
- **Random Forest Predictors**: The workspace does not contain DEM (elevation, slope, aspect), Sentinel imagery (NDVI), Land Use/Land Cover (LULC), or Soil/Geology data. Therefore, the spatial dataset for the Random Forest model (`random_forest_dataset.csv`) **could not be created**.
- **LSTM Dataset**: To create `lstm_rainfall_dataset.csv`, historical daily rainfall data needs to be downloaded using NASA EarthData credentials. The script `gpm_rainfall_extract.py` has been provided but cannot run automatically without credentials. Synthetic data generation was avoided to prevent misleading results.

## Next Steps
- Acquire DEM, LULC, and spatial boundary (shapefile) data to build the Random Forest dataset.
- Create an EarthData account and run `python gpm_rainfall_extract.py` to acquire real rainfall time-series data for the LSTM.
"""
with open(os.path.join(OUT_DIR, "data_sources_and_limitations.md"), "w") as f:
    f.write(limitations)

# 9. Dataset Summary JSON
summary = {
    "Total_GLC_Records": len(df_raw) if os.path.exists(raw_path) else 0,
    "Meghalaya_Events": len(pd.read_csv(meghalaya_csv)) if os.path.exists(meghalaya_csv) else 0,
    "East_Khasi_Hills_Events": len(pd.read_csv(ekh_csv)) if os.path.exists(ekh_csv) else 0,
    "Random_Forest_Ready": False,
    "LSTM_Ready": False,
    "Missing_Data_For_RF": ["DEM", "LULC", "Soil", "Vegetation Index"],
    "Missing_Data_For_LSTM": ["GPM IMERG Rainfall Series (Needs download)"]
}
with open(os.path.join(OUT_DIR, "dataset_summary.json"), "w") as f:
    json.dump(summary, f, indent=4)

print("Deliverables generated successfully.")
