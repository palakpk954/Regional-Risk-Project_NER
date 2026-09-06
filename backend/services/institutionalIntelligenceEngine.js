const FIELD_DICTIONARY = {
  name: ['studentname', 'student', 'candidate', 'name', 'fullname', 'applicantname'],
  enrollment: ['enrollment', 'enrolment', 'roll', 'rollno', 'registration', 'universityid', 'studentid'],
  branch: ['branch', 'dept', 'department', 'stream', 'discipline', 'course', 'program'],
  cgpa: ['cgpa', 'gpa', 'sgpa', 'gradepoint', 'aggregate', 'score', 'academic score'],
  attendance: ['attendance', 'attendence', 'attpercent', 'attendancepercent', 'attendancepercentage', 'presentpercent', 'attd'],
  activeBacklogs: ['activebacklog', 'activebacklogs', 'currentback', 'currentbacks', 'livebacklog', 'backlogs', 'backs', 'kt'],
  status: ['placementstatus', 'placed', 'selected', 'status', 'result', 'offer', 'selectionstatus'],
  shortlisted: ['shortlisted', 'eligible', 'screened', 'shortliststatus', 'shortlist'],
  resumeUploaded: ['resumeuploaded', 'resume', 'cvuploaded', 'cv', 'ats', 'atsscore', 'resumescore'],
  aptitudeScore: ['aptitude', 'aptitudescore', 'testscore', 'assessment', 'aptiscore'],
  communicationScore: ['communication', 'communicationscore', 'spoken', 'softskill', 'softskills'],
  company: ['company', 'companyname', 'employer', 'organization'],
  package: ['package', 'ctc', 'salary', 'stipend', 'packagelpa'],
};

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function truthy(value) {
  const key = normalizeText(value).toLowerCase();
  if (['no', 'false', '0', 'not uploaded', 'missing', 'unplaced', 'not placed'].some((term) => key.includes(term))) return false;
  return ['yes', 'true', '1', 'uploaded', 'done', 'submitted', 'selected', 'placed', 'eligible', 'shortlisted'].some((term) => key.includes(term));
}

function getByDetectedField(row, field) {
  const keys = Object.keys(row || {});
  const aliases = FIELD_DICTIONARY[field] || [];
  const key = keys.find((item) => {
    const normalized = normalizeKey(item);
    return aliases.some((alias) => normalized === alias || normalized.includes(alias) || (normalized.length >= 7 && alias.includes(normalized)));
  });
  return key ? row[key] : undefined;
}

