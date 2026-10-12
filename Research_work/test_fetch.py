import os, shutil
import earthaccess
os.environ["EARTHDATA_USERNAME"] = "palakkumari123"
os.environ["EARTHDATA_PASSWORD"] = "Palak@qwerty123"
earthaccess.login(strategy="environment")

res = earthaccess.search_data(short_name="GPM_3IMERGDF", version="07",
        temporal=("2010-02-20", "2010-02-21"),
        bounding_box=(91.0, 25.0, 92.0, 26.0))
print(f"Found {len(res)} granules")
print("Trying to download...")
os.makedirs("tmp_gpm", exist_ok=True)
files = earthaccess.download(res, "tmp_gpm")
print("Downloaded!", files)
shutil.rmtree("tmp_gpm")
