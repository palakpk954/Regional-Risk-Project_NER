# Data Sources and Limitations

## Data Sources
1. **NASA Global Landslide Catalog (GLC)**: Provided locally via CSV/Excel exports.
2. **Rainfall Data (NASA GPM IMERG)**: Script `gpm_rainfall_extract.py` is present but rainfall data is not yet downloaded.

## Missing Datasets (Limitations)
- **Random Forest Predictors**: The workspace does not contain DEM (elevation, slope, aspect), Sentinel imagery (NDVI), Land Use/Land Cover (LULC), or Soil/Geology data. Therefore, the spatial dataset for the Random Forest model (`random_forest_dataset.csv`) **could not be created**.
- **LSTM Dataset**: To create `lstm_rainfall_dataset.csv`, historical daily rainfall data needs to be downloaded using NASA EarthData credentials. The script `gpm_rainfall_extract.py` has been provided but cannot run automatically without credentials. Synthetic data generation was avoided to prevent misleading results.

## Next Steps
- Acquire DEM, LULC, and spatial boundary (shapefile) data to build the Random Forest dataset.
- Create an EarthData account and run `python gpm_rainfall_extract.py` to acquire real rainfall time-series data for the LSTM.
