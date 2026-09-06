const REQUIRED_CAMPUS_COLUMNS = [
  'name',
  'branch',
  'cgpa',
  'status',
];

const STUDENT_NUMERIC_FIELDS = [
  'tier',
  'cgpa',
  'inter_gpa',
  'ssc_gpa',
  'internships',
  'no_of_projects',
  'is_participate_hackathon',
  'is_participated_extracurricular',
  'no_of_programming_languages',
  'dsa',
  'mobile_dev',
  'web_dev',
  'machine_learning',
  'cloud',
];

function normalizeText(value) {
  return String(value ?? '').trim();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeCampusRows(rows) {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => ({
      s_id: toNumber(row.s_id || row.sid || row.id, 0),
      name: normalizeText(row.name || row.studentName || row.student || row.candidate),
      tier: toNumber(row.tier, 2),
      gender: normalizeText(row.gender || 'Unknown'),
      branch: normalizeText(row.branch || row.department || row.stream || 'Unknown'),
      cgpa: toNumber(row.cgpa || row.gpa || row.grade || 0),
      inter_gpa: toNumber(row.inter_gpa || row.interGpa || row.inter || 0),
      ssc_gpa: toNumber(row.ssc_gpa || row.sscGpa || row.ssc || 0),
      status: normalizeText(row.status || row.result || row.outcome || 'Applied'),
      company: normalizeText(row.company || row.organization || row.employer || 'Unassigned'),
      package: toNumber(row.package || row.ctc || row.salary || 0),
      internships: toNumber(row.internships || row.internship_months || 0),
      no_of_projects: toNumber(row.no_of_projects || row.projects || 0),
      is_participate_hackathon: toNumber(row.is_participate_hackathon || row.hackathon || 0),
      is_participated_extracurricular: toNumber(row.is_participated_extracurricular || row.extracurricular || 0),
      no_of_programming_languages: toNumber(row.no_of_programming_languages || row.languages || 0),
      dsa: toNumber(row.dsa || 0),
      mobile_dev: toNumber(row.mobile_dev || row.mobile || 0),
      web_dev: toNumber(row.web_dev || 0),
      machine_learning: toNumber(row.machine_learning || row['Machine Learning'] || 0),
      cloud: toNumber(row.cloud || 0),
      other_skills: normalizeText(row.other_skills || row.skills || ''),
      is_placed: toNumber(row.is_placed, NaN),
    }))
    .filter((row) => row.name || row.company !== 'Unassigned');
}

export function validateCampusInputRows(rows) {
  const normalized = normalizeCampusRows(rows);

  if (!normalized.length) {
    return {
      ok: false,
      error: 'No valid rows found. Upload CSV with at least student name/branch/cgpa/status columns.',
    };
  }

  const missing = REQUIRED_CAMPUS_COLUMNS.filter((key) => !normalized.some((row) => normalizeText(row[key])));
  if (missing.length) {
    return {
      ok: false,
      error: `Missing required columns: ${missing.join(', ')}.`,
    };
  }

  return { ok: true, rows: normalized };
}

export function normalizeStudentPredictionInput(input = {}) {
  const model = {
    tier: 2,
    cgpa: 0,
    inter_gpa: 0,
    ssc_gpa: 0,
    internships: 0,
    no_of_projects: 0,
    is_participate_hackathon: 0,
    is_participated_extracurricular: 0,
    no_of_programming_languages: 0,
    dsa: 0,
    mobile_dev: 0,
    web_dev: 0,
    machine_learning: 0,
    cloud: 0,
    branch: normalizeText(input.branch || 'CSE') || 'CSE',
  };

  STUDENT_NUMERIC_FIELDS.forEach((field) => {
    model[field] = toNumber(input[field], model[field]);
  });

  model.cgpa = Math.max(0, Math.min(10, model.cgpa));
  model.inter_gpa = Math.max(0, Math.min(10, model.inter_gpa));
  model.ssc_gpa = Math.max(0, Math.min(10, model.ssc_gpa));

  return model;
}

export function toDonorModelPayload(model) {
  return {
    tier: model.tier,
    cgpa: model.cgpa,
    inter_gpa: model.inter_gpa,
    ssc_gpa: model.ssc_gpa,
    internships: model.internships,
    no_of_projects: model.no_of_projects,
    is_participate_hackathon: model.is_participate_hackathon,
    is_participated_extracurricular: model.is_participated_extracurricular,
    no_of_programming_languages: model.no_of_programming_languages,
    dsa: model.dsa,
    mobile_dev: model.mobile_dev,
    web_dev: model.web_dev,
    'Machine Learning': model.machine_learning,
    cloud: model.cloud,
    branch: model.branch,
  };
}
