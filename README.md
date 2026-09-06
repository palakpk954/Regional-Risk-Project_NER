# Himālya Watch

AI-enabled landslide risk monitoring and early-warning platform for India's North Eastern Region.

## Project structure

- `frontend/` - React/Vite dashboard with Leaflet mapping, alerts, field reporting, mascot guidance, and offline sync.
- `backend/` - Express monitoring API with MongoDB support and a persistent JSON fallback.
- `docs/` - Data collection and model planning documentation.

## Run locally

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Backend

```powershell
cd backend
npm install
npm start
```

The API runs on port `5000`, or the port supplied through `PORT`.

Set `VITE_API_URL` in `frontend/.env` when the API is hosted somewhere other than `http://localhost:5000/api`.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` publishes the frontend to GitHub Pages. Enable **Settings -> Pages -> GitHub Actions** in the repository. Set the repository variable `VITE_API_URL` to the deployed backend API URL.

GitHub Pages hosts only the frontend. Deploy the backend separately and use MongoDB Atlas for production persistence.

## Current data status

The provider adapters support weather, sensor, satellite, terrain, historical-event, and road-status integrations with safe demo fallbacks. The current prediction engine is an explainable baseline and is not an emergency-grade warning system until validated against real regional data.
