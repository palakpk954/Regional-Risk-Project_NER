# Placify AI MVP Engine Roadmap

## 1) Goal
Create one streamlined Placement Intelligence Engine that powers all product surfaces:
- Migration (input)
- Dashboard (analytics)
- Students (workflow)
- Simulator (what-if planning)
- Reports (summary + AI layer)

Principle: one source of truth, multiple views.

## 2) One-Engine Architecture (Current + Target)

### Engine Core (single source of truth)
- `src/services/migrationService.js`
  - Input adapters: CSV, Excel, Google Sheets gviz
  - Canonical cleaning/normalization
- `src/services/engineService.js`
  - Deterministic analytics calculations
  - KPI, company distribution, branch performance, CGPA correlation, at-risk, insights
- `src/store/usePlacementStore.js`
  - Central app state and recomputation pipeline

### Presentation Layer (views only)
- `src/pages/MigrationPage.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/pages/StudentsPage.jsx`
- `src/pages/SimulatorPage.jsx`
- `src/pages/ReportsPage.jsx`

### AI Extension Layer (optional, not core logic)
- `src/services/reportService.js`
- `src/components/AiReportModal.jsx`

## 3) Streamlining Actions Applied
Unused legacy files were removed to reduce confusion and maintenance overhead.

### Removed frontend legacy UI/pages
- `src/components/charts/AdminInsightsCharts.jsx`
- `src/components/ChartSection.jsx`
- `src/components/FilterBar.jsx`
- `src/components/MetricCard.jsx`
- `src/components/Navbar.jsx`
- `src/components/ReportGenerator.jsx`
- `src/components/SettingsModal.jsx`
- `src/pages/AddCompanyPage.jsx`
- `src/pages/Login.jsx`
- `src/pages/StudentDashboard.jsx`
- `src/pages/StudentProfile.jsx`

### Removed frontend legacy service stack (unused)
- `src/services/api.js`
- `src/services/applicationService.js`
- `src/services/authService.js`
- `src/services/companyService.js`
- `src/services/dbService.js`
- `src/services/modeService.js`
- `src/services/studentService.js`
- `src/services/supabaseService.js`
- `src/services/workflowService.js`

### Removed backend dead routes/controllers
- `backend/controllers/placementController.js`
- `backend/routes/placementRoutes.js`

## 4) MVP Engine Contract
Keep this contract stable so all views stay synchronized.

### Input contract
Normalized student record:
- `id`
- `name`
- `email`
- `cgpa`
- `branch`
- `company`
- `status`

### Output contract from engine
- `kpis`: totalStudents, placedStudents, placementRate
- `companyDistribution`
- `branchPerformance`
- `cgpaCorrelation`
- `atRiskStudents`
- `insights`
- `prediction`
- `companyIntelligence`

Any new page must consume these outputs instead of creating custom parallel calculations.

## 5) MVP Launch Plan (for anyone to run)

### Environment
- Node.js LTS
- npm

### Run steps
1. Install dependencies
   - `cd frontend`
   - `npm install`
2. Start dev server
   - `npm run dev`
3. Open app and test flow
   - Migration -> Dashboard -> Students -> Simulator -> Reports
4. Build check
   - `npm run build`

### Demo quickstart
- On Migration page:
  - Click `Load Demo Dataset`
  - Open Dashboard
  - Click company pie slice to filter charts + table
  - Export filtered student CSV

## 6) Next Hardening (to make it truly launch-grade)
1. Add unit tests for engine invariants:
   - placedStudents <= totalStudents
   - branch totals sum consistency
   - CGPA bucket consistency
2. Add integration tests for import adapters:
   - CSV, Excel, gviz with malformed header cases
3. Add telemetry-friendly error boundaries in pages
4. Add versioned schema marker to persisted localStorage data

## 7) Future: API Key Productization Plan (Engine-as-a-Service)
Goal: let external users call Placify engine with API key.

### Step A: Extract engine core as shared module
- Move deterministic logic to `packages/placify-engine-core` (or `backend/engine-core`)
- Reuse same logic in frontend and backend to avoid drift

### Step B: Create public backend API
- `POST /v1/analyze`
  - input: student rows
  - output: same engine contract
- `POST /v1/report`
  - input: engine output + options
  - output: summary/report blocks

### Step C: API key auth and usage controls
- `x-api-key` middleware
- Key scopes: analyze, report
- Per-key rate limiting and usage logs
- Key rotation and revoke support

### Step D: Product packaging
- Dashboard web app (current)
- API docs + playground
- Starter SDK snippets (JS/Python)

## 8) Definition of Done for Streamlined MVP
- One engine path from upload to output
- No orphan pages/services in active repo flow
- Build passes with no runtime import errors
- Every chart/table in dashboard reacts to same filter state
- Reports use the same engine snapshot as dashboard
