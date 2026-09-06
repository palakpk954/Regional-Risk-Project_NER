# Placify AI Viva Notes

## 20-Second Introduction

Placify AI is a TPO-first placement data engineering and analytics platform. It imports student placement data from Excel, CSV, or public Google Sheets, automatically maps inconsistent columns, cleans records, generates dashboards, detects at-risk students, predicts placement probability using explainable scoring with CatBoost-ready ML support, and exports reports for placement decision-making.

## Main Project USP

The strongest feature is the import pipeline:

Excel / CSV / Google Sheet -> smart column mapping -> validation -> cleaned dataset -> dashboard -> prediction -> report.

This is useful because placement cells often manage data manually in spreadsheets. Placify AI converts those spreadsheets into operational intelligence.

## Why This Is Not A Generic Student Portal

Placify AI is not mainly a student portal or ERP. It is a placement data processing and intelligence system for TPOs.

The student side is intentionally lean:
- Dashboard
- Opportunities
- Mock Interview
- Profile

The TPO side is the core:
- Dashboard
- Import Data
- Students
- Drives
- Prediction
- Reports

## Problem Statement Explanation

TPOs usually receive placement data from different departments in different formats. One sheet may use `dept`, another may use `stream`, and another may use `branch`. Similarly, CGPA may be written as `sgpa`, `gpa`, `score`, or `aggregate`.

Because of this, manual filtering and report generation become slow and error-prone. Placify AI solves this by automatically normalizing the data and generating analytics.

## Import Wizard Explanation

The import wizard has four steps:

1. Choose Source  
   The user uploads CSV/XLS/XLSX or pastes a public Google Sheets link.

2. Preview Rows  
   The system parses the file and shows the first rows before saving anything.

3. Review Mapping  
   The system detects columns and maps them to canonical fields like branch, CGPA, attendance, active backlogs, and placement status.

4. Commit Dashboard  
   After validation, the user commits the dataset. The dashboard updates immediately.

## Smart Column Mapping Examples

Placify maps messy column names like:

- `dept`, `stream`, `department` -> `branch`
- `sgpa`, `gpa`, `score`, `aggregate` -> `cgpa`
- `current_back`, `backs`, `kt` -> `activeBacklogs`
- `attd`, `attendance_percent`, `attendence` -> `attendance`
- `placed`, `selected`, `offer`, `hired` -> `placementStatus`

This is done by normalizing column names and matching them with a field dictionary.

## Dashboard Explanation

The TPO dashboard shows:

- Total students
- Eligible students
- Placed students
- Average package
- No resume count
- At-risk students
- Placement funnel
- Branch-wise overview
- Backlog impact
- Attendance risk
- Resume readiness
- Recent imports
- Operational insights

The dashboard is data-driven from imported rows.

## Eligibility Logic

A student is considered eligible based on:

- CGPA cutoff
- Attendance cutoff
- Active backlog limit
- Branch eligibility

If a student fails any condition, the system stores blocker reasons like:

- CGPA below cutoff
- Attendance below cutoff
- Active backlogs
- Branch not eligible

## Risk Detection Logic

Risk is calculated using:

- Low CGPA
- Low attendance
- Active backlogs
- Weak ATS score
- Low aptitude score
- Low communication score
- Missing resume

Risk categories:

- High Chance
- Medium
- At Risk

## Prediction Engine Explanation

The prediction engine estimates placement probability and shortlist probability.

Input features:

- CGPA
- Attendance
- Active backlogs
- Branch
- ATS score
- Aptitude score
- Communication score
- Projects
- Internships
- Skills count
- Applications count

Outputs:

- Placement probability
- Shortlist probability
- Risk category
- Score breakdown
- Positive factors
- Negative factors
- Recommended actions
- Model used

## Why CatBoost

CatBoost is a gradient boosting model originally developed by Yandex. It is suitable for tabular data, which makes it a good fit for placement prediction because most placement data is structured: CGPA, branch, attendance, backlogs, ATS score, and skill counts.

In this project, the ML layer is CatBoost-ready. If trained artifacts are available, CatBoost can be used. If not, the system uses deterministic fallback scoring so the demo never fails.

