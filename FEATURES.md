# Placify AI - Complete Feature Guide

## 🎯 Overview
Placify AI is a comprehensive placement management system with AI-powered insights, predictions, and automation for both TPO (Training & Placement Officers) and students.

---

## 🔐 Getting Started

### Login Credentials
**TPO/Admin Demo:**
- Email: `admin@placify.edu`
- Password: `admin123`

**Student Demo:**
- Email: `student@placify.edu`
- Password: `student123`

You can also create a new student account from the login page.

---

## 👨‍💼 TPO/Admin Features

### 1. **Dashboard** (`/tpo/dashboard`)
**Main placement overview with real-time analytics**

**Key Metrics:**
- Total Students, Eligible Students, Placed Students
- Average Package, Students without Resume, At-Risk Students

**Visualizations:**
- Placement Funnel (6-stage conversion tracking)
- Branch-wise Overview (eligibility % vs placed %)
- Operational Insights (rule-based summaries)
- Eligibility Breakdown (pie chart showing blockers)
- Risk Prediction (High Chance / Medium / At Risk)
- Backlog Impact Analysis by branch
- Attendance Risk Analysis
- Placement Trend (cumulative movement)
- Resume Intelligence Overview (ATS scores, missing sections)

**Intervention Queue:**
- Filterable risk student table
- Click branch charts to filter the queue
- Shows CGPA, attendance, risk level, main blocker

---

### 2. **Students** (`/tpo/students`)
**View and manage all student records**

Features:
- Complete student list with placement status
- Filter by branch, CGPA, placement status
- Export student data
- View individual student profiles
- Track application history

---

### 3. **Companies** (`/tpo/drives`)
**Manage recruitment drives and company information**

Features:
- Add new companies and drives
- Set eligibility criteria (CGPA, branch, backlogs)
- Track drive status (Open, Ongoing, Closed)
- Duplicate drives for similar companies
- View company-wise application stats

---

### 4. **Import Data** (`/tpo/ingest`)
**Bulk import student, company, and application data**

Supported Formats:
- Excel (.xlsx)
- CSV (.csv)
- Public Google Sheets (via URL)

Features:
- Auto-detect column mappings
- Preview before import
- Duplicate detection
- Data validation and normalization
- Import history tracking

---

### 5. **Reports** (`/tpo/reports`)
**Generate and download placement reports**

Report Types:
- Placement Summary Report
- Branch-wise Analysis
- Company-wise Statistics
- Student Performance Report
- Risk Analysis Report

Export Formats:
- PDF
- Excel
- PowerPoint (PPT)
- CSV

---

### 6. **Insights Lab** (`/tpo/insights`) ⭐ NEW
**ML-powered placement intelligence from trained models**

Features:
- Baseline Placement Probability
- Model Accuracy Metrics
- Feature Importance Analysis (top predictive factors)
- Branch Performance Charts
- CGPA Thresholds (placed vs not placed)
- Salary Trends
- Key Insights Dashboard

**Data Source:** Connects to ML API (`ml/api/app.py`) for real-time predictions

---

### 7. **Campus Predictor** (`/tpo/campus-predictor`) ⭐ NEW
**Campus-level analytics and prediction engine**

Features:
- Upload campus data CSV (or use workflow data)
- Download sample template
- Predict campus-wide placement outcomes
- Branch-level placement rates
- Top companies by conversion rate
- Highest/Average/Least salary analysis
- Important technical skills identification
- Top factors affecting placements

**Use Case:** Planning offers, branch-wise targets, and placement actions

---

## 👨‍🎓 Student Features

### 1. **Dashboard** (`/student/dashboard`)
**Personalized placement readiness workspace**

**Hero Section:**
- AI Placement Coach greeting
- Placement Readiness Score (0-100%)
- Quick actions: Improve Resume, Practice Interview, Run Predictor

**Key Metrics:**
- Applications submitted
- Active roles available
- Best match percentage
- Risk level

**Readiness Intelligence:**
- Eligibility %, Selection %, Resume %, Batch Rank
- Profile Signals: GitHub, LinkedIn, Coding Profiles (with scores)

