import { getCompanyById } from './companyService';
import { loadDb, makeId, saveDb } from './dbService';
import { calculateJobMatch } from './jobMatchService';
import { getStudentById } from './studentService';
import { assertValidTransition } from './workflowService';

export function listApplications() {
  return loadDb().applications;
}

function isEligible(student, company) {
  if (!student || !company) return false;
  const status = String(company.status || 'Open').toLowerCase();
  if (['closed', 'archived', 'draft'].includes(status)) return false;

  const branches = Array.isArray(company.eligibleBranches)
    ? company.eligibleBranches
    : String(company.branch || 'All').split(/[,;/|]/).map((item) => item.trim()).filter(Boolean);
  const normalizedBranches = branches.map((branch) => branch.toLowerCase());
  const studentBranch = String(student.branch || '').toLowerCase();

  const branchOk = normalizedBranches.includes('all') || normalizedBranches.includes(studentBranch);
  const cgpaOk = Number(student.cgpa || 0) >= Number(company.minCgpa ?? company.eligibility ?? 0);
  const attendanceOk = Number(student.attendance ?? 100) >= Number(company.minAttendance ?? 0);
  const backlogOk = Number(student.activeBacklogs ?? 0) <= Number(company.maxBacklogs ?? 99);

  return branchOk && cgpaOk && attendanceOk && backlogOk;
}

export function createApplication(studentId, companyId) {
  const db = loadDb();
  const student = getStudentById(studentId);
  const company = getCompanyById(companyId);

  if (!student || !company) {
    return { ok: false, error: 'Student or company not found.' };
  }

  if (!isEligible(student, company)) {
    return { ok: false, error: 'Student is not eligible for this company.' };
  }

  const duplicate = db.applications.some(
    (application) => application.studentId === studentId && application.companyId === companyId,
  );
  if (duplicate) {
    return { ok: false, error: 'Application already exists for this student and company.' };
  }

  const application = {
    id: makeId('app'),
    studentId,
    companyId,
    status: 'Applied',
    matchScore: calculateJobMatch(student, company).matchScore,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nextDb = saveDb({ ...db, applications: [application, ...db.applications] });
  return { ok: true, data: nextDb.applications };
}

export function updateApplicationStatus(applicationId, nextStatus, actorRole = 'admin') {
  if (actorRole !== 'admin') {
    return { ok: false, error: 'Only admin can update application status.' };
  }

  const db = loadDb();
  const target = db.applications.find((item) => item.id === applicationId);
  if (!target) {
    return { ok: false, error: 'Application not found.' };
  }

  const validation = assertValidTransition(target.status, nextStatus);
  if (!validation.ok) {
    return validation;
  }

  const nextApplications = db.applications.map((item) =>
    item.id === applicationId ? { ...item, status: nextStatus } : item,
  );

  const nextDb = saveDb({ ...db, applications: nextApplications });
  return { ok: true, data: nextDb.applications };
}

export function listApplicationsByStudent(studentId) {
  return loadDb().applications.filter((item) => item.studentId === studentId);
}
