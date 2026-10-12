"""
Attach NASA GPM IMERG daily rainfall to the cleaned Meghalaya landslide events.

USAGE (on your own computer - NASA servers are not reachable from the sandbox where this was written):
    pip install earthaccess xarray netcdf4 h5netcdf pandas numpy
    1) free account: https://urs.earthdata.nasa.gov  (then approve "NASA GESDISC DATA ARCHIVE" under Applications > Authorized Apps)
    2) python gpm_rainfall_extract.py              # real download (asks for Earthdata login once)
       python gpm_rainfall_extract.py --test 3     # only the first 3 events (recommended first run)
       python gpm_rainfall_extract.py --mock       # offline logic test with SYNTHETIC rainfall (never use for results)

Product : GPM_3IMERGDF v07 (IMERG Final Run, daily, 0.1 deg, mm/day). Day = UTC day (IST = UTC+5:30).
Input   : Meghalaya_rainfall_extraction_windows.csv  (from glc_cleaning_pipeline.py)
Outputs : Meghalaya_GPM_daily_series.csv    (long format: event_id, date, rain_mm)  <- used for non-event (negative) days
          Meghalaya_events_with_GPM_rainfall.csv (per event: 1/3/5/7/10/15/30-day totals + max daily)
The script saves progress after every event, so if the connection drops just run it again.
"""
import sys, os, numpy as np, pandas as pd

WINDOW_DAYS = 60            # 30 days of antecedent rain are needed for features of days up to 30 days before the event
SUM_DAYS = (1, 3, 5, 7, 10, 15, 30)
MOCK = "--mock" in sys.argv
LIMIT = int(sys.argv[sys.argv.index("--test") + 1]) if "--test" in sys.argv else None
SUFFIX = "_MOCK" if MOCK else ""
SERIES_OUT = f"Meghalaya_GPM_daily_series{SUFFIX}.csv"
FEAT_OUT   = f"Meghalaya_events_with_GPM_rainfall{SUFFIX}.csv"

def features_from_series(s):
    """s: daily rainfall Series indexed by date, last element = event day. Pure function (testable offline)."""
    out = {"rain_day0": s.iloc[-1]}
    for n in SUM_DAYS:
        out[f"rain_{n}d_mm"] = s.iloc[-n:].sum(min_count=1)
    out["rain_max_daily_30d"] = s.iloc[-30:].max()
    return out

def fetch_series(row):
    """Real download of one event window. Returns daily Series indexed by date (mm/day)."""
    import earthaccess, xarray as xr, os, shutil
    start = row.event_date_clean - pd.Timedelta(days=WINDOW_DAYS)
    res = earthaccess.search_data(short_name="GPM_3IMERGDF", version="07",
            temporal=(start.strftime("%Y-%m-%d"), row.event_date_clean.strftime("%Y-%m-%d")),
            bounding_box=(row.longitude-0.2, row.latitude-0.2, row.longitude+0.2, row.latitude+0.2))
    if not res: raise RuntimeError("no IMERG granules found")
    tmp_dir = f"tmp_gpm_{row.event_id}"
    os.makedirs(tmp_dir, exist_ok=True)
    paths = earthaccess.download(res, tmp_dir)
    ds = xr.open_mfdataset(paths, combine="by_coords", engine="h5netcdf")
    p = ds["precipitation"].sel(lon=row.longitude, lat=row.latitude, method="nearest").load()
    ds.close()
    shutil.rmtree(tmp_dir, ignore_errors=True)
    idx = pd.to_datetime([t.strftime("%Y-%m-%d") for t in p.indexes["time"]])
    s = pd.Series(p.values.astype(float), index=idx).sort_index()
    s[s < 0] = np.nan                                   # fill values
    return s.reindex(pd.date_range(start, row.event_date_clean))

def mock_series(row, rng):
    """SYNTHETIC monsoon-like rainfall for logic testing only."""
    days = pd.date_range(row.event_date_clean - pd.Timedelta(days=WINDOW_DAYS), row.event_date_clean)
    s = rng.gamma(0.6, 12, len(days)); s[-4:] *= rng.uniform(1.5, 4)      # wetter just before the "event"
    return pd.Series(s, index=days)

ev = pd.read_csv("Meghalaya_rainfall_extraction_windows.csv", parse_dates=["event_date_clean"])
if LIMIT: ev = ev.head(LIMIT)
done = pd.read_csv(SERIES_OUT) if os.path.exists(SERIES_OUT) else pd.DataFrame(columns=["event_id","date","rain_mm"])
done_ids = set(done.event_id.unique())
rng = np.random.default_rng(42)
if not MOCK:
    os.environ["EARTHDATA_USERNAME"] = "palakkumari123"
    os.environ["EARTHDATA_PASSWORD"] = "Palak@qwerty123"
    import earthaccess; earthaccess.login(strategy="environment")

series_rows = [done]
for k, row in enumerate(ev.itertuples(), 1):
    if row.event_id in done_ids: print(f"[{k}/{len(ev)}] event {row.event_id} already done"); continue
    try:
        s = mock_series(row, rng) if MOCK else fetch_series(row)
    except Exception as e:
        print(f"[{k}/{len(ev)}] event {row.event_id} FAILED: {e}"); continue
    series_rows.append(pd.DataFrame({"event_id": row.event_id, "date": s.index.strftime("%Y-%m-%d"), "rain_mm": s.values}))
    pd.concat(series_rows).to_csv(SERIES_OUT, index=False)            # save progress
    print(f"[{k}/{len(ev)}] event {row.event_id} {row.event_date_clean.date()} ok")

ser = pd.concat(series_rows); ser["date"] = pd.to_datetime(ser["date"])
feats = []
for row in ev.itertuples():
    s = ser[ser.event_id == row.event_id].set_index("date").rain_mm.sort_index()
    if len(s): feats.append({"event_id": row.event_id, **features_from_series(s)})
pd.DataFrame(feats).merge(ev, on="event_id").to_csv(FEAT_OUT, index=False)
print("saved", SERIES_OUT, "and", FEAT_OUT, "(SYNTHETIC - DO NOT USE)" if MOCK else "")
