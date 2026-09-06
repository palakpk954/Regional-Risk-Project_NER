# Placify AI

Placify AI is a college placement analytics demo that turns Excel, CSV, and public Google Sheets data into a clean placement dashboard.

It is built to be simple to run in VS Code and safe for demos. The app works in local demo mode by default, so you do not need MongoDB, Supabase, Firebase, Clerk, or an AI key just to open and present it.

## What It Does

- Import student placement data from CSV, Excel, or a public Google Sheet
- Detect columns like CGPA, branch, attendance, backlogs, placement status, and resume score
- Clean and normalize imported records
- Show placement overview, eligibility, risk, branch performance, resume readiness, and trends
- Search and filter students
- Generate reports with Placify AI branding
- Run mock interviews with Gemini when an API key is provided, or local fallback when it is not

## Project Structure

```text
placify-ai/
  backend/        Express API for ingestion, intelligence, reports, resume parsing, matching, interviews
  frontend/       React + Vite app (the application you run)
  ml/             FastAPI prediction service + trained CatBoost artifacts and notebooks
  sample data/    Ready-to-use JECRC-style sample CSV/XLSX files
  data/           Raw and processed data sources
  docs/           Demo runbook, presentation, and viva notes
  scripts/        Helper scripts (e.g. demo sample data generator)
  notebooks/      Existing notebooks from the original project
  ARCHITECTURE.md Detailed data model, API, and production migration notes
  FEATURES.md     Complete feature walkthrough for both TPO and student roles
```

## Requirements

Install these once:

- Node.js 18 or newer
- npm
- VS Code

Check versions:

```bash
node -v
npm -v
```

## First Time Setup

Open this folder in VS Code:

```text
C:\Users\Ruchin Audichya\Desktop\Minor-Project-main
```

Install backend modules:

```bash
cd backend
npm install
```

Install frontend modules:

```bash
cd ../frontend
npm install
```

## Run The Project

Open two VS Code terminals.

Terminal 1, start backend:

```bash
cd backend
npm start
```

Backend runs at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

Terminal 2, start frontend:

```bash
cd frontend
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

Open:

```text
http://localhost:5173
```

## Demo Login

The login page is prefilled for the demo.

| Role | Email | Password |
| --- | --- | --- |
| TPO/Admin | `admin@placify.edu` | `admin123` |
| Student | `student@placify.edu` | `student123` |

## Main Demo Flow

1. Login as TPO/Admin.
2. Open `Import Data`.
3. Upload a file from `sample data/` or paste a public Google Sheets link.
4. Review smart column mapping and row preview.
5. Click `Commit data`.
6. Go back to `Dashboard` and show the updated analytics.

## TPO Drive Flow

1. Login as TPO/Admin.
2. Open `Companies`.
3. Use the step-by-step opening builder.
4. Add company details, eligibility rules, required skills, hiring rounds, deadline, openings, and resume formats.
5. Review the live eligible-student and average-match estimate.
6. Publish, save as draft, edit, duplicate, close, or delete openings.

The backend also exposes demo-safe drive endpoints under `/api/drives` for list, create, update, duplicate, and delete operations.

## Student Flow

1. Login as Student.
2. Open `My Dashboard`.
3. Review placement readiness and match cards.
4. Check missing skills, hiring probability, shortlist probability, and improvement suggestions.
5. Quick apply to eligible drives.
6. Search/filter opportunities, save openings, track upcoming deadlines, and open `Profile` or `Mock Interview` to improve readiness.

## Unified Readiness Engine

Placify AI now keeps prediction, resume parsing, and profile proof in one compact flow instead of scattered pages.

- Frontend service: `frontend/src/services/readinessIntelligenceService.js`
- Backend endpoint: `POST /api/match/readiness`
- Inputs: student profile, active drives, applications, parsed resume signals, GitHub/LinkedIn/coding profile links.
- Outputs: match percentage, selection probability, readiness score, resume strength, missing skills, weak areas, improvement lift, smart insights, and recommended actions.
- Profile Intelligence stores resume signals directly inside the student profile, so uploaded resume data updates ATS score, skill heatmap, GitHub/LinkedIn/coding signals, and role match cards without a separate broken module.
- The scoring is explainable and demo-safe: CatBoost-ready tabular prediction plus deterministic weighted fallback rules, not a fake black-box model.

## Sample Data

Use these ready-made files:

```text
sample data/JECRC_Placement_Operations_2025.xlsx
sample data/JECRC_Placement_Master_2025.csv
sample data/JECRC_Resume_Intelligence_2025.csv
sample data/JECRC_Drive_Requirements_2025.csv
```

These files are synthetic demo data, not real student records.

## Google Sheets Import

Only public sheets are supported.

To prepare a Google Sheet:

1. Open the sheet.
2. Click `Share`.
3. Set access to `Anyone with the link`.
4. Keep role as `Viewer`.
5. Copy the sheet URL.
6. Paste it in `Import Data`.

Placify AI extracts the sheet ID, converts it to a CSV export URL, fetches the rows, maps columns, and builds a preview before saving.

## Optional Gemini Setup

Mock interviews work without Gemini because the backend includes a local fallback.

To enable Gemini responses, set this in the backend terminal before starting the server:

PowerShell:

```powershell
$env:GEMINI_API_KEY="your_api_key_here"
npm start
```

Command Prompt:

```cmd
set GEMINI_API_KEY=your_api_key_here
npm start
```

## Useful Commands

Frontend:

```bash
cd frontend
npm run lint
npm run build
npm run dev
```

Backend:

```bash
cd backend
npm start
```

## API And Architecture Docs

See:

```text
ARCHITECTURE.md
```

It includes:

- Folder structure
- Canonical student/drive/application schema
- Prediction engine explanation
- API endpoint summary
- Environment variables
- Production migration path

## Troubleshooting

### Missing module error

Run install again in the folder that failed:

```bash
cd frontend
npm install
```

or:

```bash
cd backend
npm install
```

### Port already in use

If frontend port `5173` is busy, Vite will usually choose another port and print it in the terminal.

If backend port `5000` is busy, close the old backend terminal or stop the Node process using Task Manager.

### Google Sheet does not load

Check that:

- The link is a Google Sheets link
- The sheet is public
- Access is set to `Anyone with the link`
- The sheet has a header row
- The browser/backend has internet access

### Login does not work

Use the demo credentials exactly:

```text
admin@placify.edu / admin123
student@placify.edu / student123
```

### Blank or old-looking page

Hard refresh the browser:

```text
Ctrl + Shift + R
```

If that does not help, restart the frontend:

```bash
cd frontend
npm run dev
```

## Notes For Presentation

Short explanation:

> Placify AI converts placement Excel and Google Sheets data into a clean dashboard for TPOs. It automatically maps messy columns, calculates eligibility and risk, shows branch and resume insights, and helps colleges understand placement readiness quickly.

Best things to show:

- Paste Google Sheets link or upload sample Excel
- Smart column mapping
- Dashboard KPIs and charts
- Student readiness table
- Report export
- Mock interview fallback/Gemini flow

## Current Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- Zustand
- Recharts
- Framer Motion
- PapaParse
- SheetJS
- lucide-react

Backend:

- Node.js
- Express
- pdf-parse
- mammoth
- local demo services
- optional Gemini API key

## Audit Warnings

`npm install` may show package audit warnings from third-party dependencies. The project still runs. Avoid running forced audit fixes during a demo because major dependency upgrades can break compatibility.
