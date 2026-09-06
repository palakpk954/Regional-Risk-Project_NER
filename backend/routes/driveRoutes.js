const express = require('express');

const router = express.Router();

const drives = [
  {
    id: 'drv_demo_01',
    driveType: 'Placement',
    name: 'Microsoft',
    role: 'SWE Intern',
    packageLpa: 18,
    stipend: 80000,
    location: 'Bengaluru',
    workType: 'Hybrid',
    minCgpa: 8,
    minAttendance: 75,
    maxBacklogs: 0,
    eligibleBranches: ['CSE', 'IT'],
    requiredSkills: ['DSA', 'React', 'DBMS', 'Git'],
    preferredSkills: ['Docker', 'AWS'],
    hiringRounds: ['Coding Test', 'Technical Interview', 'HR Interview'],
    allowedResumeFormats: ['PDF', 'DOCX'],
    deadline: '2026-06-15',
    openings: 24,
    status: 'Open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function makeId() {
  return `drv_${Math.random().toString(36).slice(2, 10)}`;
}

function splitList(value, fallback = []) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  const parsed = String(value || '')
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : fallback;
}

function normalizeDrive(payload = {}, existing = {}) {
  const now = new Date().toISOString();
  return {
    ...existing,
    id: existing.id || payload.id || makeId(),
    driveType: payload.driveType || existing.driveType || 'Placement',
    name: String(payload.name || payload.company || existing.name || '').trim(),
    logoUrl: String(payload.logoUrl || existing.logoUrl || '').trim(),
    role: String(payload.role || existing.role || '').trim(),
    description: String(payload.description || existing.description || '').trim(),
    packageLpa: Number(payload.packageLpa ?? payload.package ?? existing.packageLpa ?? existing.package ?? 0),
    stipend: Number(payload.stipend ?? existing.stipend ?? 0),
    location: String(payload.location || existing.location || 'Campus').trim(),
    workType: payload.workType || existing.workType || 'Onsite',
    minCgpa: Number(payload.minCgpa ?? payload.eligibility ?? existing.minCgpa ?? existing.eligibility ?? 0),
    minAttendance: Number(payload.minAttendance ?? existing.minAttendance ?? 75),
    maxBacklogs: Number(payload.maxBacklogs ?? existing.maxBacklogs ?? 0),
    batchYear: String(payload.batchYear || existing.batchYear || '2025'),
    eligibleBranches: splitList(payload.eligibleBranches ?? payload.branch ?? existing.eligibleBranches, ['All']),
    genderPreference: payload.genderPreference || existing.genderPreference || 'Any',
    degreeType: payload.degreeType || existing.degreeType || 'B.Tech',
    internshipDuration: payload.internshipDuration || existing.internshipDuration || '',
    bondInfo: payload.bondInfo || existing.bondInfo || 'No bond',
    requiredSkills: splitList(payload.requiredSkills ?? existing.requiredSkills),
    preferredSkills: splitList(payload.preferredSkills ?? existing.preferredSkills),
    preferredCertifications: splitList(payload.preferredCertifications ?? existing.preferredCertifications),
    preferredTechnologies: splitList(payload.preferredTechnologies ?? existing.preferredTechnologies),
    hiringRounds: splitList(payload.hiringRounds ?? existing.hiringRounds, ['Aptitude', 'Technical Interview', 'HR Interview']),
    deadline: payload.deadline || existing.deadline || '',
    scheduledAt: payload.scheduledAt || existing.scheduledAt || '',
    openings: Number(payload.openings ?? existing.openings ?? 1),
    allowedResumeFormats: splitList(payload.allowedResumeFormats ?? existing.allowedResumeFormats, ['PDF', 'DOCX']),
    internshipPreference: payload.internshipPreference || existing.internshipPreference || 'Preferred',
    status: payload.status || existing.status || 'Open',
    createdAt: existing.createdAt || payload.createdAt || now,
    updatedAt: now,
  };
}

function validateDrive(drive) {
  if (!drive.name) return 'Company name is required.';
  if (!drive.role) return 'Role is required.';
  if (!drive.deadline) return 'Application deadline is required.';
  if (!drive.requiredSkills.length) return 'At least one required skill is required.';
  return null;
}

router.get('/', (req, res) => {
  res.json({ drives });
});

router.post('/', (req, res) => {
  const drive = normalizeDrive(req.body);
  const error = validateDrive(drive);
  if (error) return res.status(400).json({ message: error });

  drives.unshift(drive);
  return res.status(201).json({ drive, drives });
});

router.put('/:id', (req, res) => {
  const index = drives.findIndex((drive) => drive.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Drive not found.' });

  const drive = normalizeDrive(req.body, drives[index]);
  const error = validateDrive(drive);
  if (error) return res.status(400).json({ message: error });

  drives[index] = drive;
  return res.json({ drive, drives });
});

router.post('/:id/duplicate', (req, res) => {
  const existing = drives.find((drive) => drive.id === req.params.id);
  if (!existing) return res.status(404).json({ message: 'Drive not found.' });

  const copy = normalizeDrive({ ...existing, id: makeId(), role: `${existing.role} Copy`, status: 'Draft' });
  drives.unshift(copy);
  return res.status(201).json({ drive: copy, drives });
});

router.delete('/:id', (req, res) => {
  const index = drives.findIndex((drive) => drive.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Drive not found.' });
  drives.splice(index, 1);
  return res.json({ drives });
});

module.exports = router;
