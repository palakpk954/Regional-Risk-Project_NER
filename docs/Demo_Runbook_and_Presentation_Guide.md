# Placify AI Demo Runbook And Presentation Guide

## Best Demo Dataset

Use this file during the demo:

```text
sample data/Placify_AI_Demo_Placement_Intelligence_2025.xlsx
```

CSV version:

```text
sample data/Placify_AI_Demo_Placement_Intelligence_2025.csv
```

Why this file is ideal:

- 41 rows of synthetic JECRC-style placement data
- 40 unique students
- 1 intentional duplicate record
- 6 company drives
- mixed branches: CSE, IT, ECE, CSE-AI, Electrical, Mechanical, Civil
- realistic CGPA, attendance, active backlogs, ATS score, aptitude score, communication score, projects, internships, skills, company, role, package, and placement status
- college-style column names such as `Dept`, `SGPA`, `Current Back`, `Attendance_Percent`, and `Package_LPA`

## One-Time Setup In VS Code

Open the project folder:

```text
C:\Users\Ruchin Audichya\Documents\Codex\2026-05-09\https-github-com-shriya-gakkhar1-minor
```

Install dependencies if needed:

```powershell
cd frontend
npm install

cd ..\backend
npm install

cd ..
```

If Python dependencies are missing for ML:

```powershell
cd ml
pip install -r requirements.txt
cd ..
```

## How To Run For Demo

Open three VS Code terminals.

Terminal 1: Frontend

```powershell
cd frontend
npm run dev
```

Expected:

```text
http://127.0.0.1:5173
```

Terminal 2: Node Backend

```powershell
cd backend
npm start
```

Expected health check:

```text
http://127.0.0.1:5000/api/health
```

Terminal 3: Python ML API

```powershell
cd ml
python -m uvicorn api.app:app --host 127.0.0.1 --port 8000
```

Expected CatBoost status:

```text
http://127.0.0.1:8000/prediction/status
```

If the ML API does not start, the app still works using the rules fallback. But for demo, keep ML running so the UI shows:

```text
CatBoost is active end-to-end
```

## Demo Flow

### 1. Start At Login

Open:

```text
http://127.0.0.1:5173/login
```

Use TPO demo login.

Explain:

> Placify starts from a clean dashboard. It does not depend on pre-filled fake data. The main workflow begins when a TPO imports placement data.

### 2. Show Empty Dashboard

Go to:

```text
Placement Intelligence Center
```

Say:

> This is the first-run state. The dashboard is empty until the college imports Excel, CSV, or Google Sheets data.

### 3. Import Dataset

Go to:

```text
AI Data Ingestion
```

Upload:

```text
sample data/Placify_AI_Demo_Placement_Intelligence_2025.xlsx
```

Point out staged processing:

- AI analyzing placement dataset
- Mapping columns
- Normalizing data
- Finding missing values
- Detecting student patterns
- Generating intelligence insights

Explain:

> The system reads messy college-style columns and maps them into a clean placement schema.

Examples:

```text
Dept -> branch
SGPA -> cgpa
Current Back -> activeBacklogs
Attendance_Percent -> attendance
Package_LPA -> package
```

### 4. Commit Data

Click:

```text
Commit to dashboard
```

Then click:

```text
View dashboard
```

### 5. Explain Dashboard

Show:

- Candidate Pool
- Placement Ready
- Success Pipeline
- Intervention Required
- Placement Market
- Hiring Velocity
- Placement Funnel
- Branch-wise Overview
- Operational Insights
- Backlog Impact
- Attendance Risk
- Resume Availability

Say:

> The dashboard is generated from imported data. It is not static. The intelligence layer calculates eligibility, risk, branch readiness, duplicate records, resume gaps, and placement progress.

### 6. Show Prediction Page

Go to:

```text
Placement Predictor AI
```

Show:

- CatBoost active status
- Feature importance
- Prediction queue
- Student prediction explanation

Say:

> CatBoost is used for tabular placement prediction. If the Python ML service is unavailable, the rules fallback keeps the demo working.

### 7. Show Student Side

Logout and login as Student.

Show:

- Career Command Center
- Opportunity Hub
- AI Interview Arena
- Profile Intelligence

Say:

> The student side is lean. It shows opportunities created by TPO and gives readiness/match feedback.

## 60-Second Presentation Script

Placify AI is a placement intelligence platform for college TPOs. The main problem is that placement teams usually manage student data in messy Excel sheets and cannot quickly understand eligibility, readiness, risk, and placement progress. Placify solves this by letting the TPO upload Excel, CSV, or Google Sheets data. The system automatically maps columns like Dept, SGPA, Current Back, and Package LPA into a clean schema, removes duplicates, validates records, and generates dashboards instantly. It shows candidate pool, placement-ready students, branch readiness, backlog impact, attendance risk, resume availability, and students needing intervention. For prediction, we added a CatBoost-based tabular ML model with a rules fallback, so predictions are both data-driven and explainable. The result is a realistic TPO-first data engineering and placement intelligence platform.

## Viva Points To Remember

### Problem

TPOs use Excel sheets but struggle to analyze placement readiness quickly.

### Solution

Placify converts messy placement data into clean analytics and prediction insights.

### Main USP

```text
Upload Excel/CSV/Google Sheet -> Smart mapping -> Clean data -> Dashboard -> Prediction -> Report
```

### Why CatBoost

CatBoost works well for tabular data and can learn patterns better than fixed weighted rules.

### Why Rules Fallback

The project remains demo-safe even if the ML service is not running.

### What Is Explainable

The system shows:

- feature importance
- prediction probability
- positive factors
- negative factors
- suggestions

## Common Demo Problems And Fixes

### Frontend does not open

Run:

```powershell
cd frontend
npm install
npm run dev
```

### Backend API not working

Run:

```powershell
cd backend
npm install
npm start
```

### CatBoost not active

Run:

```powershell
cd ml
python -m uvicorn api.app:app --host 127.0.0.1 --port 8000
```

Then check:

```text
http://127.0.0.1:8000/prediction/status
```

### Dashboard looks empty

That is expected on first run. Import:

```text
sample data/Placify_AI_Demo_Placement_Intelligence_2025.xlsx
```

### Want to reset demo

Use browser localStorage clear, or open dev tools and clear site data for:

```text
http://127.0.0.1:5173
```

Then refresh and login again.
