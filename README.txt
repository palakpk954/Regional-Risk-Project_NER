PlaceFlow - Simple Guide

1) How to run

Step 1: Install Node.js.
Step 2: Open project folder in terminal.
Step 3: Go to frontend folder.
cd frontend
Step 4: Install packages.
npm install
Step 5: Start app.
npm run dev
Step 6: Open browser.
http://localhost:5173


2) What this project does

PlaceFlow is a placement management system for colleges.
It replaces manual tracking in sheets and chat groups.

It has two users:
- Admin (TPO)
- Student

Admin can import data, manage workflow, and view analytics.
Student can check eligible companies, apply, and track status.


3) How to use (Admin)

- Login as Admin.
- Open Migration page.
- Upload CSV or paste Google Sheet link.
- Check preview and validation messages.
- Open Dashboard to see insights and charts.
- Add company from Add Company page.
- Update workflow status:
	Applied -> Shortlisted -> Interview -> Selected/Rejected
- Generate report from dashboard (AI key optional).


4) How to use (Student)

- Login as Student.
- Open Student Dashboard.
- See eligible companies.
- Click Apply for eligible drives.
- See your applications and status tracker.
- Open Profile page to update your details.


5) Demo mode vs Online mode

- Offline mode:
	Data is saved in browser localStorage.
	Works without Supabase.

- Online mode:
	Data sync uses Supabase table placeflow_state.
	Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend .env.
	If Supabase is not set, app safely continues in offline behavior.


6) Notes

- This project is designed as a SaaS-style college project.
- Main focus is workflow + migration + analytics.
- Backend folder exists, but frontend can run independently.

7) Himālya Watch monitoring API

The frontend now includes the North Eastern Region landslide monitoring MVP.

- Start the API: `cd backend` then `npm start`
- Optional MongoDB connection: set `MONGO_URI` before starting the API.
- Without MongoDB, the API uses a persistent JSON store at `backend/data/monitoring.json`, so local reports and alert acknowledgements survive restarts.
- Frontend API URL defaults to `http://localhost:5000/api`; set `VITE_API_URL` in `frontend/.env` to override it.
- Monitoring endpoints:
  - `GET /api/monitoring/overview`
  - `POST /api/monitoring/field-reports`
  - `PATCH /api/monitoring/alerts/:id/acknowledge`
  - `GET /api/monitoring/sources/status`
  - `POST /api/monitoring/ingest`
  - `GET /api/monitoring/predictions`

8) Real-data provider adapters

The backend includes adapters with safe demo fallbacks for weather, MQTT sensors, satellite observations, terrain/DEM, historical landslides, and road status. Configure provider URLs or credentials through environment variables before calling `POST /api/monitoring/ingest`:

- `WEATHER_API_URL`
- `MQTT_BROKER_URL`
- `SATELLITE_API_URL`
- `TERRAIN_API_URL`
- `LANDSLIDE_DATA_URL`
- `ROAD_STATUS_API_URL`

The current adapters define the normalized contract and preserve raw provider snapshots in `backend/data/monitoring.json`. Replace each adapter's `fetch` implementation with the authenticated provider client once access is approved. Predictions are an explainable baseline score, not an emergency-grade ML warning system.

9) GitHub Pages deployment

The frontend can be hosted on GitHub Pages, but the Express backend and MongoDB must be hosted separately.

1. Push this project to a GitHub repository using the `main` branch.
2. In GitHub, open Settings -> Pages and set the source to `GitHub Actions`.
3. If the backend is deployed, add a repository variable named `VITE_API_URL` containing its full API URL, for example `https://your-api.onrender.com/api`.
4. Push a change or run the `Deploy frontend to GitHub Pages` workflow manually.
5. Open `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`.

The workflow automatically configures the Vite base path for the repository. GitHub Pages only hosts the static frontend; deploy `backend` to Render, Railway, Fly.io, or another Node.js host and use MongoDB Atlas for production storage.
