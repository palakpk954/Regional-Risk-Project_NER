"""
NASA Global Landslide Catalog (GLC) -> India -> Meghalaya -> East Khasi Hills
Cleaning pipeline for the thesis "AI-Based Landslide EWS - NER (Meghalaya)".
Inputs : Global_Landslide_Catalog_Export_rows.csv ; GADM India district polygons (GeoJSON)
Outputs: cleaned CSVs + one Excel workbook (see bottom)
"""
import pandas as pd, numpy as np, unicodedata, geopandas as gpd
from shapely.geometry import Point

RAW  = "/mnt/user-data/uploads/Global_Landslide_Catalog_Export_rows.csv"
DIST = "/tmp/india_district.geojson"          # GADM v2-style India districts (github.com/geohacker/india)
OUT  = "/mnt/user-data/outputs/"
log  = []                                      # (step, rows_in, rows_out, note)

def strip_accents(s):
    return unicodedata.normalize("NFKD", str(s)).encode("ascii","ignore").decode() if pd.notna(s) else s

# ---------- 1. load + parse dates ----------
df = pd.read_csv(RAW, low_memory=False)
n0 = len(df)
df["event_datetime"] = pd.to_datetime(df.event_date, format="%m/%d/%Y %I:%M:%S %p", errors="coerce")
df["event_date_clean"] = df.event_datetime.dt.normalize()
df["has_time_of_day"] = df.event_datetime.dt.time.astype(str).ne("00:00:00")
log.append(("Load raw GLC", n0, n0, f"{df.event_datetime.isna().sum()} unparseable dates; range {df.event_datetime.min().date()} to {df.event_datetime.max().date()}"))

# ---------- 2. duplicates ----------
key = ["event_date_clean","latitude","longitude","event_title"]
before = len(df)
df = df.drop_duplicates(subset=key, keep="first").copy()
log.append(("Drop exact duplicates (same date+lat+lon+title)", before, len(df), "event_id is unique so it is excluded from the key"))

# ---------- 3. coordinate validity ----------
bad = df.latitude.isna() | df.longitude.isna() | ~df.latitude.between(-90,90) | ~df.longitude.between(-180,180) | ((df.latitude==0)&(df.longitude==0))
log.append(("Invalid / null / (0,0) coordinates", len(df), len(df)-bad.sum(), f"{bad.sum()} removed"))
df = df[~bad].copy()

# ---------- 4. spatial join to Indian districts (fixes missing country_name + inconsistent admin names) ----------
dist = gpd.read_file(DIST)[["NAME_1","NAME_2","geometry"]].rename(columns={"NAME_1":"state_gis","NAME_2":"district_gis"})
pts  = gpd.GeoDataFrame(df, geometry=[Point(x,y) for x,y in zip(df.longitude, df.latitude)], crs="EPSG:4326")
j = gpd.sjoin(pts, dist, how="left", predicate="within").drop(columns="index_right")
j = j[~j.index.duplicated(keep="first")]
df = pd.DataFrame(j.drop(columns="geometry"))
df["in_india_polygon"] = df.state_gis.notna()

# Near-border points that fall just outside polygons: nearest district within ~0.1 deg (~11 km)
miss = df[~df.in_india_polygon & (df.country_name.eq("India"))]
if len(miss):
    mp = gpd.GeoDataFrame(miss[[]], geometry=[Point(x,y) for x,y in zip(miss.longitude, miss.latitude)], crs="EPSG:4326")
    nn = gpd.sjoin_nearest(mp.to_crs(3857), dist.to_crs(3857), how="left", distance_col="d_m")
    nn = nn[~nn.index.duplicated(keep="first")]
    ok = nn[nn.d_m < 11000]
    df.loc[ok.index, ["state_gis","district_gis"]] = ok[["state_gis","district_gis"]].values
    df.loc[ok.index, "matched_by_nearest"] = True
df["matched_by_nearest"] = df.get("matched_by_nearest", False)
df["matched_by_nearest"] = df.matched_by_nearest.fillna(False).astype(bool)

