const DEFAULT_ML_API_URL = 'http://127.0.0.1:8000';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function count(value) {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'string') {
    return value.split(/[,;|/]/).map((item) => item.trim()).filter(Boolean).length;
  }
  return toNumber(value, 0);
}

function buildMlPayload(student = {}) {
  return {
    cgpa: toNumber(student.cgpa, 0),
    attendance: toNumber(student.attendance, 75),
    active_backlogs: toNumber(student.activeBacklogs ?? student.active_backlogs ?? student.backlogs, 0),
    branch: String(student.branch || 'CSE'),
    ats_score: toNumber(student.atsScore ?? student.ats_score ?? student.resumeScore, 60),
    aptitude_score: toNumber(student.aptitudeScore ?? student.aptitude_score, 55),
    communication_score: toNumber(student.communicationScore ?? student.communication_score, 55),
    projects: count(student.projects ?? student.no_of_projects),
    internships: count(student.internships),
    skills_count: count(student.skills || student.technologies || student.requiredSkills),
    applications_count: toNumber(student.applicationsCount ?? student.applications ?? student.applicationCount, 0),
  };
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 2500);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`ML API returned ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function getMlStatus() {
  const baseUrl = process.env.ML_API_URL || DEFAULT_ML_API_URL;
  try {
    return await fetchJson(`${baseUrl}/prediction/status`, { timeoutMs: 2200 });
  } catch (error) {
    return {
      preferred_model: 'catboost-tabular-v1',
      active_model: 'rules-fallback-v1',
      catboost_available: false,
      catboost_artifact_present: false,
      fallback_ready: true,
      error: error.message,
    };
  }
}

async function predictWithMl(student = {}) {
  const baseUrl = process.env.ML_API_URL || DEFAULT_ML_API_URL;
  const payload = buildMlPayload(student);
  return fetchJson(`${baseUrl}/prediction/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeoutMs: 3000,
  });
}

module.exports = {
  buildMlPayload,
  getMlStatus,
  predictWithMl,
};
