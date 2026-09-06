import axios from 'axios';
import {
  normalizeCampusRows,
  normalizeStudentPredictionInput,
  toDonorModelPayload,
  validateCampusInputRows,
} from './predictionContracts';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: `${BACKEND_BASE}/api/ml`,
  timeout: 12000,
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeRate(part, total) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

function normalizeStatus(value) {
  const key = String(value || '').toLowerCase();
  if (key.includes('unplaced') || key.includes('not placed') || key.includes('reject')) return 'Rejected';
  if (key.includes('select') || key.includes('place') || key.includes('hire') || key.includes('offer')) return 'Selected';
  if (key.includes('interview') || key.includes('shortlist')) return 'Interview';
  return 'Applied';
}

function scoreContribution(label, value) {
  return { label, value: Number(value.toFixed(1)) };
}


function localStudentPredict(input) {
  const model = normalizeStudentPredictionInput(input);

  const tierBonus = model.tier <= 1 ? 10 : model.tier === 2 ? 5 : 0;
  const contributions = [
    scoreContribution('CGPA', model.cgpa * 7.5),
    scoreContribution('Internships', model.internships * 4),
    scoreContribution('Projects', model.no_of_projects * 2.8),
    scoreContribution('Programming Languages', model.no_of_programming_languages * 1.7),
    scoreContribution('DSA', model.dsa ? 9 : 0),
    scoreContribution('Web Development', model.web_dev ? 7 : 0),
    scoreContribution('Machine Learning', model.machine_learning ? 6 : 0),
    scoreContribution('Cloud', model.cloud ? 5 : 0),
    scoreContribution('Hackathon', model.is_participate_hackathon ? 3 : 0),
    scoreContribution('Extracurricular', model.is_participated_extracurricular ? 2 : 0),
    scoreContribution('Tier Advantage', tierBonus),
  ];

  const rawScore = contributions.reduce((sum, item) => sum + item.value, 0);
  const placementProbability = clamp(Number((rawScore / 1.6).toFixed(1)), 5, 98);
  const predictedSalary = Number(
    (2.4 + placementProbability / 20 + model.internships * 0.35 + model.no_of_projects * 0.18 + model.machine_learning * 0.6).toFixed(2),
  );

  const sortedFactors = [...contributions]
    .sort((a, b) => b.value - a.value)
    .filter((item) => item.value > 0)
    .slice(0, 4)
    .map((item) => item.label);

  return {
    is_placed: placementProbability >= 55 ? 1 : 0,
    placement_probability: placementProbability,
    predicted_salary: predictedSalary,
    top_improvement_factors: sortedFactors,
    model_used: 'local-fallback-v1',
  };
}