# ---------- 5. India subset ----------
df["country_label_india"] = df.country_name.eq("India")
df["india_via_geometry_only"] = df.state_gis.notna() & ~df.country_label_india & df.country_name.isna()
# keep: labelled India (and located), or unlabelled-country rows that fall inside India
india = df[(df.country_label_india) | (df.india_via_geometry_only)].copy()
# labelled India but coordinates fall outside India (geocoding errors)
geo_err = india[india.state_gis.isna()]
log.append(("India filter: country_name=='India'", len(df), int(df.country_label_india.sum()), "as labelled in raw data"))
log.append(("  + rows with blank country_name that fall inside India polygon", 0, int(df.india_via_geometry_only.sum()), "recovered via spatial join (mostly 2016-17 records, which have no country field)"))
log.append(("  - labelled India but coordinates outside India (+11 km tolerance)", len(india), len(india)-len(geo_err), f"{len(geo_err)} removed -> saved to 'Review_geocode_errors'"))
india = india[india.state_gis.notna()].copy()

# state-name reconciliation
india["state_reported"] = india.admin_division_name.map(strip_accents)
india["state_reported_std"] = india.state_reported.replace({"Bengal":"West Bengal","Orissa":"Odisha","State of Odisha":"Odisha","NCT":"Delhi"})
india["state_gis"] = india.state_gis.replace({"Uttaranchal":"Uttarakhand","Orissa":"Odisha","Andaman and Nicobar":"Andaman and Nicobar Islands"})
gis_std = india.state_gis
india["state_mismatch"] = india.state_reported_std.notna() & (india.state_reported_std != gis_std) & ~(india.state_reported_std.eq("Kashmir") & india.state_gis.isin(["Jammu and Kashmir","Ladakh"]))
log.append(("State-name standardisation", len(india), len(india), f"diacritics removed (Meghalaya/Meghālaya etc.); {int(india.state_mismatch.sum())} rows where the catalogue's admin name disagrees with polygon state -> flagged"))

# ---------- 6. quality flags ----------
acc_km = {"exact":0,"1km":1,"5km":5,"10km":10,"25km":25,"50km":50,"100km":100,"250km":250}
india["location_uncertainty_km"] = india.location_accuracy.map(acc_km)       # 'unknown' -> NaN
india["coarse_location"] = india.location_uncertainty_km.isna() | (india.location_uncertainty_km >= 25)

trig_map = {"downpour":"Rainfall (intense)","rain":"Rainfall","continuous_rain":"Rainfall (prolonged)","monsoon":"Rainfall (monsoon)",
            "tropical_cyclone":"Rainfall (cyclone)","flooding":"Flood-related","snowfall_snowmelt":"Snow/melt","freeze_thaw":"Snow/melt",
            "mining":"Anthropogenic","construction":"Anthropogenic","earthquake":"Seismic","no_apparent_trigger":"None apparent",
            "unknown":"Unknown","other":"Other","dam_embankment_collapse":"Anthropogenic","leaking_pipe":"Anthropogenic"}
india["trigger_group"]  = india.landslide_trigger.map(trig_map).fillna("Unknown")
india["rainfall_triggered"] = india.trigger_group.str.startswith("Rainfall")
india["trigger_missing_or_unknown"] = india.trigger_group.isin(["Unknown","None apparent"])
india["fatality_count"] = india.fatality_count            # NaN kept (NaN != 0)
india["month"] = india.event_date_clean.dt.month
india["monsoon_season"] = india.month.between(6,9)
india["year"] = india.event_date_clean.dt.year

cols = ["event_id","event_date_clean","has_time_of_day","year","month","monsoon_season","event_title","location_description",
        "state_gis","district_gis","state_reported_std","state_mismatch","latitude","longitude","location_accuracy","location_uncertainty_km",
        "coarse_location","landslide_category","landslide_trigger","trigger_group","rainfall_triggered","trigger_missing_or_unknown",
        "landslide_size","landslide_setting","fatality_count","injury_count","source_name","source_link","country_label_india",
        "india_via_geometry_only","matched_by_nearest","event_description"]
