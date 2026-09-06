# Placify AI Sample Data

Synthetic JECRC-style placement operations data for demo and testing.

These files are not official JECRC placement records. They are realistic sample datasets built around common engineering branches such as CSE, IT, ECE, Electrical, Civil, Mechanical, and CSE AI/DevOps specializations.

Use these in `Data Ingestion`:

- `Placify_AI_Demo_Placement_Intelligence_2025.xlsx` — best single-file demo dataset
- `Placify_AI_Demo_Placement_Intelligence_2025.csv` — CSV version of the same demo dataset
- `JECRC_Placement_Operations_2025.xlsx`
- `JECRC_Placement_Master_2025.csv`
- `JECRC_Resume_Intelligence_2025.csv`
- `JECRC_Drive_Requirements_2025.csv`

The master file intentionally includes messy institutional column names:

- `Dept` maps to branch
- `SGPA` maps to CGPA
- `Current Back` maps to active backlogs
- `Package_LPA` maps to package
- `Resume Uploaded` maps to resume status

Recommended viva/demo file:

`Placify_AI_Demo_Placement_Intelligence_2025.xlsx`

Why this file works well:

- 41 placement rows
- 40 unique synthetic students
- 1 intentional duplicate record
- 6 company drives
- mixed branches: CSE, IT, ECE, CSE-AI, Electrical, Mechanical, Civil
- realistic CGPA, attendance, backlog, ATS, aptitude, communication, projects, internships, skills, and placement status values
- columns intentionally include common college-style names such as `Dept`, `SGPA`, `Current Back`, `Attendance_Percent`, and `Package_LPA`
