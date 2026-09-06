# Placify AI Historical Data Collection and Model Plan

## Goal

Build a resume-worthy placement intelligence dataset and model pipeline for Placify AI.

The final story should be:

> Placify AI ingests historical placement data from public reports, CSV/XLSX files, and Google Sheets, cleans and maps inconsistent columns, builds placement analytics, and predicts student placement risk using explainable rules with a CatBoost-ready ML layer.

This keeps the project useful for a minor project demo and strong enough to discuss in internship interviews.

## What Data We Need

### 1. Student-Level Training Data

Purpose: train or evaluate placement prediction models.

Required columns:

- `cgpa`
- `attendance`
- `active_backlogs`
- `branch`
- `ats_score`
- `aptitude_score`
- `communication_score`
- `projects`
- `internships`
- `skills_count`
- `applications_count`
- `placed`

Target:

- `placed = 1` for placed/selected/shortlisted
- `placed = 0` for unplaced/rejected/at-risk

Recommended public sources:

- Kaggle placement prediction datasets with CGPA, internships, projects, aptitude, soft skills, and placement status.
- Kaggle college student placement datasets with academic and skill-based indicators.

Important: use only anonymized public datasets. Do not collect real student names, emails, phone numbers, resumes, or enrollment numbers from the internet.

## 2. Historical College-Level Placement Data

Purpose: build realistic trends, dashboards, placement-rate comparisons, median package trends, and viva-friendly analytics.

Useful fields:

- institute name
- year
- program type
- graduating students
- placed students
- students selected for higher studies
- median salary
- placement percentage

Recommended public sources:

- NIRF Engineering ranking pages and submitted institute PDFs.
- Official college placement PDFs and annual reports.
- Public branch-wise placement PDFs where available.

These sources usually provide aggregate historical data, not student-level records.

## 3. Branch/Company-Level Placement Data

Purpose: make dashboards feel operational.

Useful fields:

- branch
- company
- role
- students eligible
- students shortlisted
- students selected
- package
- year

Recommended public sources:

- Official placement PDFs from college websites.
- Branch-wise placement reports.
- Company-wise placement reports.

## Data Source Strategy

### Tier 1: Official Sources

Use these for historical placement trends:

- NIRF Engineering rankings and institute submitted data PDFs.
- College official placement reports.
- College annual reports.

Strength:

- credible
- historical
- useful for dashboards

Limitation:

- usually aggregate-level, not student-level

### Tier 2: Public Anonymized Datasets

Use these for model training:

- Kaggle placement prediction dataset
- Kaggle college student placement dataset

Strength:

- student-level rows
- has target labels
- useful for ML experiments

Limitation:

- may not represent one exact college
- may need cleaning and feature normalization

### Tier 3: Synthetic Demo Data

Use this for the live demo:

- JECRC-style synthetic CSV/XLSX files
- generated with realistic distributions from public aggregate data

Strength:

- safe
- no privacy risk
- works perfectly with the import wizard

Limitation:

- should be clearly described as synthetic demo data

## Collection Plan

### Phase 1: Source Discovery

Collect links for:

- 8 to 12 NIRF institute PDFs from engineering colleges
- 3 to 5 public branch-wise placement PDFs
- 2 Kaggle student-level placement datasets
- 1 to 2 public company-wise placement reports

Output:

- `data_sources.csv`
- columns: `source_name`, `source_type`, `url`, `year`, `data_level`, `license_notes`, `status`

### Phase 2: Raw Data Storage

Create:

- `data/raw/nirf/`
- `data/raw/college_reports/`
- `data/raw/kaggle/`
- `data/raw/manual_exports/`

Keep original files unchanged.

### Phase 3: Extraction

Extract:

- PDF tables from NIRF/college reports
- CSV/XLSX rows from Kaggle/manual data
- Google Sheets CSV exports when public links are provided

Possible tools:

- Python `pandas`
- Python `tabula` or `camelot` for PDFs if installed
- JavaScript `xlsx`
- PapaParse

### Phase 4: Normalization

Convert messy columns into canonical Placify fields.

Examples:

- `dept`, `stream`, `department` -> `branch`
- `sgpa`, `gpa`, `aggregate` -> `cgpa`
- `current_back`, `backs`, `kt` -> `active_backlogs`
- `attd`, `attendance_percent`, `attendence` -> `attendance`
- `placed`, `selected`, `hired`, `offer` -> `placement_status`

Output:

- `data/processed/student_training_data.csv`
- `data/processed/institution_historical_summary.csv`
- `data/processed/branch_company_summary.csv`

### Phase 5: Model Training

Train:

- baseline logistic regression
- random forest
- CatBoost classifier

Primary model:

- CatBoost because it handles tabular data well and supports categorical features like branch.

Save:

- `ml/artifacts/catboost_placement_model.cbm`
- `ml/artifacts/model_metadata.json`
- `ml/artifacts/training_report.json`

### Phase 6: Integration

Connect model to:

- `ml/api/app.py`
- backend `/api/match/predict`
- TPO Prediction page
- Student opportunity match cards

Fallback:

- if CatBoost file is missing, use `rules-fallback-v1`
- this keeps the demo reliable

## Resume Project Positioning

Use this title on resume:

**Placify AI - Historical Placement Data Engineering and Prediction Platform**

Strong resume bullets:

- Built a placement data engineering pipeline to ingest CSV, XLSX, and public Google Sheets data with smart column mapping and validation.
- Designed an explainable placement prediction engine using weighted scoring and CatBoost-ready tabular ML architecture.
- Created historical placement analytics from public NIRF and college placement reports to visualize placement trends, branch readiness, risk, and eligibility.
- Implemented a demo-safe fallback model to keep predictions reliable when ML artifacts or external services are unavailable.
- Developed dashboards for TPOs and students with role-based workflows, application tracking, match scoring, and report generation.

## Interview Explanation

Short version:

> Placify AI converts messy placement Excel/Google Sheets data into analytics and placement predictions. I built the ingestion pipeline, smart column mapping, dashboard analytics, and an explainable prediction layer. The system uses deterministic weighted scoring by default and is designed to plug in a CatBoost model trained on anonymized historical placement data.

## Ethical Boundary

Do not scrape:

- student names
- emails
- phone numbers
- resumes
- enrollment numbers
- private placement spreadsheets

Use:

- official aggregate reports
- anonymized public datasets
- synthetic demo data

This makes the project safe, professional, and defendable in viva/interviews.

