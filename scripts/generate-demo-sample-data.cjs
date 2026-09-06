const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const outputDir = path.join(__dirname, '..', 'sample data');
fs.mkdirSync(outputDir, { recursive: true });

const companies = [
  {
    Company: 'Thomson Reuters',
    Role: 'Software Engineer Intern',
    Package_LPA: 12,
    Min_CGPA: 7.2,
    Required_Skills: 'JavaScript, React, SQL, DSA',
    Preferred_Skills: 'Node.js, Git, Cloud',
    Deadline: '2026-06-04',
    Work_Mode: 'Hybrid',
  },
  {
    Company: 'Infosys',
    Role: 'Systems Engineer',
    Package_LPA: 4.5,
    Min_CGPA: 6.5,
    Required_Skills: 'Java, SQL, Communication',
    Preferred_Skills: 'Spring Boot, Cloud',
    Deadline: '2026-06-08',
    Work_Mode: 'Onsite',
  },
  {
    Company: 'TCS Digital',
    Role: 'Digital Specialist Engineer',
    Package_LPA: 7,
    Min_CGPA: 7,
    Required_Skills: 'DSA, Python, DBMS',
    Preferred_Skills: 'React, APIs',
    Deadline: '2026-06-12',
    Work_Mode: 'Hybrid',
  },
  {
    Company: 'Celebal Technologies',
    Role: 'Data Analyst Intern',
    Package_LPA: 6,
    Min_CGPA: 7,
    Required_Skills: 'Python, SQL, Excel, Power BI',
    Preferred_Skills: 'Statistics, Azure',
    Deadline: '2026-06-15',
    Work_Mode: 'Remote',
  },
  {
    Company: 'Adobe',
    Role: 'Frontend Engineer Intern',
    Package_LPA: 18,
    Min_CGPA: 8,
    Required_Skills: 'React, JavaScript, DSA',
    Preferred_Skills: 'TypeScript, UI Design',
    Deadline: '2026-06-19',
    Work_Mode: 'Hybrid',
  },
  {
    Company: 'Capgemini',
    Role: 'Analyst Trainee',
    Package_LPA: 4.25,
    Min_CGPA: 6,
    Required_Skills: 'Aptitude, Communication, SQL',
    Preferred_Skills: 'Java, Excel',
    Deadline: '2026-06-22',
    Work_Mode: 'Onsite',
  },
];

const branches = ['CSE', 'IT', 'ECE', 'CSE-AI', 'Electrical', 'Mechanical', 'Civil'];
const names = [
  'Aarav Sharma', 'Diya Patel', 'Rohan Mehta', 'Ananya Singh', 'Ishaan Gupta',
  'Kavya Nair', 'Rahul Verma', 'Aaranya Jain', 'Vikram Patel', 'Meera Joshi',
  'Nikhil Bansal', 'Priya Soni', 'Arjun Rathore', 'Sanya Khan', 'Devansh Agarwal',
  'Tanya Saxena', 'Harsh Vardhan', 'Neha Choudhary', 'Kunal Saini', 'Ritika Mathur',
  'Yash Khandelwal', 'Simran Kaur', 'Mohit Yadav', 'Pooja Meena', 'Aditya Raj',
  'Shruti Goyal', 'Naman Jain', 'Ira Thomas', 'Lakshya Bhatia', 'Tanvi Sharma',
  'Kabir Arora', 'Aditi Malhotra', 'Siddharth Jain', 'Mansi Verma', 'Aman Chhabra',
  'Bhavya Singh', 'Raghav Gaur', 'Sneha Kapoor', 'Om Prakash', 'Kriti Vyas',
];

const skillSets = {
  strongWeb: 'React, JavaScript, SQL, DSA, Git, Node.js',
  data: 'Python, SQL, Excel, Power BI, Statistics',
  core: 'Java, SQL, Aptitude, Communication',
  weak: 'Excel, Communication',
  embedded: 'C, Python, Embedded Systems, DBMS',
  cloud: 'React, Docker, AWS, SQL, DSA',
};

function pickCompany(index, branch) {
  if (branch === 'CSE' || branch === 'IT' || branch === 'CSE-AI') return companies[index % 6];
  if (branch === 'ECE') return companies[[1, 2, 3, 5][index % 4]];
  return companies[[1, 3, 5][index % 3]];
}