india = india[cols].sort_values("event_date_clean").reset_index(drop=True)

# ---------- 7. NE region / Meghalaya / East Khasi Hills ----------
NER = ["Meghalaya","Assam","Mizoram","Manipur","Nagaland","Tripura","Sikkim","Arunachal Pradesh"]
ner = india[india.state_gis.isin(NER)].copy()
txt = india[["event_title","location_description","event_description"]].fillna("").agg(" ".join, axis=1)
mentions_megh = txt.str.contains(r"Meghalaya|Shillong|Cherrapunji|Sohra|Mawsynram|Jaintia|Khasi|Garo Hills", case=False, regex=True)
india["mentions_meghalaya"] = mentions_megh
megh_poly  = india.state_gis.eq("Meghalaya")
megh_label = india.state_reported_std.eq("Meghalaya")
megh = india[megh_poly | megh_label | mentions_megh].copy()
megh["meghalaya_status"] = np.where(megh.state_gis.eq("Meghalaya"),
    "CONFIRMED (coordinates inside Meghalaya)", "REVIEW (text/label says Meghalaya, coordinates are outside)")
megh_conf = megh[megh.state_gis.eq("Meghalaya")].copy()
megh_rev  = megh[~megh.state_gis.eq("Meghalaya")].copy()

ekh = megh_conf[megh_conf.district_gis.eq("East Khasi Hills")].copy()
# Study-area buffer: Sohra (Cherrapunji) 25.27N 91.72E ; Shillong 25.57N 91.88E ; events within 40 km of Sohra
def hav(lat1,lon1,lat2,lon2):
    p=np.pi/180; a=np.sin((lat2-lat1)*p/2)**2+np.cos(lat1*p)*np.cos(lat2*p)*np.sin((lon2-lon1)*p/2)**2
    return 12742*np.arcsin(np.sqrt(a))
megh_conf["km_to_sohra"]    = hav(megh_conf.latitude, megh_conf.longitude, 25.27, 91.72).round(1)
megh_conf["km_to_shillong"] = hav(megh_conf.latitude, megh_conf.longitude, 25.57, 91.88).round(1)
# confidence flag for study-area records
megh_conf["location_confidence"] = np.where(megh_conf.location_uncertainty_km.le(5), "OK (<=5 km)", "VERIFY (coarse/unknown location)")
MANUAL = {141: "Title 'Singtam' is a town in Sikkim; point plotted in East Khasi Hills -> probable geocoding error, exclude unless verified"}
megh_conf["manual_note"] = megh_conf.event_id.map(MANUAL)
megh_conf.loc[megh_conf.manual_note.notna(), "location_confidence"] = "EXCLUDE? (suspected mis-geocode)"
ekh = megh_conf[megh_conf.district_gis.eq("East Khasi Hills")].copy()
near_ekh = megh_conf[(~megh_conf.district_gis.eq("East Khasi Hills")) & ((megh_conf.km_to_sohra<=40)|(megh_conf.km_to_shillong<=25))].copy()

log.append(("NER states (polygon-based)", len(india), len(ner), ", ".join(f"{k}: {v}" for k,v in ner.state_gis.value_counts().items())))
log.append(("Meghalaya candidates (polygon OR admin label OR text mention)", len(india), len(megh), ""))
log.append(("  Meghalaya CONFIRMED (coordinates inside state)", len(megh), len(megh_conf), ""))
log.append(("  Meghalaya REVIEW (label/text says Meghalaya, point lies elsewhere)", len(megh), len(megh_rev), "likely geocoding errors, e.g. Singtam (Sikkim) plotted in Meghalaya; Guwahati places in Assam"))
log.append(("East Khasi Hills (polygon)", len(megh_conf), len(ekh), "GADM district boundaries are pre-2012 (Ri-Bhoi already separate; newer districts e.g. SW Khasi Hills not present)"))
log.append(("Near-EKH events outside district (<=40 km Sohra or <=25 km Shillong)", len(megh_conf), len(near_ekh), "candidate study-area additions"))

