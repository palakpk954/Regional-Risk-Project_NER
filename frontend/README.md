# Placement Intelligence Engine (Offline)

This frontend is now a fully offline, engine-first placement analytics tool.

No backend is required.
No Supabase setup is required for active flows.

## Core Architecture

The app is structured as a 3-layer analytical engine:

1. Input Layer
- CSV upload
- Google Sheets import
- Optional mock sheet import for demo mode

2. Engine Layer
- `src/services/engineService.js`
- Processes records into:
	- total students
	- placed students
	- placement rate
	- company distribution
	- branch placement performance
	- CGPA vs placement correlation
- Generates smart insights:
	- at-risk students
	- top performing branch
	- top hiring company

3. Output Layer
- Dashboard visual analytics
- Insight statements
- Summary report preview and text download

4. Simulation Layer
- Scenario controls (CGPA threshold, company count, branch)
- Instant projected placement recomputation
- Offline AI Copilot with rule-based reasoning

## Storage

- Offline persistence uses `localStorage`
- Key: `placement_engine_rows_v1`
- Data is loaded automatically on app startup

## Main Routes

- `/` Engine dashboard
- `/migration` Input/import layer
- `/simulator` What-if simulation lab
- `/reports` Output/report layer

## Run Locally

```bash
npm install
npm run dev
```

## Build Validation

```bash
npm run build
```

Current status: production build passes.
