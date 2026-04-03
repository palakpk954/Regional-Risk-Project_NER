import fs from 'node:fs';
import path from 'node:path';

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Krish', 'Ishaan', 'Kabir', 'Rohan', 'Yash', 'Dhruv',
  'Ananya', 'Diya', 'Riya', 'Saanvi', 'Ira', 'Meera', 'Aditi', 'Kavya', 'Tara', 'Myra',
  'Pranav', 'Harsh', 'Nikhil', 'Siddharth', 'Tanmay', 'Vedant', 'Omkar', 'Rahul', 'Kunal', 'Varun',
  'Sneha', 'Pooja', 'Neha', 'Ishita', 'Simran', 'Manya', 'Nandini', 'Shreya', 'Ritika', 'Palak',
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Menon', 'Singh', 'Kaur',
  'Jain', 'Agarwal', 'Bansal', 'Kulkarni', 'Deshmukh', 'Pandey', 'Mishra', 'Choudhary', 'Saxena', 'Tiwari',
  'Bhat', 'Das', 'Roy', 'Srinivasan', 'Bhattacharya', 'Pillai', 'Mohan', 'Kamble', 'Yadav', 'Tripathi',
  'Dubey', 'Joshi', 'Mhatre', 'Bose', 'Dutta', 'Sahu', 'Parmar', 'Arora', 'Malhotra', 'Chawla',
];

const branches = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AI-DS', 'CSBS', 'MCA'];

const cities = [
  'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai', 'Delhi', 'Noida', 'Gurugram',
  'Ahmedabad', 'Jaipur', 'Indore', 'Bhopal', 'Lucknow', 'Kochi', 'Coimbatore', 'Mysuru',
];

const companyPool = [
  'Google', 'Microsoft', 'Amazon', 'Adobe', 'Salesforce', 'Oracle', 'IBM', 'NVIDIA',
  'OpenAI', 'Accenture', 'TCS', 'Infosys', 'Wipro', 'HCLTech', 'Tech Mahindra', 'Cognizant',
  'Capgemini', 'LTIMindtree', 'Mphasis', 'Persistent Systems', 'Nagarro', 'Razorpay',
  'PhonePe', 'Paytm', 'Flipkart', 'Meesho', 'Swiggy', 'Zomato', 'Zoho', 'Freshworks',
  'Cloudflare', 'Atlassian', 'Databricks', 'ServiceNow', 'SAP', 'Dell Technologies',
  'Honeywell', 'Bosch', 'Siemens', 'Schneider Electric', 'Airtel Digital', 'Jio Platforms',
  'Nokia', 'Ericsson', 'Juniper Networks', 'Palo Alto Networks',
];

const selectedStatuses = ['Selected', 'Offer', 'Placed', 'Hired', 'selected'];
const interviewStatuses = ['Interview', 'Shortlisted', 'Interview Round 2', 'shortlisting'];
const appliedStatuses = ['Applied', 'Application Sent', 'Under Review', 'applied'];

function cleanEmailToken(value) {
  return String(value).toLowerCase().replace(/[^a-z]/g, '');
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

function generateStatus(cgpa, signal) {
  if (cgpa >= 8.5) {
    if (signal < 72) return pick(selectedStatuses, signal);
    if (signal < 92) return pick(interviewStatuses, signal);
    return pick(appliedStatuses, signal);
  }

  if (cgpa >= 7.5) {
    if (signal < 48) return pick(selectedStatuses, signal + 2);
    if (signal < 84) return pick(interviewStatuses, signal + 1);
    return pick(appliedStatuses, signal + 3);
  }

  if (cgpa >= 6.8) {
    if (signal < 22) return pick(selectedStatuses, signal + 1);
    if (signal < 62) return pick(interviewStatuses, signal + 4);
    return pick(appliedStatuses, signal + 5);
  }

  if (signal < 8) return pick(interviewStatuses, signal + 6);
  return pick(appliedStatuses, signal + 7);
}

function shouldAssignCompany(status, signal) {
  if (String(status).toLowerCase().includes('select') || String(status).toLowerCase().includes('offer') || String(status).toLowerCase().includes('place')) {
    return true;
  }
  if (String(status).toLowerCase().includes('interview') || String(status).toLowerCase().includes('shortlist')) {
    return signal % 3 !== 0;
  }
  return signal % 5 === 0;
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const headers = [
  'name',
  'email',
  'cgpa',
  'branch',
  'company',
  'status',
  'graduation_batch',
  'city',
  'active_backlogs',
  'internship_months',
  'hackathon_score',
  'aptitude_score',
];

const rows = [];
const totalStudents = 540;

for (let i = 1; i <= totalStudents; i += 1) {
  const first = pick(firstNames, i * 3);
  const last = pick(lastNames, i * 7 + 5);
  const name = `${first} ${last}`;
  const email = `${cleanEmailToken(first)}.${cleanEmailToken(last)}${i}@placifycollege.edu.in`;

  const branch = pick(branches, i * 5 + 3);
  const city = pick(cities, i * 11 + 9);

  const rawCgpa = 5.4 + (((i * 37) % 43) / 10);
  const cgpa = Math.min(9.8, Number(rawCgpa.toFixed(2)));

  const signal = (i * 13 + 17) % 100;
  const status = generateStatus(cgpa, signal);

  const company = shouldAssignCompany(status, signal)
    ? pick(companyPool, i * 17 + signal)
    : '';

  const activeBacklogs = cgpa < 6.5 ? (i % 3) : (cgpa < 7.2 ? i % 2 : 0);
  const internshipMonths = company ? (i % 7) + (cgpa > 8 ? 2 : 0) : Math.max(0, (i % 4) - 1);
  const hackathonScore = 45 + ((i * 19) % 56);
  const aptitudeScore = 40 + ((i * 23) % 61);

  rows.push([
    name,
    email,
    cgpa.toFixed(2),
    branch,
    company,
    status,
    '2026',
    city,
    activeBacklogs,
    internshipMonths,
    hackathonScore,
    aptitudeScore,
  ]);
}

// Add a few realistic duplicate update rows so dedupe logic can be tested.
for (let j = 1; j <= 24; j += 1) {
  const idx = j * 9;
  const target = rows[idx];
  if (!target) continue;

  const updated = [...target];
  updated[4] = pick(companyPool, idx * 5 + j);
  updated[5] = pick(selectedStatuses, j + 2);
  updated[10] = Math.min(100, Number(updated[10]) + 8);
  updated[11] = Math.min(100, Number(updated[11]) + 6);
  rows.push(updated);
}

const csvLines = [headers.join(','), ...rows.map((row) => row.map(csvEscape).join(','))];

const targetFile = path.resolve('public', 'placify-indian-college-mega-demo.csv');
fs.writeFileSync(targetFile, `${csvLines.join('\n')}\n`, 'utf8');

console.log(`Created demo CSV at: ${targetFile}`);
console.log(`Rows (excluding header): ${rows.length}`);
