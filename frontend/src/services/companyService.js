import { loadDb, makeId, saveDb } from './dbService';

const splitList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

function normalizeCompany(payload) {
  const requiredSkills = splitList(payload.requiredSkills || payload.skills);
  const preferredSkills = splitList(payload.preferredSkills);
  const preferredCertifications = splitList(payload.preferredCertifications);
  const preferredTechnologies = splitList(payload.preferredTechnologies);
  const eligibleBranches = splitList(payload.eligibleBranches || payload.branch || 'All');
  const hiringRounds = splitList(payload.hiringRounds || payload.rounds);
  const allowedResumeFormats = splitList(payload.allowedResumeFormats || 'PDF,DOCX');
  const now = new Date().toISOString();

  return {
    id: payload.id || makeId('cmp'),
    name: String(payload.name || '').trim(),
    company: String(payload.name || '').trim(),
    logoUrl: String(payload.logoUrl || payload.companyLogo || '').trim(),
    role: String(payload.role || '').trim(),
    driveType: payload.driveType || 'Placement',
    description: String(payload.description || '').trim(),
    package: Number(payload.package || payload.packageLpa || 0),
    packageLpa: Number(payload.package || payload.packageLpa || 0),
    stipend: Number(payload.stipend || 0),
    location: String(payload.location || 'Jaipur').trim(),
    workType: payload.workType || 'Onsite',
    eligibility: Number(payload.eligibility || payload.minCgpa || 0),
    minCgpa: Number(payload.eligibility || payload.minCgpa || 0),
    minAttendance: Number(payload.minAttendance || 75),
    maxBacklogs: Number(payload.maxBacklogs || 0),
    batchYear: String(payload.batchYear || '2025'),
    deadline: payload.deadline || '',
    scheduledAt: payload.scheduledAt || '',
    branch: eligibleBranches.length ? eligibleBranches.join(', ') : 'All',
    eligibleBranches,
    genderPreference: payload.genderPreference || 'Any',
    degreeType: payload.degreeType || 'B.Tech',
    internshipDuration: payload.internshipDuration || '',
    bondInfo: payload.bondInfo || 'No bond',
    openings: Number(payload.openings || 1),
    requiredSkills,
    preferredSkills,
    preferredCertifications,
    preferredTechnologies,
    internshipPreference: payload.internshipPreference || 'Preferred',
    hiringRounds: hiringRounds.length ? hiringRounds : ['Aptitude', 'Technical Interview', 'HR Interview'],
    allowedResumeFormats,
    status: payload.status || 'Open',
    createdAt: payload.createdAt || now,
    updatedAt: now,
  };
}

export function listCompanies() {
  return loadDb().companies;
}

export function getCompanyById(companyId) {
  return loadDb().companies.find((item) => item.id === companyId) || null;
}

export function createCompany(payload) {
  const db = loadDb();
  const company = normalizeCompany(payload);

  if (!company.name || !company.role) {
    return { ok: false, error: 'Company name and role are required.' };
  }

  const duplicate = db.companies.some(
    (item) => item.name.toLowerCase() === company.name.toLowerCase() && item.role.toLowerCase() === company.role.toLowerCase(),
  );
  if (duplicate) {
    return { ok: false, error: 'Company with same role already exists.' };
  }

  const nextDb = saveDb({ ...db, companies: [company, ...db.companies] });
  return { ok: true, data: nextDb.companies, company };
}

export function updateCompany(companyId, payload) {
  const db = loadDb();
  const existing = db.companies.find((item) => item.id === companyId);
  if (!existing) return { ok: false, error: 'Opening not found.' };

  const company = normalizeCompany({ ...existing, ...payload, id: companyId, createdAt: existing.createdAt });
  if (!company.name || !company.role) {
    return { ok: false, error: 'Company name and role are required.' };
  }

  const nextCompanies = db.companies.map((item) => (item.id === companyId ? company : item));
  const nextDb = saveDb({ ...db, companies: nextCompanies });
  return { ok: true, data: nextDb.companies, company };
}

export function deleteCompany(companyId) {
  const db = loadDb();
  const exists = db.companies.some((item) => item.id === companyId);
  if (!exists) return { ok: false, error: 'Opening not found.' };

  const nextDb = saveDb({
    ...db,
    companies: db.companies.filter((item) => item.id !== companyId),
    applications: db.applications.filter((item) => item.companyId !== companyId),
  });
  return { ok: true, data: nextDb.companies };
}

export function duplicateCompany(companyId) {
  const db = loadDb();
  const existing = db.companies.find((item) => item.id === companyId);
  if (!existing) return { ok: false, error: 'Opening not found.' };

  const duplicate = normalizeCompany({
    ...existing,
    id: makeId('cmp'),
    role: `${existing.role} Copy`,
    status: 'Draft',
    createdAt: new Date().toISOString(),
  });
  const nextDb = saveDb({ ...db, companies: [duplicate, ...db.companies] });
  return { ok: true, data: nextDb.companies, company: duplicate };
}
