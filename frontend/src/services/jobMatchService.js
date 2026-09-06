const SKILL_LIBRARY = {
  cse: ['DSA', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
  it: ['DSA', 'Python', 'SQL', 'Cloud', 'React', 'Git'],
  ece: ['C', 'Python', 'Embedded Systems', 'IoT', 'Communication'],
  default: ['Communication', 'Problem Solving', 'Excel'],
};

const WEIGHTS = {
  skills: 0.24,
  academics: 0.16,
  resume: 0.16,
  experience: 0.13,
  projects: 0.13,
  performance: 0.11,
  engagement: 0.07,
};

export function parseSkillList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(/[,;|/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function inferStudentProfile(student = {}) {
  const cgpa = clamp(Number(student.cgpa || 0), 0, 10);
  const branch = String(student.branch || 'CSE');
  const skills = parseSkillList(student.skills || student.skillset || student.technologies);
  const fallbackSkills = inferSkillsFromBranch(branch, cgpa);
  const projects = Number(student.projects ?? student.no_of_projects ?? (cgpa >= 8 ? 3 : cgpa >= 7 ? 2 : 1));
  const internships = Number(student.internships ?? (cgpa >= 8.2 ? 1 : 0));
  const applications = Number(student.applications ?? student.applicationCount ?? 0);
  const resumeScore = Number(student.resumeScore ?? student.atsScore ?? Math.min(92, Math.max(38, Math.round(cgpa * 8.8))));
  const atsScore = Number(student.atsScore ?? Math.round(resumeScore * 0.96));
  const keywordScore = Number(student.keywordScore ?? Math.round(resumeScore * 0.9));
  const formattingScore = Number(student.formattingScore ?? Math.round(resumeScore * 0.94));

  return {
    ...student,
    cgpa,
    tenthPercentage: Number(student.tenthPercentage ?? student.ssc_percentage ?? (student.ssc_gpa ? student.ssc_gpa * 10 : 78)),
    twelfthPercentage: Number(student.twelfthPercentage ?? student.inter_percentage ?? (student.inter_gpa ? student.inter_gpa * 10 : 76)),
    activeBacklogs: Number(student.activeBacklogs ?? student.backlogs ?? 0),
    branch,
    skills: skills.length ? skills : fallbackSkills,
    certifications: parseSkillList(student.certifications || student.certificationList),
    technologies: parseSkillList(student.technologies || student.tools),
    projects,
    projectQualityScore: Number(student.projectQualityScore ?? Math.min(92, 45 + projects * 13)),
    internships,
    freelanceWork: Number(student.freelanceWork ?? 0),
    hackathons: Number(student.hackathons ?? student.is_participate_hackathon ?? 0),
    codingProfiles: Number(student.codingProfiles ?? 0),
    aptitudeScore: Number(student.aptitudeScore ?? Math.min(90, 48 + cgpa * 4)),
    dsaScore: Number(student.dsaScore ?? (hasSkill(skills, 'DSA') || hasSkill(fallbackSkills, 'DSA') ? 76 : 42)),
    interviewPerformance: Number(student.interviewPerformance ?? 58),
    mockInterviewHistory: Number(student.mockInterviewHistory ?? 0),
    profileCompletion: Number(student.profileCompletion ?? calculateProfileCompletion(student)),
    activityLevel: Number(student.activityLevel ?? Math.min(100, 30 + applications * 8 + projects * 9)),
    applications,
    resumeScore,
    atsScore,
    keywordScore,
    formattingScore,
  };
}

export function normalizeJobRequirements(company = {}) {
  return {
    companyName: company.name || 'Company',
    roleName: company.role || 'Role',
    package: Number(company.package || 0),
    minimumCgpa: Number(company.eligibility || company.minimumCgpa || 0),
    eligibleBranches: parseSkillList(company.branch || company.eligibleBranches || 'All'),
    requiredSkills: parseSkillList(company.requiredSkills || company.required_skills || company.skills),
    preferredSkills: parseSkillList(company.preferredSkills || company.preferred_skills),
    preferredCertifications: parseSkillList(company.preferredCertifications || company.certifications),
    preferredTechnologies: parseSkillList(company.preferredTechnologies || company.technologies),
    internshipPreference: String(company.internshipPreference || company.internship_preference || 'Preferred'),
  };
}

export function calculateJobMatch(student, company) {
  const profile = inferStudentProfile(student);
  const job = normalizeJobRequirements(company);
  const branchEligible = isBranchEligible(profile.branch, job.eligibleBranches);

  const skills = scoreSkills(profile, job);
  const academics = scoreAcademics(profile, job, branchEligible);
  const resume = scoreResume(profile, job);
  const experience = scoreExperience(profile, job);
  const projects = scoreProjects(profile, job);
  const performance = scorePerformance(profile);
  const engagement = scoreEngagement(profile);

  const breakdown = {
    skills,
    academics,
    resume,
    experience,
    projects,
    performance,
    engagement,
  };

  const ruleScore = weightedAverage(breakdown);
  const ml = estimateMlPrediction(profile, job, breakdown, ruleScore);
  const matchScore = Math.round(ruleScore * 0.68 + ml.roleCompatibilityScore * 0.32);
  const readinessScore = Math.round(
    resume.score * 0.22 +
      skills.score * 0.24 +
      projects.score * 0.16 +
      experience.score * 0.14 +
      performance.score * 0.16 +
      engagement.score * 0.08,
  );
  const hiringProbability = Math.round(ml.shortlistedProbability * 0.45 + ml.placementProbability * 0.55);

  const missingSkills = job.requiredSkills.filter((skill) => !hasSkill(profile.skills, skill));
  const missingPreferred = [...job.preferredSkills, ...job.preferredTechnologies].filter(
    (skill) => !hasSkill(profile.skills, skill) && !hasSkill(profile.technologies, skill),
  );
  const weakAreas = Object.values(breakdown)
    .filter((item) => item.score < 62)
    .map((item) => item.reason);
  const positiveReasons = Object.values(breakdown)
    .filter((item) => item.score >= 78)
    .map((item) => item.positive);
  const negativeReasons = [
    ...weakAreas,
    ...missingSkills.slice(0, 2).map((skill) => `Missing required skill: ${skill}`),
  ].slice(0, 5);

  return {
    matchScore,
    hiringProbability,
    readinessScore,
    shortlistedProbability: ml.shortlistedProbability,
    placementProbability: ml.placementProbability,
    roleCompatibilityScore: ml.roleCompatibilityScore,
    confidence: ml.confidence,
    modelUsed: ml.modelUsed,
    breakdown,
    missingSkills,
    missingPreferred,
    weakAreas: negativeReasons,
    strengths: positiveReasons.slice(0, 5),
    suggestedImprovements: buildSuggestions(profile, job, missingSkills, missingPreferred, breakdown),
    profile,
    job,
    branchEligible,
  };
}

export function calculateRiskProfile(student, companies = []) {
  const profile = inferStudentProfile(student);
  const matches = companies.map((company) => calculateJobMatch(profile, company));
  const bestMatch = matches.length ? Math.max(...matches.map((match) => match.matchScore)) : Math.round(profile.resumeScore * 0.7);
  const bestReadiness = matches.length ? Math.max(...matches.map((match) => match.readinessScore)) : profile.resumeScore;

  const factors = [];
  if (profile.cgpa < 7) factors.push('Low CGPA');
  if (profile.activeBacklogs > 0) factors.push('Active backlogs');
  if (profile.resumeScore < 65) factors.push('Weak resume score');
  if (profile.projects < 2) factors.push('Few projects');
  if (profile.skills.length < 4) factors.push('Low skill coverage');
  if (profile.internships < 1) factors.push('No internships');
  if (bestMatch < 58) factors.push('Low role match score');
  if (profile.profileCompletion < 65) factors.push('Incomplete profile');

  const score = clamp(factors.length * 14 + Math.max(0, 62 - bestMatch) + Math.max(0, 58 - bestReadiness) * 0.4, 0, 100);
  const level = score >= 68 ? 'High Risk' : score >= 34 ? 'Medium Risk' : 'Low Risk';

  return {
    level,
    score: Math.round(score),
    factors: factors.length ? factors : ['Strong readiness signals'],
    bestMatch,
    bestReadiness,
  };
}

function scoreSkills(profile, job) {
  const required = overlapRatio(profile.skills, job.requiredSkills);
  const preferred = overlapRatio([...profile.skills, ...profile.technologies], [...job.preferredSkills, ...job.preferredTechnologies]);
  const score = job.requiredSkills.length || job.preferredSkills.length ? required * 72 + preferred * 28 : Math.min(88, 42 + profile.skills.length * 8);
  return {
    label: 'Skills Match',
    score: Math.round(clamp(score, 0, 100)),
    reason: 'Role-specific skill coverage is below the company expectation.',
    positive: 'Your skills strongly match the role requirements.',
  };
}

function scoreAcademics(profile, job, branchEligible) {
  const cgpaScore = job.minimumCgpa ? clamp((profile.cgpa / job.minimumCgpa) * 85, 0, 100) : clamp(profile.cgpa * 10, 0, 100);
  const schoolScore = clamp(((profile.tenthPercentage + profile.twelfthPercentage) / 2), 0, 100) * 0.12;
  const backlogPenalty = profile.activeBacklogs > 0 ? profile.activeBacklogs * 14 : 0;
  const branchPenalty = branchEligible ? 0 : 24;
  const score = clamp(cgpaScore * 0.78 + schoolScore - backlogPenalty - branchPenalty, 0, 100);
  return {
    label: 'Academic Fit',
    score: Math.round(score),
    reason: profile.activeBacklogs > 0 ? 'Active backlogs reduce eligibility confidence.' : 'Academic fit or branch eligibility needs improvement.',
    positive: 'Your CGPA and academic eligibility match this company well.',
  };
}

function scoreResume(profile, job) {
  const keywordNeed = [...job.requiredSkills, ...job.preferredSkills, ...job.preferredTechnologies];
  const keywordCoverage = keywordNeed.length ? overlapRatio([...profile.skills, ...profile.technologies], keywordNeed) * 100 : profile.keywordScore;
  const score = profile.resumeScore * 0.38 + profile.atsScore * 0.24 + keywordCoverage * 0.24 + profile.formattingScore * 0.14;
  return {
    label: 'Resume Quality',
    score: Math.round(clamp(score, 0, 100)),
    reason: 'Resume lacks enough ATS-friendly keywords or complete project evidence.',
    positive: 'Your resume has strong ATS, keyword, and formatting signals.',
  };
}

function scoreExperience(profile, job) {
  const required = job.internshipPreference.toLowerCase().includes('required');
  const preferred = required ? 2 : 1;
  const internshipScore = clamp((profile.internships / preferred) * 72, 0, 82);
  const freelanceScore = Math.min(10, profile.freelanceWork * 5);
  const hackathonScore = Math.min(8, profile.hackathons * 4);
  const score = internshipScore + freelanceScore + hackathonScore;
  return {
    label: 'Experience Match',
    score: Math.round(clamp(score, 0, 100)),
    reason: 'No internship or practical work experience reduced prediction confidence.',
    positive: 'Your internships and practical experience improve hiring confidence.',
  };
}

function scoreProjects(profile, job) {
  const projectBase = clamp((profile.projects / 3) * 64, 0, 72);
  const quality = clamp(profile.projectQualityScore, 0, 100) * 0.28;
  const relevance = overlapRatio([...profile.skills, ...profile.technologies], [...job.requiredSkills, ...job.preferredSkills]) * 18;
  return {
    label: 'Project Relevance',
    score: Math.round(clamp(projectBase + quality + relevance, 0, 100)),
    reason: 'Project portfolio needs stronger role relevance or measurable outcomes.',
    positive: 'Your projects show relevant technical proof for this role.',
  };
}

function scorePerformance(profile) {
  const score =
    profile.aptitudeScore * 0.26 +
    profile.dsaScore * 0.34 +
    profile.interviewPerformance * 0.26 +
    Math.min(100, profile.mockInterviewHistory * 20) * 0.14;
  return {
    label: 'Selection Performance',
    score: Math.round(clamp(score, 0, 100)),
    reason: 'Aptitude, DSA, or interview practice signals are not yet strong.',
    positive: 'Your DSA, aptitude, and interview signals support selection readiness.',
  };
}

function scoreEngagement(profile) {
  const score = profile.profileCompletion * 0.48 + profile.activityLevel * 0.28 + Math.min(100, profile.applications * 18) * 0.24;
  return {
    label: 'Engagement',
    score: Math.round(clamp(score, 0, 100)),
    reason: 'Profile completion or application activity is too low.',
    positive: 'Your profile activity and completion are healthy.',
  };
}

function estimateMlPrediction(profile, job, breakdown, ruleScore) {
  // Deterministic CatBoost-style fallback for demo use.
  // The Python ML service can replace this, but this path keeps predictions explainable and reliable.
  const features = [
    breakdown.skills.score,
    breakdown.academics.score,
    breakdown.resume.score,
    breakdown.experience.score,
    breakdown.projects.score,
    breakdown.performance.score,
    breakdown.engagement.score,
    profile.cgpa * 10,
    profile.activeBacklogs ? 30 : 82,
  ];
  const treeVotes = [
    features[0] * 0.3 + features[1] * 0.2 + features[3] * 0.18 + features[5] * 0.2 + features[8] * 0.12,
    features[2] * 0.28 + features[4] * 0.24 + features[0] * 0.2 + features[6] * 0.16 + features[7] * 0.12,
    ruleScore * 0.35 + features[5] * 0.22 + features[3] * 0.18 + features[1] * 0.15 + features[6] * 0.1,
  ];
  const roleCompatibilityScore = Math.round(clamp(treeVotes.reduce((sum, item) => sum + item, 0) / treeVotes.length, 0, 100));
  const shortlistedProbability = Math.round(clamp(roleCompatibilityScore * 0.92 + breakdown.academics.score * 0.08, 4, 98));
  const placementProbability = Math.round(clamp(roleCompatibilityScore * 0.78 + breakdown.performance.score * 0.14 + breakdown.experience.score * 0.08, 3, 96));
  const confidence = Math.round(clamp(62 + Math.abs(ruleScore - 50) * 0.22 + (profile.profileCompletion > 80 ? 10 : 0), 45, 92));

  return {
    shortlistedProbability,
    placementProbability,
    roleCompatibilityScore,
    confidence,
    modelUsed: 'rules-fallback-v1',
  };
}

function buildSuggestions(profile, job, missingSkills, missingPreferred, breakdown) {
  const suggestions = [
    ...missingSkills.slice(0, 3).map((skill) => `Learn ${skill} and add it to a role-relevant project.`),
    ...missingPreferred.slice(0, 2).map((skill) => `Add beginner proof for ${skill} to improve preferred-skill coverage.`),
  ];

  if (breakdown.projects.score < 68) suggestions.push('Build one deployed project with architecture, GitHub link, and measurable outcome.');
  if (breakdown.resume.score < 72) suggestions.push('Improve ATS keywords, formatting consistency, and project impact bullets.');
  if (breakdown.experience.score < 62) suggestions.push('Add internship, freelance, open-source, or hackathon proof to reduce experience risk.');
  if (breakdown.performance.score < 64) suggestions.push('Practice DSA and mock interviews weekly; track weak topics after every attempt.');
  if (profile.activeBacklogs > 0) suggestions.push('Clear active backlogs before applying to strict eligibility roles.');

  return suggestions.slice(0, 7);
}

function weightedAverage(breakdown) {
  return Object.entries(WEIGHTS).reduce((sum, [key, weight]) => sum + breakdown[key].score * weight, 0);
}

function overlapRatio(source, target) {
  if (!target.length) return 1;
  const sourceSet = new Set(source.map((item) => item.toLowerCase()));
  const matches = target.filter((item) => sourceSet.has(item.toLowerCase())).length;
  return matches / target.length;
}

function isBranchEligible(branch, eligibleBranches) {
  if (!eligibleBranches.length) return true;
  return eligibleBranches.some((item) => item.toLowerCase() === 'all') ||
    eligibleBranches.some((item) => item.toLowerCase() === String(branch || '').toLowerCase());
}

function hasSkill(skills, target) {
  const normalized = String(target || '').toLowerCase();
  return skills.some((skill) => String(skill).toLowerCase() === normalized);
}

function inferSkillsFromBranch(branch, cgpa) {
  const normalized = String(branch || '').toLowerCase();
  if (normalized.includes('cse')) return cgpa >= 8 ? SKILL_LIBRARY.cse : ['JavaScript', 'SQL', 'Communication'];
  if (normalized.includes('it')) return cgpa >= 8 ? SKILL_LIBRARY.it : ['Python', 'SQL', 'Communication'];
  if (normalized.includes('ece')) return SKILL_LIBRARY.ece;
  return SKILL_LIBRARY.default;
}

function calculateProfileCompletion(student) {
  const checks = [
    student?.name,
    student?.branch,
    Number(student?.cgpa || 0) > 0,
    parseSkillList(student?.skills).length > 0,
    Number(student?.projects || student?.no_of_projects || 0) > 0,
    Number(student?.resumeScore || student?.atsScore || 0) > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}
