# Placify AI Minor Project PPT Content And Full Project Plan

Use this file as the master content source for the minor project presentation.
The provided PPT format requires 20 to 25 slides. This plan uses 25 slides including title and thank-you slide.

Project title:
Placify AI: Placement Data Engineering And Intelligence Platform

One-line explanation:
Placify AI converts Excel, CSV, and Google Sheets placement data into cleaned datasets, live dashboards, eligibility insights, explainable placement prediction, and exportable reports for college TPOs.

Viva explanation in 20 seconds:
Placify AI is a TPO-first placement intelligence platform. It imports student placement data from Excel, CSV, or public Google Sheets, automatically maps inconsistent columns, cleans records, generates dashboards, detects at-risk students, predicts placement probability using explainable scoring with CatBoost-ready ML support, and exports reports for placement decision-making.

---

## Slide 1: Title Slide

Title:
Placify AI

Subtitle:
Placement Data Engineering And Intelligence Platform

Presented By:
[Your Name]
[Roll Number]

Academic Year:
2025-2026

Guide:
Dr./Mr./Ms. [Guide Name]
Assistant Professor

Department:
Department of Computer Science and Engineering

Suggested visual:
Clean product screenshot or dashboard mockup.

Speaker note:
Good morning respected faculty members. Today I am presenting Placify AI, a placement data engineering and intelligence platform built to help Training and Placement Officers manage placement data and generate useful insights.

---

## Slide 2: Contents

1. Introduction and Problem Statement
2. Literature Review and System Design
3. Methodology
4. Tools and Technology Used
5. Roles and Responsibilities
6. Implementation
7. Results
8. Conclusion and Future Scope
9. References

Speaker note:
The presentation will cover the problem, proposed solution, architecture, implementation modules, results, and future scope.

---

## Slide 3: Introduction

Title:
Placify AI: A Smarter Way To Understand Placement Data

Content:
- College placement cells handle large volumes of student, academic, resume, and company-drive data.
- Most of this data is maintained manually in Excel sheets or Google Sheets.
- Important insights such as eligibility, branch performance, placement risk, and resume readiness are difficult to identify quickly.
- Placify AI acts as an intelligent data pipeline that imports raw placement data and converts it into dashboards, predictions, and reports.

Key message:
The project focuses on practical placement analytics, not a generic college ERP.

Speaker note:
The main idea is to reduce manual Excel-based work for TPOs and make placement data easier to analyze.

---

## Slide 4: Background And Motivation

Title:
Why This Problem Matters

Content:
- TPOs often receive student data from different departments in inconsistent formats.
- Column names may differ across sheets, such as dept, stream, branch, SGPA, CGPA, selected, placed, or hired.
- Eligibility checking for companies is time-consuming when done manually.
- Students who need support may be identified late.
- Management reports require repeated manual formatting.

Motivation:
To build a demo-friendly but realistic platform that turns messy placement data into useful operational intelligence.

Speaker note:
This project was motivated by a real workflow problem: placement data exists, but extracting meaningful insight from it is slow and error-prone.

---

## Slide 5: Problem Statement

Title:
Core Problem Being Addressed

Problem statement:
Training and Placement Officers manage student placement data using scattered Excel files, CSV files, and Google Sheets. Due to inconsistent column names, duplicate entries, missing data, and manual analysis, it becomes difficult to quickly identify eligible students, at-risk students, placement trends, resume readiness, and company-wise insights.

Project objective:
To develop a web-based platform that imports placement datasets, automatically maps and cleans data, generates dashboards, predicts placement risk, and produces reports for better placement decision-making.

Speaker note:
The problem is not only storage. The real problem is converting raw placement data into decisions.

---

## Slide 6: Existing System And Limitations

Title:
Limitations Of Manual Placement Management

Content:
- Manual Excel filtering for eligibility.
- Repeated formatting for reports.
- Difficult branch-wise comparison.
- No instant risk detection.
- No automatic column mapping.
- Limited visibility into resume readiness.
- Delayed identification of students needing help.
- Data duplication and inconsistent naming.