function statusFor(score, backlogs) {
  if (backlogs > 1) return 'Not Eligible';
  if (score >= 84) return 'Selected';
  if (score >= 74) return 'Interview';
  if (score >= 64) return 'Shortlisted';
  if (score >= 54) return 'Applied';
  return 'Unplaced';
}

const rows = names.map((name, index) => {
  const branch = branches[index % branches.length];
  const cgpa = Number((6.1 + ((index * 7) % 34) / 10).toFixed(2));
  const attendance = 62 + ((index * 5) % 36);
  const activeBacklogs = index % 13 === 0 ? 2 : index % 7 === 0 ? 1 : 0;
  const projects = Math.max(0, (index * 3) % 6);
  const internships = index % 5 === 0 ? 2 : index % 3 === 0 ? 1 : 0;
  const atsScore = Math.min(96, Math.max(35, Math.round(cgpa * 8 + projects * 3 + internships * 5 - activeBacklogs * 8)));
  const aptitudeScore = Math.min(95, Math.max(38, Math.round(cgpa * 7.5 + ((index * 4) % 18) - activeBacklogs * 5)));
  const communicationScore = Math.min(94, Math.max(36, Math.round(54 + ((index * 9) % 38) - activeBacklogs * 6)));
  const readiness = Math.round(cgpa * 7 + atsScore * 0.22 + aptitudeScore * 0.18 + communicationScore * 0.16 + projects * 2.5 + internships * 5 - activeBacklogs * 13);
  const company = pickCompany(index, branch);
  const hasResume = atsScore > 45;
  const storedAtsScore = hasResume ? atsScore : 0;
  const key = branch.includes('CSE') || branch === 'IT'
    ? (index % 4 === 0 ? 'cloud' : 'strongWeb')
    : branch === 'ECE'
      ? 'embedded'
      : index % 2 === 0
        ? 'data'
        : 'core';

  return {
    'Student Name': name,
    Email: `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/\.$/, '')}@jecrc.demo`,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/\.$/, '')}@jecrc.demo`,
    Enrollment_No: `JECRC2025${String(index + 1).padStart(3, '0')}`,
    enrollment: `JECRC2025${String(index + 1).padStart(3, '0')}`,
    Dept: branch,
    SGPA: cgpa,
    Attendance_Percent: attendance,
    'Current Back': activeBacklogs,
    Placement_Status: statusFor(readiness, activeBacklogs),
    Shortlisted: readiness >= 64 && activeBacklogs <= 1 ? 'Yes' : 'No',
    'Resume Uploaded': hasResume ? 'Yes' : 'No',
    ATS_Score: storedAtsScore,
    atsScore: storedAtsScore,
    resumeScore: storedAtsScore,
    Aptitude_Score: aptitudeScore,
    Communication_Score: communicationScore,
    Projects: projects,
    Internships: internships,
    Skills: skillSets[key],
    Certifications: internships ? 'AWS Cloud Practitioner, NPTEL' : index % 2 === 0 ? 'Coursera SQL' : '',
    Company: company.Company,
    Role: company.Role,
    Package_LPA: company.Package_LPA,
    Min_CGPA: company.Min_CGPA,
    Required_Skills: company.Required_Skills,
    Preferred_Skills: company.Preferred_Skills,
    Deadline: company.Deadline,
    Work_Mode: company.Work_Mode,
    Applications_Count: 1 + (index % 5),
  };
});

// One duplicate row is intentional so the import wizard can show duplicate detection.
rows.push({ ...rows[7], Placement_Status: 'Applied' });

const workbook = XLSX.utils.book_new();
const mainSheet = XLSX.utils.json_to_sheet(rows);
const driveSheet = XLSX.utils.json_to_sheet(companies);
XLSX.utils.book_append_sheet(workbook, mainSheet, 'Placement_Import');
XLSX.utils.book_append_sheet(workbook, driveSheet, 'Drive_Reference');

const xlsxPath = path.join(outputDir, 'Placify_AI_Demo_Placement_Intelligence_2025.xlsx');
const csvPath = path.join(outputDir, 'Placify_AI_Demo_Placement_Intelligence_2025.csv');
XLSX.writeFile(workbook, xlsxPath);
fs.writeFileSync(csvPath, XLSX.utils.sheet_to_csv(mainSheet), 'utf8');

console.log(`Wrote ${xlsxPath}`);
console.log(`Wrote ${csvPath}`);