## Why Fallback Scoring Is Important

For a minor project demo, reliability is very important. If the ML service is unavailable, the application should still work. That is why Placify AI has transparent rule-based scoring as a fallback.

This also makes the prediction explainable instead of black-box.

## Technology Stack

Frontend:
- React
- Vite
- TailwindCSS
- Framer Motion
- Recharts
- Zustand

Backend:
- Node.js
- Express.js

Data processing:
- PapaParse for CSV
- SheetJS for Excel/XLSX
- Google Sheets public CSV export

ML:
- FastAPI
- CatBoost-ready endpoint
- Deterministic fallback scoring

Storage:
- localStorage demo mode

## Important Implementation Files

Frontend:
- `frontend/src/pages/MigrationPage.jsx` - import wizard
- `frontend/src/pages/AdminDashboard.jsx` - TPO dashboard
- `frontend/src/pages/TpoPredictionPage.jsx` - prediction page
- `frontend/src/services/migrationService.js` - CSV/XLSX/Sheets parsing and normalization
- `frontend/src/services/placementIntelligenceService.js` - dashboard analytics
- `frontend/src/services/jobMatchService.js` - match and readiness scoring

Backend:
- `backend/routes/ingestRoutes.js` - Google Sheets and ingestion APIs
- `backend/routes/intelligenceRoutes.js` - intelligence endpoints
- `backend/routes/matchRoutes.js` - prediction API
- `backend/services/placementPredictionEngine.js` - fallback prediction engine

ML:
- `ml/api/app.py` - FastAPI CatBoost-ready prediction service

## Demo Script

1. Open the app.
2. Login as TPO/Admin.
3. Show the simplified TPO navigation.
4. Open Import Data.
5. Upload a sample CSV/XLSX or paste a public Google Sheets URL.
6. Show the wizard steps:
   - choose source
   - preview rows
   - smart mapping
   - validation
   - commit
7. Commit the data.
8. Open Dashboard and show updated analytics.
9. Open Prediction and explain probability/risk.
10. Open Reports and explain export.
11. Optionally login as Student and show Opportunities/Profile.

## Common Viva Questions And Answers

### Q1. What problem does your project solve?

It solves the problem of messy placement data management. TPOs usually work with Excel and Google Sheets, and Placify converts that data into dashboards, eligibility insights, predictions, and reports.

### Q2. What is the main innovation in your project?

The main innovation is the smart import pipeline. It automatically maps inconsistent columns, validates records, removes duplicates, and generates analytics instantly.

### Q3. Is this an AI project?

It is AI-assisted but not fake AI. The system uses rule-based intelligence for explainability and has a CatBoost-ready ML layer for tabular placement prediction.

### Q4. Why did you use CatBoost?

CatBoost is good for tabular data. Placement prediction depends on structured features like CGPA, branch, attendance, backlogs, ATS score, skills, projects, and internships.

### Q5. What happens if the ML model is unavailable?

The system uses deterministic fallback scoring. This keeps the demo reliable and makes the output explainable.

### Q6. How does Google Sheets import work?

The user pastes a public Google Sheets URL. The backend extracts the sheet ID, converts it into a CSV export endpoint, fetches the data, parses rows, and sends them to the frontend preview.

### Q7. How do you handle different column names?

The system normalizes column names and matches them against aliases. For example, `dept`, `stream`, and `department` are all mapped to `branch`.

### Q8. How do you detect at-risk students?

The system checks CGPA, attendance, backlogs, ATS score, aptitude score, communication score, and resume status. Based on these factors, it assigns a risk category.

### Q9. What is the future scope?

Future scope includes Supabase/PostgreSQL database, trained CatBoost artifacts using real historical data, role-based authentication, advanced resume parsing, email/WhatsApp reminders, and long-term placement trend forecasting.

### Q10. Why did you remove Resume Studio and My Predictor?

They made the project confusing and were not part of the core minor project story. Their useful logic was merged into Profile, Dashboard, Opportunities, and Prediction.

## Final Closing Line

Placify AI is designed to make placement operations faster, cleaner, and more insight-driven by converting raw spreadsheet data into actionable placement intelligence.