Existing system result:
Slow analysis, higher manual effort, and reduced decision clarity.

Speaker note:
Traditional systems are either too basic or too broad. Placify focuses specifically on placement data engineering and analytics.

---

## Slide 7: Proposed System

Title:
Proposed Solution: Data Engineering First

Content:
Placify AI provides a TPO-first workflow:

1. Upload Excel or CSV, or paste a public Google Sheets link.
2. Automatically parse rows.
3. Detect and map columns intelligently.
4. Clean duplicates and validate records.
5. Generate dashboards instantly.
6. Detect at-risk students.
7. Predict placement probability.
8. Export reports.

Main USP:
Paste Google Sheet or upload Excel -> smart mapping -> dashboard -> prediction -> report.

Speaker note:
The project is designed around one strong flow rather than many disconnected features.

---

## Slide 8: Literature Review / Related Work

Title:
Related Work And Technology Basis

Content:
- Spreadsheet-based placement management is widely used but requires manual filtering and reporting.
- Business intelligence tools such as Power BI and Tableau provide dashboards but require setup and are not placement-specific.
- Applicant Tracking Systems manage resumes and candidates but are usually designed for companies, not colleges.
- Machine learning models such as decision trees, random forests, and CatBoost are suitable for tabular prediction problems.
- Rule-based systems are useful for explainable eligibility checking.

Conclusion:
Placify combines spreadsheet ingestion, placement-specific analytics, and explainable prediction in one focused academic project.

Speaker note:
The system uses practical rule-based intelligence and ML-ready architecture instead of pretending that everything is black-box AI.

---

## Slide 9: System Design Overview

Title:
High-Level System Architecture

Content:
System layers:
- Frontend: React + Vite user interface.
- State layer: Zustand and localStorage demo mode.
- Backend: Node.js and Express APIs.
- Data processing: PapaParse, SheetJS, smart column mapping.
- Intelligence layer: eligibility, risk, insights, prediction scoring.
- Optional ML layer: FastAPI with CatBoost-ready prediction endpoint.
- Export layer: reports and dashboard summaries.

Block diagram to draw:

User/TPO
-> Frontend Dashboard
-> Import Engine
-> Smart Mapping And Validation
-> Cleaned Dataset
-> Analytics Engine
-> Prediction Engine
-> Reports

Speaker note:
The architecture separates the UI, backend APIs, data processing logic, and prediction logic so the project remains maintainable.

---

## Slide 10: Data Flow Diagram

Title:
Data Flow Of Placify AI

Content:
1. TPO uploads file or enters Google Sheets URL.
2. System extracts data rows.
3. Smart mapper identifies columns.
4. Normalizer converts different field names into one student schema.
5. Duplicate detector removes repeated records.
6. Analytics engine calculates dashboard metrics.
7. Prediction engine calculates probability and risk.
8. Reports module exports summaries.

DFD content:
- External entity: TPO/Admin
- Process 1: Import Data
- Process 2: Clean And Normalize Data
- Process 3: Generate Analytics
- Process 4: Predict Risk
- Data store: Local demo storage
- Output: Dashboard and Reports

Speaker note:
The DFD shows that the main value of the system is not just data entry, but the full processing pipeline.

---

## Slide 11: UML / Use Case Design

Title:
Major Use Cases

Actors:
- TPO/Admin
- Student

TPO/Admin use cases:
- Login
- Import Excel/CSV
- Import Google Sheet
- View dashboard
- Manage students
- Manage drives
- View prediction
- Export report

Student use cases:
- Login
- View dashboard
- View opportunities
- Check readiness
- Attend mock interview
- Update profile

Speaker note:
The TPO side is the primary product flow, while the student side is kept lean and supportive.

---

## Slide 12: Entity Design / Data Model

Title:
Core Data Model

Main entities:

Student:
- id
- name
- email
- enrollment
- branch
- cgpa
- attendance
- activeBacklogs
- resumeUploaded
- atsScore
- aptitudeScore
- communicationScore
- skills
- projects
- internships
- placementStatus

Drive:
- id
- company
- role
- packageLpa
- minCgpa
- minAttendance
- maxBacklogs
- eligibleBranches
- requiredSkills
- preferredSkills
- deadline
- status

Application:
- id
- studentId
- driveId
- status
- matchScore
- appliedAt

Speaker note:
The data model is simple enough for a minor project but complete enough to support analytics and prediction.

---

## Slide 13: Methodology

Title:
Development Methodology

Approach:
- Modular full-stack development.
- TPO-first product boundary.
- Data pipeline as the main demo flow.
- Explainable rules before complex ML.
- Optional CatBoost ML layer for tabular prediction.
- LocalStorage demo mode for easy setup.
- Backend APIs for ingestion, intelligence, match prediction, interview, and reports.

Development steps:
1. Audit existing codebase.
2. Remove broken feature modules.
3. Rebuild navigation and routing.
4. Improve data import engine.
5. Build dashboard analytics.
6. Add prediction API.
7. Polish UI and test flows.

Speaker note:
The methodology prioritizes working features and explainability over unnecessary complexity.

---

## Slide 14: Smart Column Mapping Algorithm

Title:
Smart Column Mapping

Problem:
Different files may use different names for the same field.

Examples:
- dept, stream, department -> branch
- sgpa, gpa, score, aggregate -> cgpa
- current_back, backs, kt -> activeBacklogs
- attd, attendance_percent, attendence -> attendance
- placed, selected, offer, hired -> placementStatus

Algorithm:
1. Convert column names to lowercase.
2. Remove spaces, underscores, and special characters.
3. Match using known keyword aliases.
4. Assign canonical field name.
5. Mark unknown fields as unmapped.
6. Calculate schema confidence.

Output:
Clean student records that dashboards can use consistently.

Speaker note:
This is one of the strongest data-engineering parts of the project because it handles messy real-world files.

---

## Slide 15: Eligibility And Analytics Engine

Title:
Placement Intelligence Logic

Eligibility factors:
- CGPA cutoff
- Attendance cutoff
- Active backlogs
- Branch eligibility
- Resume availability

Analytics generated:
- Total students
- Eligible students
- Placed students
- Placement percentage
- Branch readiness
- Backlog impact
- Attendance risk
- Resume availability
- Students at risk

Dashboard outputs:
- Placement funnel
- Branch-wise charts
- Risk distribution
- Recent imports
- Operational insights

Speaker note:
The system turns imported rows into useful TPO decisions immediately.

---

## Slide 16: Prediction Engine

Title:
Explainable Placement Prediction

Prediction goal:
Estimate how likely a student is to be shortlisted or placed for a company role.

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

Output:
- Placement probability
- Shortlist probability
- Risk category
- Positive factors
- Negative factors
- Recommended actions
- Model used

Model strategy:
- Primary model: CatBoost-ready tabular ML layer.
- Runtime fallback: deterministic weighted scoring.

Speaker note:
CatBoost is suitable because placement prediction is a tabular data problem. The fallback keeps the project reliable during demonstrations.

---

## Slide 17: Why CatBoost

Title:
CatBoost For Tabular Placement Data

Content:
- CatBoost is a gradient boosting model originally developed by Yandex.
- It works well on structured/tabular datasets.
- It can handle categorical-like features such as branch or status.
- It is suitable for small-to-medium academic datasets.
- It is more explainable than deep learning for this use case.

In Placify:
- FastAPI ML endpoint is CatBoost-ready.
- If model artifacts are present, ML prediction can be used.
- If not, explainable rule-based fallback is used.

Speaker note:
The project does not depend blindly on ML. It uses ML where practical and rules where transparency is required.

---

## Slide 18: Tools And Technology Used

Title:
Technology Stack

Frontend:
- React
- Vite
- TailwindCSS
- Framer Motion
- Recharts
- Zustand
- Lucide React

