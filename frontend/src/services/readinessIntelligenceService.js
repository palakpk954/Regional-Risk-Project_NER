import { calculateJobMatch, calculateRiskProfile, inferStudentProfile, parseSkillList } from './jobMatchService';

const CORE_SKILL_GROUPS = [
  { name: 'Frontend', skills: ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Tailwind'] },
  { name: 'Backend', skills: ['Node.js', 'Express', 'SQL', 'PostgreSQL', 'MongoDB', 'API'] },
  { name: 'Core CS', skills: ['DSA', 'DBMS', 'Git', 'Linux', 'Algorithms'] },
  { name: 'Cloud/Data', skills: ['AWS', 'Docker', 'Cloud', 'Python', 'Machine Learning', 'Power BI'] },
];

const PROFILE_BRANDS = [
  { key: 'github', label: 'GitHub', short: 'GH' },
  { key: 'linkedin', label: 'LinkedIn', short: 'in' },
  { key: 'leetcode', label: 'LeetCode', short: 'LC' },
  { key: 'codechef', label: 'CodeChef', short: 'CC' },
  { key: 'geeksforgeeks', label: 'GeeksforGeeks', short: 'GFG' },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function average(values) {
  const list = values.map(Number).filter(Number.isFinite);
  if (!list.length) return 0;
  return Math.round(list.reduce((sum, value) => sum + value, 0) / list.length);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function hasSkill(profile, skill) {
  const target = normalizeText(skill);
  return [...(profile.skills || []), ...(profile.technologies || [])].some((item) => normalizeText(item) === target);
}

function inferCodingProfiles(student = {}) {
  const raw = [
    ...(Array.isArray(student.codingProfiles) ? student.codingProfiles : []),
    student.leetcode,
    student.codechef,
    student.geeksforgeeks,
    student.hackerrank,
  ].filter(Boolean);

  const links = [...parseSkillList(student.profileLinks || student.links), ...raw].map(String);
  const source = links.join(' ').toLowerCase();

  return {
    leetcode: /leetcode/.test(source),
    codechef: /codechef/.test(source),
    geeksforgeeks: /geeksforgeeks|geeks for geeks|gfg/.test(source),
    hackerrank: /hackerrank/.test(source),
    count: ['leetcode', 'codechef', 'geeksforgeeks', 'hackerrank'].filter((key) => new RegExp(key === 'geeksforgeeks' ? 'geeksforgeeks|gfg' : key).test(source)).length,
  };
}

function buildProfileSignals(profile) {
  const coding = inferCodingProfiles(profile);
  const hasGithub = Boolean(profile.github);
  const hasLinkedin = Boolean(profile.linkedin);
  const projectCount = Number(profile.projects || profile.no_of_projects || 0);
  const skillCount = (profile.skills || []).length + (profile.technologies || []).length;

  const githubScore = hasGithub
    ? clamp(54 + projectCount * 9 + (hasSkill(profile, 'Git') ? 8 : 0) + Math.min(18, skillCount * 2), 0, 96)
    : clamp(28 + projectCount * 8, 0, 72);

  const linkedinScore = hasLinkedin
    ? clamp(55 + Number(profile.internships || 0) * 12 + Number(profile.certifications?.length || 0) * 5, 0, 95)
    : 38;

  const codingScore = clamp(36 + coding.count * 16 + Number(profile.dsaScore || 0) * 0.35, 0, 96);

  return {
    github: {
      active: hasGithub,
      score: Math.round(githubScore),
      label: hasGithub ? 'Portfolio signal found' : 'Add GitHub project links',
      detail: hasGithub ? 'Projects and repository proof improve technical trust.' : 'A public GitHub link improves project verification.',
    },
    linkedin: {
      active: hasLinkedin,
      score: Math.round(linkedinScore),
      label: hasLinkedin ? 'Professional profile linked' : 'Add LinkedIn profile',
      detail: hasLinkedin ? 'Recruiter-facing profile signal is available.' : 'LinkedIn helps validate education, internships, and network.',
    },
    coding: {
      active: coding.count > 0,
      score: Math.round(codingScore),
      label: coding.count > 0 ? `${coding.count} coding profile signal${coding.count > 1 ? 's' : ''}` : 'Add coding profile proof',
      detail: coding.count > 0 ? 'Coding profile presence supports DSA readiness.' : 'LeetCode, CodeChef, or GeeksforGeeks can raise DSA confidence.',
      profiles: coding,
    },
  };
}

function estimateImprovementLift(match) {
  const missing = match.missingSkills?.[0] || match.missingPreferred?.[0] || '';
  const lift = clamp(Math.round((100 - match.matchScore) * 0.2), 6, 22);
  const focus = missing || match.weakAreas?.[0] || 'one role-aligned project';

  return {
    focus,
    lift,
    text: missing
      ? `Adding ${missing} and proving it in a project could improve this match by about ${lift}%.`
      : `Improving ${focus.toLowerCase()} could lift this match by about ${lift}%.`,
  };
}

function buildSkillHeatmap(profile) {
  return CORE_SKILL_GROUPS.map((group) => {
    const covered = group.skills.filter((skill) => hasSkill(profile, skill));
    return {
      ...group,
      covered,
      score: Math.round((covered.length / group.skills.length) * 100),
      missing: group.skills.filter((skill) => !covered.includes(skill)).slice(0, 3),
    };
  });
}

function buildRank({ student, peers, drives }) {
  const scored = (peers || []).map((peer) => {
    const profile = inferStudentProfile(peer);
    const best = drives.length
      ? Math.max(...drives.map((drive) => calculateJobMatch(profile, drive).readinessScore))
      : profile.resumeScore;
    return { id: peer.id, score: best };
  }).sort((a, b) => b.score - a.score);

  const rankIndex = scored.findIndex((item) => item.id === student?.id);
  return {
    rank: rankIndex >= 0 ? rankIndex + 1 : 1,
    total: scored.length || 1,
    percentile: scored.length ? Math.round(((scored.length - Math.max(rankIndex, 0)) / scored.length) * 100) : 100,
  };
}

function buildInsights({ profile, matches, risk, applications, peers }) {
  const best = matches[0];
  const lift = best ? estimateImprovementLift(best.match) : null;
  const missingRequired = best?.match?.missingSkills?.length || 0;
  const similarShortlisted = (peers || []).filter((peer) =>
    peer.id !== profile.id &&
    normalizeText(peer.branch) === normalizeText(profile.branch) &&
    Math.abs(Number(peer.cgpa || 0) - Number(profile.cgpa || 0)) <= 0.7 &&
    ['shortlisted', 'interview', 'selected'].includes(normalizeText(peer.status)),
  ).length;

  return [
    best ? `Your chances for ${best.name} are ${best.match.hiringProbability}%.` : 'Upload resume and import drives to unlock company-specific chances.',
    lift?.text,
    missingRequired ? `You are missing ${missingRequired} required skill${missingRequired > 1 ? 's' : ''} for your best role.` : 'Your best role has no critical required-skill blocker.',
    similarShortlisted ? `${similarShortlisted} similar ${profile.branch} profile${similarShortlisted > 1 ? 's were' : ' was'} shortlisted in this dataset.` : 'No strong similar-profile shortlist pattern was found yet.',
    risk.level !== 'Low Risk' ? `${risk.level}: ${risk.factors.slice(0, 2).join(' and ')} are pulling readiness down.` : 'Current readiness signals are healthy for active roles.',
    applications?.length ? `${applications.length} application${applications.length > 1 ? 's' : ''} submitted this cycle.` : 'Apply to one strong-fit role to start building placement activity.',
  ].filter(Boolean).slice(0, 6);
}

function buildNotifications({ profile, matches }) {
  const best = matches[0];
  return [
    profile.resumeScore < 72 ? { tone: 'warning', text: 'Resume score is below the strong shortlist range. Improve ATS keywords first.' } : null,
    best?.match?.missingSkills?.[0] ? { tone: 'info', text: `${best.match.missingSkills[0]} is the highest-impact missing skill right now.` } : null,
    profile.internships < 1 ? { tone: 'warning', text: 'Add internship, freelance, hackathon, or open-source proof to improve confidence.' } : null,
    best && best.match.matchScore >= 75 ? { tone: 'success', text: `${best.name} is ready to apply with a ${best.match.matchScore}% match.` } : null,
  ].filter(Boolean);
}

export function profileUpdatesFromResumeSignals(signals = {}) {
  const skills = [...new Set([...(signals.skills || []), ...(signals.technologies || [])])];
  const codingProfiles = signals.codingProfiles || [];

  const updates = {
    name: signals.inferred_name || undefined,
    branch: signals.inferred_branch || undefined,
    skills,
    technologies: signals.technologies || [],
    certifications: signals.certifications || [],
    github: signals.github || '',
    linkedin: signals.linkedin || '',
    profileLinks: [...(signals.links || []), ...codingProfiles.map((item) => item.url || item)].filter(Boolean),
    codingProfiles,
    resumeUploaded: true,
    resumeScore: Number(signals.resumeScore || 0),
    atsScore: Number(signals.atsScore || 0),
    keywordScore: Number(signals.keywordScore || 0),
    formattingScore: Number(signals.formattingScore || 0),
    resumeCompletenessScore: Number(signals.resumeCompletenessScore || 0),
    projectQualityScore: Number(signals.projectQualityScore || 0),
    roleAlignmentScore: Number(signals.roleAlignmentScore || 0),
    internships: Number(signals.internships || 0),
    projects: Number(signals.no_of_projects || signals.projects || 0),
    no_of_projects: Number(signals.no_of_projects || signals.projects || 0),
    no_of_programming_languages: Number(signals.no_of_programming_languages || 0),
    dsaScore: signals.flags?.dsa ? 76 : undefined,
    profileCompletion: average([
      signals.resumeCompletenessScore,
      signals.resumeScore,
      signals.github ? 82 : 55,
      signals.linkedin ? 82 : 55,
    ]),
  };

  return Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
}

export function buildUnifiedReadiness({ student, drives = [], applications = [], peers = [] }) {
  const profile = inferStudentProfile(student);
  const risk = calculateRiskProfile(profile, drives);
  const matches = drives
    .map((drive) => ({ ...drive, match: calculateJobMatch(profile, drive), lift: null }))
    .map((drive) => ({ ...drive, lift: estimateImprovementLift(drive.match) }))
    .sort((a, b) => b.match.matchScore - a.match.matchScore);
  const best = matches[0];
  const selectionProbability = best?.match?.hiringProbability || Math.round(risk.bestReadiness * 0.72);
  const eligibilityScore = best
    ? best.match.breakdown.academics.score
    : average([profile.cgpa * 10, profile.attendance || 75, profile.activeBacklogs > 0 ? 45 : 86]);
  const resumeStrength = average([profile.resumeScore, profile.atsScore, profile.keywordScore, profile.formattingScore]);
  const profileSignals = buildProfileSignals(profile);
  const rank = buildRank({ student: profile, peers, drives });

  return {
    profile,
    risk,
    matches,
    bestMatch: best,
    eligibilityScore,
    selectionProbability,
    matchPercentage: best?.match?.matchScore || risk.bestMatch,
    readinessScore: best?.match?.readinessScore || risk.bestReadiness,
    resumeStrength,
    profileSignals,
    skillHeatmap: buildSkillHeatmap(profile),
    rank,
    insights: buildInsights({ profile, matches, risk, applications, peers }),
    notifications: buildNotifications({ profile, matches }),
    recommendations: [
      ...(best?.match?.suggestedImprovements || []),
      profileSignals.github.active ? null : 'Add a GitHub profile with pinned projects.',
      profileSignals.linkedin.active ? null : 'Add LinkedIn so recruiters can validate your profile.',
      profileSignals.coding.active ? null : 'Add LeetCode, CodeChef, or GeeksforGeeks profile proof.',
    ].filter(Boolean).slice(0, 6),
    brands: PROFILE_BRANDS,
  };
}