function localCampusPredict(rows) {
  const validation = validateCampusInputRows(rows);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const normalized = validation.rows;
  const placedRows = normalized.filter((row) => normalizeStatus(row.status) === 'Selected');
  const avgCgpaPlaced = placedRows.length
    ? Number((placedRows.reduce((sum, row) => sum + row.cgpa, 0) / placedRows.length).toFixed(2))
    : 0;

  const byBranchMap = new Map();
  normalized.forEach((row) => {
    const key = row.branch || 'Unknown';
    if (!byBranchMap.has(key)) {
      byBranchMap.set(key, { branch: key, total: 0, placed: 0, avgPackage: 0, packageCount: 0, packageSum: 0 });
    }

    const target = byBranchMap.get(key);
    target.total += 1;
    if (normalizeStatus(row.status) === 'Selected') target.placed += 1;
    if (row.package > 0) {
      target.packageCount += 1;
      target.packageSum += row.package;
    }
  });

  const branch_breakdown = Array.from(byBranchMap.values())
    .map((item) => ({
      branch: item.branch,
      total: item.total,
      placed: item.placed,
      placement_rate: safeRate(item.placed, item.total),
      avg_package: item.packageCount ? Number((item.packageSum / item.packageCount).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.placement_rate - a.placement_rate || b.placed - a.placed);

  const companyMap = new Map();
  normalized.forEach((row) => {
    const name = row.company || 'Unassigned';
    if (name === 'Unassigned') return;
    if (!companyMap.has(name)) {
      companyMap.set(name, { company: name, applicants: 0, selected: 0 });
    }
    const target = companyMap.get(name);
    target.applicants += 1;
    if (normalizeStatus(row.status) === 'Selected') target.selected += 1;
  });

  const top_companies = Array.from(companyMap.values())
    .map((item) => ({
      ...item,
      conversion_rate: safeRate(item.selected, item.applicants),
    }))
    .sort((a, b) => b.selected - a.selected)
    .slice(0, 8);

  const salary_distribution = {
    '0-5': 0,
    '5-10': 0,
    '10-20': 0,
    '20+': 0,
  };

  normalized.forEach((row) => {
    const pkg = Number(row.package || 0);
    if (pkg <= 0) return;
    if (pkg < 5) salary_distribution['0-5'] += 1;
    else if (pkg < 10) salary_distribution['5-10'] += 1;
    else if (pkg < 20) salary_distribution['10-20'] += 1;
    else salary_distribution['20+'] += 1;
  });

  const skillsImpact = [
    { label: 'DSA', placedShare: safeRate(placedRows.filter((row) => row.dsa > 0).length, placedRows.length) },
    { label: 'Web Dev', placedShare: safeRate(placedRows.filter((row) => row.web_dev > 0).length, placedRows.length) },
    { label: 'Machine Learning', placedShare: safeRate(placedRows.filter((row) => row.machine_learning > 0).length, placedRows.length) },
    { label: 'Cloud', placedShare: safeRate(placedRows.filter((row) => row.cloud > 0).length, placedRows.length) },
  ];

  const top_factors_affecting_placements = [
    `Average CGPA among placed students is ${avgCgpaPlaced}`,
    `Top branch by placement rate: ${branch_breakdown[0]?.branch || 'N/A'}`,
    `Top company by selections: ${top_companies[0]?.company || 'N/A'}`,
    `${placedRows.length} of ${normalized.length} students are currently marked selected.`,
  ];

  return {
    total_no_of_students: normalized.length,
    total_placed: placedRows.length,
    total_not_placed: normalized.length - placedRows.length,
    placement_rate: safeRate(placedRows.length, normalized.length),
    top_factors_affecting_placements,
    imp_technical_skills: skillsImpact.filter((item) => item.placedShare >= 40).map((item) => item.label),
    highest_sal_in_each_branch: branch_breakdown,
    salary_distribution,
    top_companies,
    average_cgpa_placed: avgCgpaPlaced,
    source: 'local-fallback-v1',
  };
}

function localRecommendSkills(input) {
  const model = normalizeStudentPredictionInput(input);
  const missing = [];

  if (!model.dsa) missing.push('Data Structures and Algorithms');
  if (!model.web_dev) missing.push('Web Development Projects');
  if (!model.machine_learning) missing.push('Machine Learning Fundamentals');
  if (!model.cloud) missing.push('Cloud Basics (AWS/Azure/GCP)');
  if (model.no_of_projects < 3) missing.push('Build more portfolio projects');
  if (model.internships < 1) missing.push('Industry internship experience');

  return {
    recommended_skills: missing.slice(0, 6),
    source: 'local-fallback-v1',
  };
}

export async function predictCampusPlacements(rows, options = {}) {
  const payloadRows = normalizeCampusRows(rows);
  const shouldUseBackend = options.preferBackend !== false;

  if (shouldUseBackend) {
    try {
      const { data } = await api.post('/campus-predict', { rows: payloadRows });
      return data;
    } catch {
      return localCampusPredict(payloadRows);
    }
  }

  return localCampusPredict(payloadRows);
}

export async function predictStudentPlacement(input, options = {}) {
  const model = normalizeStudentPredictionInput(input);
  const shouldUseBackend = options.preferBackend !== false;

  if (shouldUseBackend) {
    try {
      const { data } = await api.post('/student-predict', toDonorModelPayload(model));
      return {
        is_placed: Number(data.is_placed || 0),
        placement_probability: Number(data.placement_probability || 0),
        predicted_salary: Number(data.predicted_salary || 0),
        top_improvement_factors: Array.isArray(data.top_improvement_factors) ? data.top_improvement_factors : [],
        model_used: data.model_used || 'backend-ml',
      };
    } catch {
      return localStudentPredict(model);
    }
  }

  return localStudentPredict(model);
}

export async function recommendSkills(input, options = {}) {
  const model = normalizeStudentPredictionInput(input);
  const shouldUseBackend = options.preferBackend !== false;

  if (shouldUseBackend) {
    try {
      const { data } = await api.post('/recommend-skills', toDonorModelPayload(model));
      return {
        recommended_skills: Array.isArray(data.recommended_skills) ? data.recommended_skills : [],
        source: data.source || 'backend-ml',
      };
    } catch {
      return localRecommendSkills(model);
    }
  }

  return localRecommendSkills(model);
}

export async function predictPlacementMatch({ student, job }, options = {}) {
  const shouldUseBackend = options.preferBackend !== false;

  if (shouldUseBackend) {
    try {
      const { data } = await api.post('/placement-predict', { student, job });
      return data;
    } catch {
      // UI pages use the local explainable engine as the fallback path.
    }
  }

  return null;
}

export async function parseResumeSignals(file) {
  if (!file) {
    throw new Error('Resume file is required.');
  }

  const formData = new FormData();
  formData.append('resume', file);

  try {
    const { data } = await api.post('/resume-parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      inferred_name: data.inferred_name || file?.name?.replace(/\.[^.]+$/, '') || 'Student Candidate',
      inferred_branch: data.inferred_branch || 'CSE',
      flags: {
        dsa: Number(data.flags?.dsa || 0),
        web_dev: Number(data.flags?.web_dev || 0),
        machine_learning: Number(data.flags?.machine_learning || 0),
        cloud: Number(data.flags?.cloud || 0),
      },
      skills: Array.isArray(data.skills) ? data.skills : [],
      technologies: Array.isArray(data.technologies) ? data.technologies : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      github: data.github || '',
      linkedin: data.linkedin || '',
      codingProfiles: Array.isArray(data.codingProfiles) ? data.codingProfiles : [],
      links: Array.isArray(data.links) ? data.links : [],
      resumeScore: Number(data.resumeScore || 0),
      atsScore: Number(data.atsScore || 0),
      keywordScore: Number(data.keywordScore || 0),
      formattingScore: Number(data.formattingScore || 0),
      resumeCompletenessScore: Number(data.resumeCompletenessScore || 0),
      projectQualityScore: Number(data.projectQualityScore || 0),
      roleAlignmentScore: Number(data.roleAlignmentScore || 0),
      internships: Number(data.internships || 0),
      no_of_projects: Number(data.no_of_projects || 0),
      no_of_programming_languages: Number(data.no_of_programming_languages || 3),
      source: data.source || 'resume-content-parser-v1',
    };
  } catch (error) {
    const message = error?.response?.data?.message || 'Could not parse resume from file content.';
    throw new Error(message);
  }
}

export async function getOcrStatus() {
  try {
    const { data } = await api.get('/ocr-status');
    return data;
  } catch {
    return {
      available: false,
      engine: 'PaddleOCR',
      mode: 'unknown',
      note: 'Backend OCR status endpoint is unavailable.',
    };
  }
}

export async function scoreResumeAts({ file, jobDescription, targetRole }, options = {}) {
  const shouldUseBackend = options.preferBackend !== false;

  if (shouldUseBackend) {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', String(jobDescription || ''));
      formData.append('targetRole', String(targetRole || ''));

      const { data } = await api.post('/ats-score', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return data;
    } catch (error) {
      const message = error?.response?.data?.message || 'ATS scoring is unavailable right now.';
      throw new Error(message);
    }
  }

  throw new Error('Backend ATS scorer is required.');
}

export async function optimizeResumeWithOssPipeline({ file, jobDescription, targetRole }, options = {}) {
  const shouldUseBackend = options.preferBackend !== false;

  if (!file) {
    throw new Error('Resume file is required.');
  }

  if (!String(jobDescription || '').trim()) {
    throw new Error('Job description is required for optimization.');
  }

  if (shouldUseBackend) {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', String(jobDescription || ''));
      formData.append('targetRole', String(targetRole || ''));

      const { data } = await api.post('/resume-optimize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return data;
    } catch (error) {
      const message = error?.response?.data?.message || 'Resume optimization pipeline is unavailable right now.';
      throw new Error(message);
    }
  }

  throw new Error('Backend pipeline required for OSS resume optimization.');
}