Backend:
- Node.js
- Express.js
- REST APIs

Data processing:
- PapaParse for CSV
- SheetJS for Excel/XLSX
- Google Sheets CSV export endpoint

AI/ML:
- FastAPI
- CatBoost-ready prediction API
- Deterministic fallback scoring
- Gemini optional support for mock interview

Storage:
- localStorage demo mode
- Optional database integration possible later

Hardware:
- Standard laptop or desktop system

Speaker note:
The stack is modern but still easy to run in VS Code, which is important for project evaluation.

---

## Slide 19: Roles And Responsibilities

Title:
Team Roles And Responsibilities

If working solo:
- Requirement analysis
- UI/UX design
- Frontend development
- Backend API development
- Data ingestion logic
- Prediction engine design
- Testing and documentation
- PPT and demo preparation

If working in group, use this format:

Member 1:
- Frontend UI and dashboard development
- Routing and navigation
- Responsive design

Member 2:
- Backend APIs
- Ingestion and Google Sheets import
- Reports export

Member 3:
- Prediction engine
- Resume/readiness logic
- Testing and documentation

Member 4:
- Sample data preparation
- Presentation, screenshots, and QA

Speaker note:
Customize this slide based on actual team members before final submission.

---

## Slide 20: Implementation Module 1 - Import Data

Title:
Data Import Module

Features implemented:
- CSV upload using PapaParse.
- Excel/XLSX upload using SheetJS.
- Public Google Sheets link ingestion.
- Preview before import.
- Field normalization.
- Duplicate detection.
- Validation summary.
- Commit to dashboard.

Important API:
- Backend Google Sheets endpoint converts public sheet URL into CSV export URL.
- Frontend parses and previews rows before saving.

Speaker note:
This is the star MVP flow of the project. It shows the system working on real tabular data.

---

## Slide 21: Implementation Module 2 - TPO Dashboard

Title:
TPO Placement Overview

Dashboard widgets:
- Total students
- Eligible students
- Placed students
- Average package
- No resume count
- At-risk students
- Placement market
- Hiring velocity
- Placement funnel
- Branch-wise overview
- Operational insights
- Backlog impact
- Attendance risk

Design:
- Modern dashboard layout.
- Light and dark mode support.
- Data-driven charts.
- Clean TPO navigation.

Speaker note:
The dashboard is designed as a placement command center, not just a basic admin table.

---

## Slide 22: Implementation Module 3 - Prediction And Student View

Title:
Prediction And Lean Student Workspace

TPO Prediction page:
- Shows students scored.
- Average placement probability.
- High chance students.
- At-risk students.
- Model feature weights.
- Risk distribution.
- Prediction queue.

Student side:
- Dashboard
- Opportunities
- Mock Interview
- Profile

Removed broken modules:
- Resume Studio
- My Predictor
- Insights Lab
- Campus Predictor

Reason:
To keep the product focused, explainable, and demo-ready.

Speaker note:
Prediction is now part of the main dashboard and opportunity flow instead of being a confusing separate module.

---

## Slide 23: Results And Observations

Title:
Results

Functional results:
- TPO dashboard opens properly.
- Navigation is simplified and stable.
- CSV and Excel import supported.
- Google Sheets ingestion supported for public sheets.
- Smart mapping handles inconsistent college column names.
- Dashboard updates after import.
- Prediction page shows explainable probability and risk.
- Reports remain available for export.
- Student opportunities sync with TPO-created drives.

Testing performed:
- Frontend lint passed.
- Frontend production build passed.
- Backend health endpoint passed.
- Prediction API smoke test passed.
- Browser route check passed for dashboard and prediction page.

Observation:
The final system is strongest as a data engineering and analytics demo for placement operations.

Speaker note:
The project now has a clear main story and avoids broken feature clutter.

---

## Slide 24: Conclusion And Future Scope

Title:
Conclusion And Future Enhancements