# ---------- 8. rainfall request table (for IMD / GPM IMERG) ----------
req = megh_conf[megh_conf.location_confidence.ne("EXCLUDE? (suspected mis-geocode)")][["event_id","event_date_clean","event_title","latitude","longitude","location_uncertainty_km","landslide_trigger","trigger_group"]].copy()
req["window_start_30d"] = req.event_date_clean - pd.Timedelta(days=30)
req["window_end"]       = req.event_date_clean
req["note"] = "Extract daily IMERG precipitation (mm/day) at the nearest 0.1deg cell; build 1,3,5,7,10,15,30-day antecedent sums + peak intensity"
req["imerg_cell_lat"] = (np.floor(req.latitude*10)/10+0.05).round(2)
req["imerg_cell_lon"] = (np.floor(req.longitude*10)/10+0.05).round(2)

# ---------- 9. save ----------
import re
_ill = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
def scrub(d):
    d = d.copy()
    for c in d.select_dtypes(include=["object","string"]).columns:
        d[c] = d[c].map(lambda v: _ill.sub(" ", v) if isinstance(v, str) else v)
    return d
india, megh_conf, megh_rev, ekh, near_ekh, req, ner, geo_err = [scrub(x) for x in (india, megh_conf, megh_rev, ekh, near_ekh, req, ner, geo_err)]
india.to_csv(OUT+"GLC_India_clean.csv", index=False)
megh_conf.to_csv(OUT+"GLC_Meghalaya_clean.csv", index=False)
ekh.to_csv(OUT+"GLC_EastKhasiHills_clean.csv", index=False)
req.to_csv(OUT+"Meghalaya_rainfall_extraction_windows.csv", index=False)

logdf = pd.DataFrame(log, columns=["Step","Rows in","Rows out","Notes"])
with pd.ExcelWriter(OUT+"GLC_Landslide_Cleaned_India_Meghalaya.xlsx", engine="openpyxl") as xw:
    logdf.to_excel(xw,sheet_name="Cleaning_log",index=False)
    ekh.to_excel(xw,sheet_name="EastKhasiHills",index=False)
    megh_conf.to_excel(xw,sheet_name="Meghalaya_confirmed",index=False)
    megh_rev.to_excel(xw,sheet_name="Meghalaya_REVIEW",index=False)
    near_ekh.to_excel(xw,sheet_name="Near_EKH_other_districts",index=False)
    req.to_excel(xw,sheet_name="Rainfall_windows",index=False)
    ner.to_excel(xw,sheet_name="NER_all",index=False)
    india.to_excel(xw,sheet_name="India_clean",index=False)
    geo_err.drop(columns=["geometry"],errors="ignore")[["event_id","event_date_clean","event_title","latitude","longitude","admin_division_name"]].to_excel(xw,sheet_name="Review_geocode_errors",index=False)

# ---------- 10. console summary ----------
pd.set_option("display.width",250); pd.set_option("display.max_colwidth",60)
print(logdf.to_string(index=False))
print("\nINDIA trigger groups:\n", india.trigger_group.value_counts().to_string())
print("\nMeghalaya CONFIRMED:", len(megh_conf), " EKH:", len(ekh))
print(megh_conf.year.value_counts().sort_index().to_string())
print(megh_conf.trigger_group.value_counts().to_string())
print(megh_conf.location_accuracy.value_counts().to_string())
print("\nEKH records\n", ekh[["event_id","event_date_clean","event_title","latitude","longitude","location_accuracy","landslide_trigger","fatality_count","source_name"]].to_string())
print("\nMeghalaya REVIEW\n", megh_rev[["event_id","event_date_clean","event_title","state_gis","state_reported_std","latitude","longitude"]].to_string())
print("\nnear EKH\n", near_ekh[["event_id","event_date_clean","event_title","district_gis","km_to_sohra","km_to_shillong"]].to_string())
print("\nIndia geocode errors:", len(geo_err)); print("state mismatches:", int(india.state_mismatch.sum()))
print(india[india.state_mismatch][["event_id","event_title","state_reported_std","state_gis"]].head(25).to_string())