**Smart Insights:**
- AI-generated recommendations
- Skill Heatmap (strongest/weakest areas)
- Action Feed (prioritized improvement actions)

**Best Match Breakdown:**
- Detailed score breakdown for top role
- Strengths and weak areas
- Transparent prediction factors

**Role Match Cards:**
- Searchable/filterable company cards
- Match score, hiring probability, missing skills
- Quick apply button
- Save openings for later

**Additional Sections:**
- Upcoming Deadlines
- Activity Timeline
- Active Opportunities (eligible companies)
- My Applications (live statuses)
- Status Tracker (Applied → Interview → HR → Selected)
- Interview Preparation link

---

### 2. **Resume Studio** (`/student/resume`)
**AI-powered resume builder and optimizer**

Features:
- Resume upload and parsing
- ATS scoring and optimization
- Section-wise improvement suggestions
- Keyword matching
- Template library
- Export to PDF/DOCX

---

### 3. **Mock Interview** (`/student/mock-interview`)
**AI-powered interview practice**

Features:
- Role-specific question generation
- HR, Technical, Resume, Behavioral, Project questions
- Real-time evaluation
- Communication scoring
- Improvement feedback
- Practice history tracking

---

### 4. **My Predictor** (`/student/predictor`) ⭐ NEW
**Individual placement prediction with behavior-focused guidance**

**Step 1: Quick Setup**
- Upload Resume (PDF/DOC) for auto-fill
- Scenario Presets: Job-ready, Balanced, Needs boost

**Step 2: Profile Inputs**
- Name, Branch, Tier, CGPA, Inter GPA, SSC GPA
- Internships, Projects, Programming Languages
- Hackathon & Extracurricular participation
- Skill Flags: DSA, Web Dev, ML, Cloud, Mobile Dev

**Step 3: Prediction Results**
- Placement Probability (%)
- Predicted Salary (LPA)
- Placement Decision (Likely Placed / Needs Improvement)
- Confidence Band (High / Moderate / Low)
- Readiness Score vs Outcome comparison

**Top Improvement Factors:**
- Highest-impact areas from prediction model
- Recommended Skills (action plan from profile gaps)
- Next Best Actions (prioritized for weekly execution)

**Real ATS Reader + Scorer:**
- Upload resume + paste job description
- ATS Match Score (0-100)
- Score Breakdown (keyword match, formatting, experience, etc.)
- Matched Keywords (green badges)
- Missing Keywords (amber badges)
- ATS Recommendations (priority actions)
- Extracted Resume Signals (word count, years experience, email, LinkedIn, GitHub)

**Decision Psychology Layer:**
- Confidence bands to reduce ambiguity
- Readiness score to anchor progress
- Top actions only (avoid cognitive overload)

---

### 5. **Profile** (`/student/profile`)
**Manage personal information and preferences**

Features:
- Update contact details
- Add skills and interests
- Upload documents
- Track profile completeness
- View application history

---

## 🎨 UI/UX Features

### Theme Support
- Light Mode
- Dark Mode
- Auto-detect system preference
- Persistent theme selection

### Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop layouts
- Sidebar navigation (desktop)
- Mobile menu overlay

### Navigation
- **TPO Sidebar:** Dashboard, Students, Companies, Import Data, Reports, Insights Lab, Campus Predictor
- **Student Sidebar:** Dashboard, Resume Studio, Mock Interview, My Predictor, Profile
- **Topbar:** Page title, navigation links, theme toggle, refresh, logout
- **Mobile Menu:** Full-screen overlay with all nav items

---

## 🔧 Technical Features

### Data Management
- **Local Storage:** Offline-first with localStorage persistence
- **Online Mode:** Supabase integration for cloud sync
- **Mode Toggle:** Switch between offline/online modes
- **Auto-refresh:** Real-time data updates
- **Data Migration:** Import/export between modes

### Intelligence Engines
1. **Placement Intelligence Service** (`placementIntelligenceService.js`)
   - Eligibility calculation
   - Risk scoring
   - Branch analytics
   - Operational insights