Conclusion:
Placify AI successfully demonstrates how raw placement data can be transformed into meaningful dashboards, eligibility intelligence, risk detection, prediction outputs, and reports. The system reduces manual spreadsheet effort and gives TPOs a faster way to understand placement readiness.

Achievements:
- Smart import pipeline.
- Column auto-mapping.
- Live analytics dashboard.
- Explainable prediction engine.
- Lean student workspace.
- Report-ready structure.

Limitations:
- Current storage is local demo mode.
- CatBoost model requires trained artifacts for full ML mode.
- Google Sheets import supports public sheets only.
- Prediction accuracy depends on data quality.

Future scope:
- Supabase/PostgreSQL database.
- Real trained CatBoost model using historical college data.
- Authentication with role-based permissions.
- More advanced resume parsing.
- Email and WhatsApp reminders.
- Long-term placement trend forecasting.

Speaker note:
The project is practical now and can be extended into a larger production system later.

---

## Slide 25: References / Thank You

Title:
References

References:
1. React Documentation. https://react.dev/
2. Vite Documentation. https://vite.dev/
3. Tailwind CSS Documentation. https://tailwindcss.com/
4. Recharts Documentation. https://recharts.org/
5. PapaParse Documentation. https://www.papaparse.com/
6. SheetJS Documentation. https://docs.sheetjs.com/
7. Express.js Documentation. https://expressjs.com/
8. FastAPI Documentation. https://fastapi.tiangolo.com/
9. CatBoost Documentation. https://catboost.ai/
10. Google Sheets CSV Export Format. Google Workspace documentation.

Thank You

Questions?

Speaker note:
Thank you. I am ready for questions.

---

# Full Project Plan

## 1. Final Product Boundary

Final positioning:
Placify AI is a TPO-first placement data engineering and analytics platform with a lean student view.

Main demo story:
Upload Excel/CSV or paste Google Sheet -> smart column mapping -> cleaned placement dataset -> live dashboard -> explainable prediction -> export report.

Kept features:
- TPO dashboard
- Import data
- Students
- Drives
- Prediction
- Reports
- Student dashboard
- Opportunities
- Mock interview
- Profile

Removed from primary flow:
- Resume Studio
- My Predictor
- Insights Lab
- Campus Predictor

Reason:
These modules made the project feel confusing and difficult to explain for a minor project viva.

## 2. Final Navigation

TPO navigation:
1. Dashboard
2. Import Data
3. Students
4. Drives
5. Prediction
6. Reports

Student navigation:
1. Dashboard
2. Opportunities
3. Mock Interview
4. Profile

## 3. Core Modules

### Module A: Authentication And Role Routing

Purpose:
Separate TPO and Student experiences.

Features:
- Demo login.
- Role-based route protection.
- Admin-only and student-only pages.
- Redirect old routes safely.

### Module B: Data Import Engine

Purpose:
Convert raw tabular placement data into clean records.

Inputs:
- CSV
- XLS
- XLSX
- Public Google Sheets URL

Processing:
- Parse rows.
- Detect columns.
- Normalize fields.
- Remove duplicates.
- Validate missing values.
- Preview before import.
- Commit data to dashboard.

### Module C: Smart Column Mapping

Canonical fields:
- name
- email
- enrollment
- branch
- cgpa
- attendance
- activeBacklogs
- resumeUploaded
- atsScore
- aptitudeScore
- communicationScore
- skills
- projects
- internships
- placementStatus

Mapping strategy:
- Normalize header names.
- Match using aliases.
- Assign canonical fields.
- Flag unmapped columns.
- Calculate mapping confidence.

### Module D: TPO Dashboard

Purpose:
Give TPOs an instant placement overview.

Widgets:
- Total students
- Eligible students
- Placed students
- Average package
- No resume count
- At-risk students
- Placement market
- Hiring velocity
- Placement funnel
- Branch readiness
- Eligibility breakdown
- Backlog impact
- Attendance risk
- Recent imports
- Operational insights

### Module E: Drives

Purpose:
Manage company opportunities.

