import pystac_client
import planetary_computer
import rasterio
from rasterio.merge import merge
import os

DIR = r"c:\Users\HP\Desktop\Research wokr"
bbox = [89.5, 25.0, 93.0, 26.5] # Meghalaya

print("Connecting to Planetary Computer...")
catalog = pystac_client.Client.open(
    "https://planetarycomputer.microsoft.com/api/stac/v1",
    modifier=planetary_computer.sign_inplace,
)

# 1. Download Copernicus DEM (30m)
print("Searching for Elevation Data (Copernicus DEM 30m)...")
search = catalog.search(
    collections=["cop-dem-glo-30"],
    bbox=bbox,
)
dem_items = list(search.items())
print(f"Found {len(dem_items)} DEM tiles. Downloading and merging (this may take a minute)...")

dem_urls = [item.assets["data"].href for item in dem_items]
src_files_to_mosaic = []
for url in dem_urls:
    try:
        src = rasterio.open(url)
        src_files_to_mosaic.append(src)
    except:
        pass

mosaic, out_trans = merge(src_files_to_mosaic, bounds=bbox)
out_meta = src_files_to_mosaic[0].meta.copy()
out_meta.update({"driver": "GTiff", "height": mosaic.shape[1], "width": mosaic.shape[2], "transform": out_trans})

out_dem = os.path.join(DIR, "dem.tif")
with rasterio.open(out_dem, "w", **out_meta) as dest:
    dest.write(mosaic)

for src in src_files_to_mosaic:
    src.close()
print(f"Saved {out_dem} successfully!")

# 2. Download ESA WorldCover (10m)
print("Searching for Land Cover Data (ESA WorldCover)...")
search = catalog.search(
    collections=["esa-worldcover"],
    bbox=bbox,
    datetime="2020-01-01/2021-12-31"
)
lulc_items = list(search.items())
print(f"Found {len(lulc_items)} LULC tiles. Downloading and merging...")

lulc_urls = [item.assets["map"].href for item in lulc_items]
src_files_to_mosaic_lulc = []
for url in lulc_urls:
    try:
        src = rasterio.open(url)
        src_files_to_mosaic_lulc.append(src)
    except:
        pass

print("Note: LULC at 10m is very large. Merging in memory...")
# We use a downsampled resolution to avoid memory crash (e.g. read at 30m instead of 10m)
# But rasterio.merge doesn't support res_{x,y} natively easily in one step without setting res.
res = (0.0002777777777777778, 0.0002777777777777778) # 30m
mosaic_lulc, out_trans_lulc = merge(src_files_to_mosaic_lulc, bounds=bbox, res=res)

out_meta_lulc = src_files_to_mosaic_lulc[0].meta.copy()
out_meta_lulc.update({"driver": "GTiff", "height": mosaic_lulc.shape[1], "width": mosaic_lulc.shape[2], "transform": out_trans_lulc})

out_lulc = os.path.join(DIR, "lulc.tif")
with rasterio.open(out_lulc, "w", **out_meta_lulc) as dest:
    dest.write(mosaic_lulc)

for src in src_files_to_mosaic_lulc:
    src.close()
print(f"Saved {out_lulc} successfully!")

print("\nAll spatial data downloaded successfully! You can now run prepare_rf_dataset.py")