function detectColumnMappings(rows = []) {
  const columns = Object.keys(rows[0] || {});
  return columns.map((column) => {
    const normalized = normalizeKey(column);
    let best = { field: 'unmapped', confidence: 0 };

    Object.entries(FIELD_DICTIONARY).forEach(([field, aliases]) => {
      aliases.forEach((alias) => {
        let confidence = 0;
        if (normalized === alias) confidence = 100;
        else if (normalized.includes(alias) || alias.includes(normalized)) confidence = 86;
        else if (alias.startsWith(normalized.slice(0, 4)) && normalized.length >= 4) confidence = 64;
        else if (normalized.length >= 4 && levenshteinDistance(normalized, alias) <= 2) confidence = 58;
        if (confidence > best.confidence) best = { field, confidence };
      });
    });

    return {
      column,
      field: best.field,
      confidence: best.confidence,
      reason: best.field === 'unmapped' ? 'Needs manual review' : `${column} -> ${best.field}`,
    };
  });
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

function normalizeStudent(row) {
  const resumeValue = getByDetectedField(row, 'resumeUploaded');
  const resumeScore = toNumber(row.resumeScore ?? row.atsScore ?? resumeValue, truthy(resumeValue) ? 68 : 0);

  return {
    name: getByDetectedField(row, 'name') || row.name || 'Unknown Student',
    enrollment: getByDetectedField(row, 'enrollment') || row.enrollment || row.rollNo || '',
    branch: getByDetectedField(row, 'branch') || row.branch || 'Unknown',
    cgpa: toNumber(getByDetectedField(row, 'cgpa') ?? row.cgpa),
    attendance: toNumber(getByDetectedField(row, 'attendance') ?? row.attendance, 75),
    activeBacklogs: toNumber(getByDetectedField(row, 'activeBacklogs') ?? row.activeBacklogs),
    placementStatus: getByDetectedField(row, 'status') || row.status || 'Applied',
    shortlisted: truthy(getByDetectedField(row, 'shortlisted') ?? row.shortlisted),
    resumeUploaded: truthy(resumeValue) || resumeScore > 0,
    aptitudeScore: toNumber(getByDetectedField(row, 'aptitudeScore') ?? row.aptitudeScore, 55),
    communicationScore: toNumber(getByDetectedField(row, 'communicationScore') ?? row.communicationScore, 55),
    resumeScore,
  };
}

function eligibilityFor(student, criteria = {}) {
  const minCgpa = toNumber(criteria.minCgpa ?? criteria.minimumCgpa ?? criteria.eligibility, 7);
  const minAttendance = toNumber(criteria.minAttendance ?? criteria.attendance, 75);
  const maxBacklogs = toNumber(criteria.maxBacklogs ?? criteria.backlogs, 0);

  const blockers = [
    student.cgpa < minCgpa ? `CGPA below ${minCgpa}` : null,
    student.attendance < minAttendance ? `Attendance below ${minAttendance}%` : null,
    student.activeBacklogs > maxBacklogs ? `${student.activeBacklogs} active backlog(s)` : null,
  ].filter(Boolean);

  return { eligible: blockers.length === 0, blockers };
}

function riskFor(student) {
  const score =
    (student.cgpa < 6.8 ? 24 : student.cgpa < 7.5 ? 12 : 0) +
    (student.activeBacklogs > 0 ? 24 : 0) +
    (student.attendance < 70 ? 18 : student.attendance < 78 ? 9 : 0) +
    (student.aptitudeScore < 55 ? 12 : 0) +
    (student.communicationScore < 55 ? 10 : 0) +
    (student.resumeScore < 50 ? 14 : student.resumeScore < 70 ? 7 : 0);

  if (score >= 48) return { score, category: 'At Risk' };
  if (score >= 24) return { score, category: 'Medium' };
  return { score, category: 'High Chance' };
}

function duplicateCount(rows = []) {
  const seen = new Set();
  let duplicates = 0;
  rows.forEach((row) => {
    const key = [row.email, row.enrollment, row.roll, row.rollNo, row.name, row.studentName].filter(Boolean).join('|').toLowerCase();
    if (!key) return;
    if (seen.has(key)) duplicates += 1;
    seen.add(key);
  });
  return duplicates;
}

function buildInstitutionalIntelligence({ rows = [], criteria = {} }) {
  const students = rows.map(normalizeStudent);
  const enriched = students.map((student) => ({
    ...student,
    eligibility: eligibilityFor(student, criteria),
    risk: riskFor(student),
  }));

  const totalStudents = enriched.length;
  const eligibleStudents = enriched.filter((student) => student.eligibility.eligible).length;
  const atRiskStudents = enriched.filter((student) => student.risk.category === 'At Risk').length;
  const noResumeStudents = enriched.filter((student) => !student.resumeUploaded).length;
  const duplicates = duplicateCount(rows);

  const branchMap = new Map();
  enriched.forEach((student) => {
    const branch = student.branch || 'Unknown';
    if (!branchMap.has(branch)) {
      branchMap.set(branch, { branch, total: 0, eligible: 0, atRisk: 0, backlogBlocked: 0, atsSum: 0, averageAtsScore: 0 });
    }
    const item = branchMap.get(branch);
    item.total += 1;
    if (student.eligibility.eligible) item.eligible += 1;
    if (student.risk.category === 'At Risk') item.atRisk += 1;
    if (student.activeBacklogs > 0) item.backlogBlocked += 1;
    item.atsSum += student.resumeScore;
    item.averageAtsScore = Math.round(item.atsSum / item.total);
  });

  const branches = Array.from(branchMap.values()).sort((a, b) => b.total - a.total);
  const eligibilityRate = totalStudents ? Math.round((eligibleStudents / totalStudents) * 100) : 0;
  const backlogBranch = [...branches].sort((a, b) => b.backlogBlocked - a.backlogBlocked)[0];
  const resumeBranch = [...branches].sort((a, b) => a.averageAtsScore - b.averageAtsScore)[0];

  const insights = [
    totalStudents ? `Only ${eligibilityRate}% students are eligible for upcoming drives.` : null,
    backlogBranch?.backlogBlocked ? `${backlogBranch.branch} has highest backlog-related ineligibility.` : null,
    resumeBranch ? `${resumeBranch.branch} has lowest average ATS score (${resumeBranch.averageAtsScore}/100).` : null,
    noResumeStudents ? `${noResumeStudents} students have not uploaded resumes.` : null,
    duplicates ? `${duplicates} duplicate-looking records were detected.` : null,
  ].filter(Boolean);

  return {
    totalStudents,
    eligibleStudents,
    ineligibleStudents: totalStudents - eligibleStudents,
    atRiskStudents,
    noResumeStudents,
    duplicateRows: duplicates,
    eligibilityRate,
    mappings: detectColumnMappings(rows),
    branches,
    insights,
    riskRows: enriched,
    source: 'placify-ops-intelligence-rules-v1',
  };
}

module.exports = {
  buildInstitutionalIntelligence,
  detectColumnMappings,
};
