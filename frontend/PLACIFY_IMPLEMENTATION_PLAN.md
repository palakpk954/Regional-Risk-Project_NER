# Placify AI Implementation Plan

## 1) Product Goal
Build a Placement Intelligence Platform where TPO teams can upload placement data (CSV, Excel, Google Sheet), and the system automatically converts it into understandable insights, charts, company analysis, and filtered views.

## 2) Current Baseline
Already available in the app:
- CSV and Google Sheet ingestion flow
- Data cleaning and normalization pipeline
- Placement engine KPIs and simulation
- Students workflow, intervention queue, and reports
- Dashboard charts and insights

Still needed for full objective:
- Native Excel (.xlsx/.xls) upload support
- Stronger company drill-down experience
- More filter combinations and saved views
- AI-generated narrative expansion in more pages

## 3) Final Scope (What We Will Deliver)
1. Multi-format data input: CSV, Excel, Google Sheet
2. Canonical data pipeline: parse -> clean -> validate -> normalize
3. Placement insights: placement rate, branch performance, company hiring, at-risk cohorts
4. Visual analytics: pie, bar, trend charts with simple labels
5. Filter system: company, branch, CGPA, status, date, placement outcome
6. Company intelligence: where students got placed, top hiring companies, quality coverage
7. Human-readable output: clean tables + understandable graphs + downloadable reports

## 4) Architecture (MERN-Friendly View)
- Frontend: React + Vite + Tailwind + Recharts + Zustand
- Current runtime style: frontend-first offline analytics
- Data flow:
  Input (CSV/Excel/Sheet) -> Migration Service -> Engine Service -> Store -> Pages (Dashboard/Students/Planner/Reports)
- Optional AI layer:
  Report and recommendation generation via Gemini/OpenRouter/OpenAI (with fallback local logic)
- Backend:
  Node/Express exists and can be used later for auth, persistence, team collaboration, and scheduled jobs.

## 5) Execution Plan by Phase

### Phase A: Input Layer Hardening
Goal: make uploads reliable for real college data.
- Add Excel parser support (.xlsx/.xls) in migration service.
- Keep one canonical schema across CSV/Excel/Sheet.
- Add row-level validation messages and downloadable error rows.
- Add duplicate detection and merge hints.

Acceptance:
- 1 file from each format imports successfully.
- Invalid rows are listed with reason.
- Cleaned row count is always visible.

### Phase B: Insight Engine Expansion
Goal: produce stronger insights from same data.
- Add company-wise trend metrics (hiring count and placement contribution).
- Add branch x company heatmap-ready data object.
- Improve at-risk logic with configurable thresholds.
- Add confidence tags on computed insights.

Acceptance:
- Insight cards reflect filters correctly.
- Company and branch metrics stay consistent with totals.

### Phase C: Visualization and Filters UX
Goal: any non-technical user can understand output quickly.
- Add unified global filter bar shared by dashboard, students, and reports.
- Add company drill-down panel (hired students, branches, average CGPA).
- Add simple chart legends and plain-language subtitles.
- Add table export for current filtered view.

Acceptance:
- Same filter gives same numbers across all pages.
- Users can explain chart meaning without developer help.

### Phase D: Reports and AI Layer
Goal: convert numbers to decision-ready report text.
- Keep local report generation as default fallback.
- Expand AI report studio to include template presets:
  - Executive summary
  - Branch action plan
  - Company outreach plan
  - Student intervention plan
- Add one-click copy/export to TXT and PPT/PDF (where available).

Acceptance:
- Report can be generated with and without API key.
- Export output is readable and structured.

### Phase E: Production Readiness
Goal: make it demo-ready and synopsis-ready.
- Add test datasets (small, medium, large, edge-case).
- Add deterministic validation checklist for expected metrics.
- Update README with architecture diagram and module map.
- Freeze UI labels for student-first language.

Acceptance:
- Build passes.
- Validation checklist passes.
- Team can demo flow in under 3 minutes.

## 6) File-Level Implementation Map
- src/services/migrationService.js
  - Add Excel parser path and validation diagnostics.
- src/services/engineService.js
  - Expand company/branch insights and confidence tags.
- src/store/usePlacementStore.js
  - Apply global filter state and synchronized recomputation.
- src/pages/MigrationPage.jsx
  - Add file type support UI, row error list, import summary.
- src/pages/AdminDashboard.jsx
  - Add explainable chart subtitles and company drill-down trigger.
- src/pages/StudentsPage.jsx
  - Add filter sync and intervention actions.
- src/pages/ReportsPage.jsx
  - Add report templates and AI preset flow.
- src/components/AiReportModal.jsx
  - Add template preset selector and saved provider settings.

## 7) Synopsis Ready Stack Entry
Use this in synopsis:
- Frontend: React, Vite, Tailwind CSS, Recharts, Zustand
- Data Processing: PapaParse, Google Sheet fetch parser, Excel parser (XLSX)
- AI Layer (optional): Gemini / OpenRouter / OpenAI with local fallback
- Backend readiness: Node.js, Express.js
- Architecture type: Offline-first frontend analytics pipeline with optional cloud AI integration

## 8) Immediate Next Sprint (Recommended)
1. Add Excel support in migration flow.
2. Add global filter synchronization across pages.
3. Add company drill-down panel in dashboard.
4. Add report template presets in AI report studio.
5. Update README with architecture and data flow image.