Drive fields:
- Company name
- Role
- Package
- Location
- Work type
- Required skills
- Preferred skills
- Eligible branches
- CGPA cutoff
- Attendance cutoff
- Backlog rules
- Deadline
- Status

### Module F: Prediction Engine

Purpose:
Estimate placement probability and risk.

Features:
- Placement probability
- Shortlist probability
- Risk category
- Score breakdown
- Positive and negative factors
- Suggestions
- Model used

ML strategy:
- CatBoost-ready FastAPI endpoint.
- Deterministic fallback scoring for demo reliability.

### Module G: Student Workspace

Purpose:
Give students a simple readiness view.

Student pages:
- Dashboard
- Opportunities
- Mock Interview
- Profile

Student outputs:
- Readiness score
- Eligible opportunities
- Placement radar
- Career momentum
- Missing skills
- Recommendations

### Module H: Reports

Purpose:
Support management-ready summaries.

Report content:
- Placement summary
- Branch-wise statistics
- Company-wise statistics
- Students at risk
- Resume readiness
- Prediction summary

## 4. Algorithm Plan

### Eligibility Algorithm

Input:
Student record and drive criteria.

Checks:
- Student CGPA >= drive minimum CGPA
- Student attendance >= drive minimum attendance
- Student active backlogs <= drive maximum backlogs
- Student branch is in eligible branches

Output:
- Eligible or ineligible
- Blocker reasons

### Risk Scoring Algorithm

Risk factors:
- Low CGPA
- Low attendance
- Active backlogs
- Weak ATS score
- Low aptitude score
- Low communication score
- No resume
- Few projects
- No internships

Output:
- Low Risk
- Medium
- At Risk

### Prediction Algorithm

Feature groups:
- Academics
- Attendance
- Resume
- Performance
- Project proof
- Experience
- Activity

Fallback weighted formula:
placementProbability =
academics * 0.22 +
attendance * 0.10 +
resume * 0.18 +
performance * 0.20 +
proof * 0.22 +
activity * 0.08

Risk category:
- 72% and above: High Chance
- 46% to 71%: Medium
- Below 46%: At Risk

## 5. API Plan

Backend APIs:

GET /api/health
- Checks backend status.

POST /api/ingest/google-sheet
- Accepts public Google Sheets URL.
- Returns parsed rows and preview metadata.

POST /api/intelligence/ops
- Accepts rows.
- Returns dashboard intelligence.

GET /api/intelligence/prediction-summary
- Returns model explanation and feature list.

POST /api/match/predict
- Accepts student, drive, and dataset context.
- Returns probability, risk category, explanations, and suggestions.

POST /api/match/readiness
- Returns student readiness and role match.

POST /api/reports
- Generates placement report data.

## 6. Testing Plan

Frontend tests:
- Run npm run lint.
- Run npm run build.
- Verify TPO nav has 6 items.
- Verify Student nav has 4 items.
- Verify removed routes redirect.

Backend tests:
- Start backend.
- Test /api/health.
- Test /api/intelligence/prediction-summary.
- Test /api/match/predict.
- Test Google Sheets import with public sheet.

Manual demo tests:
- Login as TPO.
- Import sample CSV.
- Import sample XLSX.
- Import public Google Sheet.
- Commit data.
- Dashboard updates.
- Prediction page shows output.
- Reports page opens.
- Login as student.
- Opportunities show TPO-created drives.

## 7. Presentation Demo Script

Demo order:
1. Open login page.
2. Login as TPO/Admin.
3. Show clean TPO navigation.
4. Open Import Data.
5. Upload sample CSV or XLSX.
6. Show preview and mapping.
7. Commit data.
8. Open Dashboard.
9. Explain KPIs, charts, and operational insights.
10. Open Prediction.
11. Explain CatBoost-ready model and fallback scoring.
12. Open Reports.
13. Login as Student.
14. Show opportunities and readiness.

Best viva angle:
This project is strong because it solves a real TPO workflow: messy spreadsheet data becomes placement intelligence.

