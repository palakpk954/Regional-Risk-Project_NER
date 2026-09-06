const FIELD_DICTIONARY = {
  name: ['student name', 'student', 'candidate', 'name', 'full name'],
  enrollment: ['enrollment', 'enrolment', 'roll', 'roll no', 'reg no', 'registration', 'university id'],
  branch: ['branch', 'dept', 'department', 'stream', 'discipline', 'course'],
  cgpa: ['cgpa', 'gpa', 'sgpa', 'grade point', 'current cgpa', 'aggregate'],
  attendance: ['attendance', 'attendence', 'att %', 'attendance %', 'present percent'],
  activeBacklogs: ['active backlog', 'current back', 'live backlog', 'backlogs', 'backs', 'kt'],
  status: ['placement status', 'placed', 'selected', 'status', 'result', 'offer'],
  shortlisted: ['shortlisted', 'eligible', 'screened', 'shortlist status'],
  resumeUploaded: ['resume uploaded', 'resume', 'cv uploaded', 'cv', 'ats'],
  aptitudeScore: ['aptitude', 'aptitude score', 'test score', 'assessment'],
  communicationScore: ['communication', 'communication score', 'spoken', 'soft skill'],
  company: ['company', 'company name', 'employer', 'organization'],
  package: ['package', 'ctc', 'salary', 'stipend', 'package lpa', 'package_lpa'],
};

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function compactKey(value) {
  return normalizeKey(value).replace(/\s+/g, '');
}

function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function truthyStatus(value) {
  const key = normalizeKey(value);
  return ['yes', 'true', 'y', 'uploaded', 'done', 'submitted', 'selected', 'placed', 'eligible', 'shortlisted'].some((term) =>
    key.includes(term),
  );
}

export function detectColumnMappings(rows = []) {
  const columns = Object.keys(rows[0] || {});
  return columns.map((column) => {
    const normalized = normalizeKey(column);
    const compact = compactKey(column);
    let best = { field: 'unmapped', confidence: 0, reason: 'No close placement field detected' };

    Object.entries(FIELD_DICTIONARY).forEach(([field, aliases]) => {
      aliases.forEach((alias) => {
        const aliasNormalized = normalizeKey(alias);
        const aliasCompact = compactKey(alias);
        let score = 0;
        if (compact === aliasCompact) score = 100;
        else if (compact.includes(aliasCompact) || (compact.length >= 7 && aliasCompact.includes(compact))) score = 86;
        else if (normalized.split(' ').some((token) => aliasNormalized.includes(token) && token.length > 2)) score = 68;

        if (score > best.confidence) {
          best = {
            field,
            confidence: score,
            reason: `${column} -> ${field}`,
          };
        }
      });
    });

    return {
      column,
      field: best.field,
      confidence: best.confidence,
      reason: best.reason,
    };
  });
}

export function countDuplicateRows(rows = []) {
  const seen = new Set();
  let duplicates = 0;

  rows.forEach((row) => {
    const key = [
      row.email,
      row.enrollment,
      row.enrolment,
      row.roll,
      row.roll_no,
      row.name,
      row.student_name,
    ]
      .filter(Boolean)
      .join('|')
      .toLowerCase();

    if (!key) return;
    if (seen.has(key)) duplicates += 1;
    seen.add(key);
  });

  return duplicates;
}

export function normalizeOperationalStudent(row = {}) {
  const mappings = detectColumnMappings([row]);
  const fieldValue = (field) => {
    const mapped = mappings.find((item) => item.field === field);
    return mapped ? row[mapped.column] : undefined;
  };

  const cgpa = toNumber(fieldValue('cgpa') ?? row.cgpa ?? row.sgpa);
  const attendance = toNumber(fieldValue('attendance') ?? row.attendance, 75);
  const activeBacklogs = toNumber(fieldValue('activeBacklogs') ?? row.activeBacklogs ?? row.backlogs);
  const aptitudeScore = toNumber(fieldValue('aptitudeScore') ?? row.aptitudeScore, 55);
  const communicationScore = toNumber(fieldValue('communicationScore') ?? row.communicationScore, 55);
  const resumeScore = toNumber(row.resumeScore ?? row.atsScore ?? fieldValue('resumeUploaded'), truthyStatus(fieldValue('resumeUploaded')) ? 68 : 0);

  return {
    name: fieldValue('name') || row.name || row.studentName || 'Unknown Student',
    enrollment: fieldValue('enrollment') || row.enrollment || row.roll || row.rollNo || '',
    branch: fieldValue('branch') || row.branch || row.department || row.dept || 'Unknown',
    cgpa,
    attendance,
    activeBacklogs,
    placementStatus: fieldValue('status') || row.status || row.placementStatus || 'Applied',
    shortlisted: truthyStatus(fieldValue('shortlisted') ?? row.shortlisted),
    resumeUploaded: truthyStatus(fieldValue('resumeUploaded') ?? row.resumeUploaded) || resumeScore > 0,
    aptitudeScore,
    communicationScore,
    resumeScore,
  };
}

