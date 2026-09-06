# Placify AI Architecture

Placify AI is currently implemented as a demo-safe React/Vite frontend with an Express backend. The code is structured so the college demo runs without paid services, while still leaving clear seams for Supabase/PostgreSQL, Prisma, and real auth later.

## Frontend

```text
frontend/src/
  App.jsx                         Route map and role guards
  layout/AppShell.jsx             Authenticated shell with floating top navigation
  components/                     Reusable UI primitives and dashboard widgets
  pages/
    LandingPage.jsx               Public product page
    Login.jsx                     Demo-ready login
    AdminDashboard.jsx            TPO analytics overview
    MigrationPage.jsx             Excel/CSV/Google Sheets import
    AddCompanyPage.jsx            Drive creation and management workspace
    StudentsPage.jsx              Student readiness table
    ReportsPage.jsx               Report exports
    StudentDashboard.jsx          Student readiness and opportunity feed
    ResumeStudioPage.jsx          Resume parsing and ATS analysis
    MockInterviewPage.jsx         AI/fallback interview flow
  services/
    companyService.js             Drive CRUD and normalization
    migrationService.js           CSV/XLSX/Google Sheets parsing
    placementIntelligenceService.js
    jobMatchService.js            Explainable weighted prediction engine
    readinessIntelligenceService.js
    mockInterviewService.js
  store/usePlacementStore.js      Zustand app state
```

## Backend

```text
backend/
  app.js
  server.js
  routes/
    ingestRoutes.js               Smart import preview and Google Sheets ingestion
    intelligenceRoutes.js         Eligibility, risk, insights
    resumeRoutes.js               Resume parsing endpoints
    matchRoutes.js                Role match endpoints
    interviewRoutes.js            Mock interview endpoints
    reportRoutes.js               Report generation endpoints
    mlRoutes.js                   Legacy ML-compatible routes
  services/
    institutionalIntelligenceEngine.js
    placementPredictionEngine.js
    resumeTextExtractor.js
    resumeSignalExtractor.js
    mockInterviewEngine.js
    paddleOcrBridge.js
```

## Data Model

Local demo storage uses `localStorage` on the frontend. These are the canonical shapes.

### Student

```js
{
  id,
  name,
  email,
  enrollment,
  branch,
  cgpa,
  attendance,
  activeBacklogs,
  resumeUploaded,
  resumeScore,
  atsScore,
  aptitudeScore,
  communicationScore,
  skills,
  projects,
  internships,
  status
}
```

### Drive / Opening

```js
{
  id,
  driveType,
  name,
  logoUrl,
  role,
  packageLpa,
  stipend,
  location,
  workType,
  description,
  minCgpa,
  minAttendance,
  maxBacklogs,
  batchYear,
  eligibleBranches,
  genderPreference,
  degreeType,
  internshipDuration,
  bondInfo,
  requiredSkills,
  preferredSkills,
  preferredCertifications,
  preferredTechnologies,
  hiringRounds,
  deadline,
  scheduledAt,
  openings,
  allowedResumeFormats,
  status
}
```

### Application

```js
{
  id,
  studentId,
  companyId,
  status,
  appliedAt,
  updatedAt
}
```

## Prediction Engine

The prediction layer is intentionally explainable. It combines rule-based eligibility with weighted scoring:

- Skills
- Academics
- Resume quality
- Experience
- Project relevance
- Selection performance
- Engagement

Output includes:

- Match percentage
- Hiring probability
- Shortlist probability
- Readiness score
- Missing skills
- Weak areas
- Strengths
- Suggested improvements

`readinessIntelligenceService.js` is the student-facing product layer on top of the prediction engine. It combines role match, resume scores, GitHub/LinkedIn/coding profile proof, skill heatmaps, batch rank, smart insights, and next actions into one compact readiness dashboard.

## API Summary

Base URL:

```text
http://localhost:5000
```

Useful endpoints:

```text
GET  /api/health
GET  /api/drives
POST /api/drives
PUT  /api/drives/:id
POST /api/drives/:id/duplicate
DELETE /api/drives/:id
POST /api/ingest/preview
POST /api/ingest/normalize
POST /api/ingest/google-sheet
POST /api/intelligence/summary
POST /api/resume/parse
POST /api/match/evaluate
POST /api/match/readiness
POST /api/interview/questions
POST /api/interview/evaluate
POST /api/reports/summary
```

## Environment Variables

Optional:

```text
GEMINI_API_KEY=your_key_here
MONGO_URI=optional_legacy_mongo_uri
```

No environment variable is required for the main local demo.

## Future Production Path

Recommended next migration:

1. Move app to Next.js App Router with TypeScript.
2. Add Prisma schema for Students, Drives, Applications, Resumes, Interviews, AuditLogs.
3. Use Supabase Postgres for persistence.
4. Add JWT or Supabase Auth with role claims.
5. Move file uploads to Supabase Storage.
6. Add TanStack Query for API caching and optimistic updates.