2. **Readiness Intelligence Service** (`readinessIntelligenceService.js`)
   - Student readiness scoring
   - Role matching
   - Skill gap analysis
   - Recommendations

3. **Job Match Service** (`jobMatchService.js`)
   - Student-role matching algorithm
   - Skill alignment scoring
   - Missing skills identification

4. **Prediction Service** (`predictionService.js`)
   - Student placement prediction
   - Campus prediction
   - ATS scoring
   - Resume parsing
   - Skill recommendations

### Backend Services
Located in `backend/services/`:
- `atsScorerEngine.js` - Resume ATS scoring
- `campusPredictorEngine.js` - Campus-level predictions
- `institutionalIntelligenceEngine.js` - Institutional analytics
- `mockInterviewEngine.js` - Interview simulation
- `ossResumeOptimizer.js` - Resume optimization
- `paddleOcrBridge.js` - OCR for resume extraction
- `placementPredictionEngine.js` - Individual predictions
- `resumeSignalExtractor.js` - Extract signals from resumes
- `resumeTextExtractor.js` - Text extraction from files

### ML Integration
Located in `ml/`:
- **API:** Flask API for ML predictions (`ml/api/app.py`)
- **Notebooks:** Training notebooks for model development
  - `01_data_preprocessing.ipynb`
  - `02_model_training.ipynb`
  - `03_evaluation.ipynb`
  - `04_insights_generation.ipynb`

---

## 📊 Sample Data

Located in `sample data/`:
- `JECRC_Placement_Master_2025.csv` - Student master data
- `JECRC_Drive_Requirements_2025.csv` - Company requirements
- `JECRC_Resume_Intelligence_2025.csv` - Resume analysis data
- `JECRC_Placement_Operations_2025.xlsx` - Operations data

Use these files to test the Import Data feature.

---

## 🚀 Quick Start Workflow

### For TPO:
1. Login with admin credentials
2. Go to **Import Data** → Upload sample CSV/Excel
3. View **Dashboard** → See analytics populate
4. Check **Insights Lab** → View ML predictions
5. Run **Campus Predictor** → Get campus-level forecasts
6. Review **Intervention Queue** → Identify at-risk students
7. Generate **Reports** → Export for stakeholders

### For Students:
1. Login with student credentials (or create account)
2. View **Dashboard** → See readiness score
3. Go to **Resume Studio** → Upload and optimize resume
4. Try **Mock Interview** → Practice with AI
5. Run **My Predictor** → Get placement probability
6. Review **Action Feed** → Follow improvement steps
7. Apply to companies from **Role Match Cards**

---

## 🎯 Key Differentiators

1. **Behavior-Focused Design:** Reduces cognitive load, increases action adherence
2. **Transparent AI:** Shows confidence bands, prediction factors, model sources
3. **Action-First:** Prioritized recommendations instead of overwhelming data
4. **Dual Perspective:** Separate workflows for TPO and students
5. **Offline-First:** Works without internet, syncs when online
6. **Real ATS Scoring:** Open-source inspired resume analysis
7. **ML-Powered:** Trained models for accurate predictions
8. **Comprehensive:** End-to-end placement management

---

## 📝 Notes

- All features are accessible via the sidebar navigation
- Use the theme toggle (sun/moon icon) to switch between light/dark modes
- Click the refresh button to reload data
- The dashboard auto-refreshes when you switch between pages
- Empty states guide you to import data when needed
- All predictions show confidence levels and sources
- Reports can be exported in multiple formats

---

## 🐛 Troubleshooting

**Dashboard stuck on loading?**
- Import student data via "Import Data" page
- Check if you're logged in with correct role
- Refresh the page

**Features not visible?**
- Check the sidebar navigation (all features listed)
- Ensure you're logged in (not guest mode)
- Try switching between light/dark theme

**Predictions not working?**
- Ensure ML API is running (`ml/api/app.py`)
- Check backend services are started
- Verify sample data is imported

---

## 📧 Support

For issues or questions, check:
- `ARCHITECTURE.md` - System architecture
- `README.md` - Setup instructions
- `sample data/README.md` - Data format guide

---

**Built with ❤️ for seamless placement management**