export function calculateEligibility(student, criteria = {}) {
  const minCgpa = toNumber(criteria.minCgpa ?? criteria.minimumCgpa ?? criteria.eligibility, 7);
  const minAttendance = toNumber(criteria.minAttendance ?? criteria.attendance, 75);
  const maxBacklogs = toNumber(criteria.maxBacklogs ?? criteria.backlogs, 0);
  const eligibleBranches = Array.isArray(criteria.eligibleBranches) ? criteria.eligibleBranches : [];

  const blockers = [
    student.cgpa < minCgpa ? `CGPA below ${minCgpa}` : null,
    student.attendance < minAttendance ? `Attendance below ${minAttendance}%` : null,
    student.activeBacklogs > maxBacklogs ? `${student.activeBacklogs} active backlog(s)` : null,
    eligibleBranches.length && !eligibleBranches.includes(student.branch) ? 'Branch not eligible' : null,
  ].filter(Boolean);

  return {
    eligible: blockers.length === 0,
    blockers,
  };
}

export function calculatePlacementRisk(student) {
  const risk =
    (student.cgpa < 6.8 ? 24 : student.cgpa < 7.5 ? 12 : 0) +
    (student.activeBacklogs > 0 ? 24 : 0) +
    (student.attendance < 70 ? 18 : student.attendance < 78 ? 9 : 0) +
    (student.aptitudeScore < 55 ? 12 : 0) +
    (student.communicationScore < 55 ? 10 : 0) +
    (student.resumeScore < 50 ? 14 : student.resumeScore < 70 ? 7 : 0);

  if (risk >= 48) return { score: risk, category: 'At Risk', tone: 'danger' };
  if (risk >= 24) return { score: risk, category: 'Medium', tone: 'warning' };
  return { score: risk, category: 'High Chance', tone: 'success' };
}

export function buildOperationalIntelligence({ rows = [], students = [], companies = [] }) {
  const sourceRows = rows.length ? rows : students;
  const operationalStudents = sourceRows.map(normalizeOperationalStudent);
  const duplicateCount = countDuplicateRows(sourceRows);
  const mappings = detectColumnMappings(sourceRows);
  const criteria = companies[0] || { eligibility: 7, minAttendance: 75, maxBacklogs: 0 };

  const eligibilityRows = operationalStudents.map((student) => ({
    ...student,
    eligibility: calculateEligibility(student, criteria),
    risk: calculatePlacementRisk(student),
  }));

  const eligibleCount = eligibilityRows.filter((student) => student.eligibility.eligible).length;
  const ineligibleCount = eligibilityRows.length - eligibleCount;
  const noResumeCount = eligibilityRows.filter((student) => !student.resumeUploaded).length;
  const atRiskCount = eligibilityRows.filter((student) => student.risk.category === 'At Risk').length;

  const branchMap = new Map();
  eligibilityRows.forEach((student) => {
    if (!branchMap.has(student.branch)) {
      branchMap.set(student.branch, {
        branch: student.branch,
        students: 0,
        eligible: 0,
        atRisk: 0,
        avgAts: 0,
        atsSum: 0,
        backlogBlocked: 0,
      });
    }
    const branch = branchMap.get(student.branch);
    branch.students += 1;
    if (student.eligibility.eligible) branch.eligible += 1;
    if (student.risk.category === 'At Risk') branch.atRisk += 1;
    if (student.activeBacklogs > 0) branch.backlogBlocked += 1;
    branch.atsSum += student.resumeScore;
    branch.avgAts = Math.round(branch.atsSum / branch.students);
  });

  const branches = Array.from(branchMap.values()).sort((a, b) => b.students - a.students);
  const eligibilityRate = eligibilityRows.length ? Math.round((eligibleCount / eligibilityRows.length) * 100) : 0;
  const worstBacklogBranch = [...branches].sort((a, b) => b.backlogBlocked - a.backlogBlocked)[0];
  const weakestResumeBranch = [...branches].sort((a, b) => a.avgAts - b.avgAts)[0];

  const insights = [
    eligibilityRows.length ? `Only ${eligibilityRate}% students are eligible under the current drive rules.` : null,
    worstBacklogBranch?.backlogBlocked ? `${worstBacklogBranch.branch} has the highest backlog-related ineligibility.` : null,
    weakestResumeBranch ? `${weakestResumeBranch.branch} has the lowest average ATS score (${weakestResumeBranch.avgAts}/100).` : null,
    noResumeCount ? `${noResumeCount} students have not uploaded usable resumes.` : null,
    duplicateCount ? `${duplicateCount} duplicate-looking row(s) were detected during ingestion.` : null,
  ].filter(Boolean);

  return {
    mappings,
    duplicateCount,
    totalStudents: eligibilityRows.length,
    eligibleCount,
    ineligibleCount,
    noResumeCount,
    atRiskCount,
    eligibilityRate,
    branches,
    insights,
    riskRows: eligibilityRows,
  };
}
