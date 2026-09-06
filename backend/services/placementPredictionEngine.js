function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function list(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '').split(/[,;|/]/).map((item) => item.trim()).filter(Boolean);
}

function count(value) {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'string') return list(value).length;
  return toNumber(value, 0);
}

function overlap(source, target) {
  if (!target.length) return 1;
  const set = new Set(source.map((item) => item.toLowerCase()));
  return target.filter((item) => set.has(item.toLowerCase())).length / target.length;
}

function predictPlacement({ student = {}, job = {} }) {
  const skills = list(student.skills || student.technologies);
  const requiredSkills = list(job.requiredSkills || job.skills);
  const preferredSkills = list(job.preferredSkills);
  const cgpa = clamp(toNumber(student.cgpa, 0), 0, 10);
  const minimumCgpa = toNumber(job.minimumCgpa ?? job.minCgpa ?? job.eligibility, 0);
  const resumeScore = clamp(toNumber(student.resumeScore || student.atsScore, 58), 0, 100);
  const internships = count(student.internships);
  const projects = count(student.projects || student.no_of_projects);
  const dsaScore = toNumber(student.dsaScore, skills.some((skill) => skill.toLowerCase() === 'dsa') ? 75 : 45);
  const interviewPerformance = toNumber(student.interviewPerformance, 58);
  const profileCompletion = toNumber(student.profileCompletion, 72);

  const breakdown = {
    skillsMatch: Math.round((overlap(skills, requiredSkills) * 76) + (overlap(skills, preferredSkills) * 24)),
    cgpaMatch: Math.round(minimumCgpa ? clamp((cgpa / minimumCgpa) * 100, 0, 100) : cgpa * 10),
    resumeQuality: Math.round(resumeScore),
    internshipMatch: Math.round(clamp(internships * 45, 0, 100)),
    projectRelevance: Math.round(clamp(projects * 24 + overlap(skills, requiredSkills) * 28, 0, 100)),
    selectionPerformance: Math.round(clamp(dsaScore * 0.56 + interviewPerformance * 0.44, 0, 100)),
    engagement: Math.round(clamp(profileCompletion, 0, 100)),
  };

  const ruleScore = Math.round(
    breakdown.skillsMatch * 0.24 +
      breakdown.cgpaMatch * 0.16 +
      breakdown.resumeQuality * 0.16 +
      breakdown.internshipMatch * 0.13 +
      breakdown.projectRelevance * 0.13 +
      breakdown.selectionPerformance * 0.11 +
      breakdown.engagement * 0.07,
  );

  const treeVotes = [
    breakdown.skillsMatch * 0.32 + breakdown.cgpaMatch * 0.2 + breakdown.selectionPerformance * 0.23 + breakdown.internshipMatch * 0.25,
    breakdown.resumeQuality * 0.28 + breakdown.projectRelevance * 0.27 + breakdown.skillsMatch * 0.25 + breakdown.engagement * 0.2,
    ruleScore * 0.42 + breakdown.selectionPerformance * 0.25 + breakdown.cgpaMatch * 0.18 + breakdown.resumeQuality * 0.15,
  ];

  const roleCompatibilityScore = Math.round(treeVotes.reduce((sum, vote) => sum + vote, 0) / treeVotes.length);
  const shortlistedProbability = Math.round(clamp(roleCompatibilityScore * 0.9 + breakdown.cgpaMatch * 0.1, 3, 98));
  const placementProbability = Math.round(clamp(roleCompatibilityScore * 0.78 + breakdown.selectionPerformance * 0.14 + breakdown.internshipMatch * 0.08, 2, 96));
  const missingSkills = requiredSkills.filter((skill) => !skills.some((studentSkill) => studentSkill.toLowerCase() === skill.toLowerCase()));
  const missingPreferred = preferredSkills.filter((skill) => !skills.some((studentSkill) => studentSkill.toLowerCase() === skill.toLowerCase()));

  const explanations = [];
  if (breakdown.cgpaMatch >= 90) explanations.push('CGPA strongly matches company criteria.');
  if (breakdown.skillsMatch < 70) explanations.push('Role-specific skill coverage reduced the score.');
  if (breakdown.internshipMatch < 50) explanations.push('No or limited internship experience reduced prediction confidence.');
  if (breakdown.resumeQuality < 70) explanations.push('Resume quality and ATS keywords need improvement.');
  if (missingSkills.length) explanations.push(`Missing required skills: ${missingSkills.slice(0, 3).join(', ')}.`);

  const weakAreas = [
    breakdown.skillsMatch < 70 ? 'Required skill coverage' : null,
    breakdown.resumeQuality < 70 ? 'ATS resume quality' : null,
    breakdown.projectRelevance < 72 ? 'Role-aligned projects' : null,
    breakdown.internshipMatch < 55 ? 'Industry experience' : null,
    breakdown.selectionPerformance < 68 ? 'DSA and interview performance' : null,
  ].filter(Boolean);

  const suggestions = [
    ...missingSkills.slice(0, 3).map((skill) => `Learn ${skill} and prove it in a project.`),
    ...missingPreferred.slice(0, 2).map((skill) => `Add basic ${skill} exposure for a stronger preferred-skill match.`),
    breakdown.resumeQuality < 72 ? 'Improve ATS keywords and resume structure.' : null,
    breakdown.projectRelevance < 72 ? 'Add a project directly aligned with this role.' : null,
    breakdown.internshipMatch < 55 ? 'Add internship, open-source, freelance, or hackathon proof.' : null,
  ].filter(Boolean);

  return {
    probability: placementProbability,
    riskCategory: placementProbability >= 72 ? 'High Chance' : placementProbability >= 46 ? 'Medium' : 'At Risk',
    matchScore: roleCompatibilityScore,
    hiringProbability: placementProbability,
    ruleScore,
    shortlistedProbability,
    placementProbability,
    roleCompatibilityScore,
    readinessScore: Math.round((ruleScore + roleCompatibilityScore) / 2),
    breakdown,
    scoreBreakdown: breakdown,
    missingSkills,
    missingPreferred,
    weakAreas,
    suggestions,
    suggestedImprovements: suggestions,
    explanations,
    confidence: Math.round(clamp(62 + skills.length * 2 + projects * 3 + internships * 4, 52, 92)),
    modelUsed: 'rules-fallback-v1',
  };
}

function buildPredictionSummary() {
  return {
    activeModel: 'rules-fallback-v1',
    preferredModel: 'catboost-tabular-v1',
    catBoost: {
      provider: 'CatBoost (Yandex)',
      status: 'optional',
      reason: 'Use the Python ML API when CatBoost artifacts are available; otherwise rules fallback keeps demo predictions working.',
    },
    features: [
      'CGPA',
      'attendance',
      'activeBacklogs',
      'branch',
      'ATS score',
      'aptitude score',
      'communication score',
      'projects',
      'internships',
      'skills count',
      'applications count',
    ],
    explanation:
      'Placify combines tabular ML readiness with transparent weighted scoring so every probability can be explained in viva.',
  };
}

module.exports = {
  buildPredictionSummary,
  predictPlacement,
};
