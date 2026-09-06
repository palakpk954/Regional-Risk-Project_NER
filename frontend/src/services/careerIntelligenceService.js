import { buildUnifiedReadiness } from './readinessIntelligenceService';
import { inferStudentProfile, parseSkillList } from './jobMatchService';

const DOMAIN_RULES = [
  {
    domain: 'Frontend Engineering',
    role: 'Frontend Engineer Intern',
    skills: ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Tailwind', 'Next.js'],
    focusAreas: ['React architecture', 'state management', 'component design', 'performance', 'accessibility'],
  },
  {
    domain: 'Backend Engineering',
    role: 'Backend Engineer Intern',
    skills: ['Node.js', 'Express', 'SQL', 'PostgreSQL', 'MongoDB', 'API', 'Docker'],
    focusAreas: ['API design', 'database modeling', 'authentication', 'system design', 'deployment'],
  },
  {
    domain: 'AI / Data',
    role: 'AI/Data Analyst Intern',
    skills: ['Python', 'Machine Learning', 'SQL', 'Power BI', 'Excel', 'Scikit-learn', 'Pandas'],
    focusAreas: ['model evaluation', 'data cleaning', 'SQL analysis', 'feature engineering', 'dashboard storytelling'],
  },
  {
    domain: 'Cloud / DevOps',
    role: 'Cloud Platform Intern',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Linux', 'Cloud', 'Git', 'CI/CD'],
    focusAreas: ['deployment', 'containers', 'Linux fundamentals', 'cloud architecture', 'monitoring'],
  },
  {
    domain: 'Core CS',
    role: 'Software Engineer Intern',
    skills: ['DSA', 'DBMS', 'Algorithms', 'Java', 'Python', 'C++', 'Git'],
    focusAreas: ['DSA', 'DBMS', 'problem solving', 'project explanation', 'communication'],
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function extractGithubUsername(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  const match = text.match(/github\.com\/([^/\s?#]+)/i);
  if (match?.[1]) return match[1];
  if (/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(text)) return text;
  return '';
}

function scoreDomain(profile, rule) {
  const known = [...(profile.skills || []), ...(profile.technologies || [])].map(normalize);
  const matched = rule.skills.filter((skill) => known.includes(normalize(skill)));
  return {
    ...rule,
    matched,
    score: Math.round((matched.length / rule.skills.length) * 100),
  };
}

export function inferCareerDomain(student = {}, drives = []) {
  const profile = inferStudentProfile(student);
  const domains = DOMAIN_RULES.map((rule) => scoreDomain(profile, rule)).sort((a, b) => b.score - a.score);
  const best = domains[0] || DOMAIN_RULES[DOMAIN_RULES.length - 1];
  const bestDrive = drives
    .filter((drive) => String(drive.status || 'Open').toLowerCase() !== 'draft')
    .find((drive) => {
      const text = `${drive.role} ${drive.requiredSkills || ''} ${drive.preferredSkills || ''}`.toLowerCase();
      return best.skills.some((skill) => text.includes(normalize(skill)));
    });

  const experienceSignals = Number(profile.projects || 0) + Number(profile.internships || 0) * 2 + Math.floor(Number(profile.cgpa || 0) / 3);
  const difficulty = experienceSignals >= 7 ? 'Advanced' : experienceSignals >= 4 ? 'Intermediate' : 'Foundational';

  return {
    domain: best.domain,
    role: bestDrive?.role || best.role,
    company: bestDrive?.name || bestDrive?.company || '',
    difficulty,
    confidence: clamp(48 + best.score * 0.42 + Number(profile.projects || 0) * 5 + Number(profile.internships || 0) * 6, 45, 94),
    focusAreas: [...new Set([...best.focusAreas, ...(bestDrive?.requiredSkills || []).slice?.(0, 3) || []])].slice(0, 7),
    domains,
  };
}

export function buildCodingAnalytics(student = {}) {
  const profile = inferStudentProfile(student);
  const links = [
    student.github,
    student.linkedin,
    ...(Array.isArray(student.profileLinks) ? student.profileLinks : parseSkillList(student.profileLinks)),
    ...(Array.isArray(student.codingProfiles) ? student.codingProfiles.map((item) => item.url || item) : []),
  ].filter(Boolean);
  const source = links.join(' ').toLowerCase();
  const profileCount = ['leetcode', 'codechef', 'geeksforgeeks', 'hackerrank'].filter((platform) =>
    source.includes(platform) || (platform === 'geeksforgeeks' && source.includes('gfg')),
  ).length;
  const streak = clamp(Math.round(3 + profile.projects * 2 + profileCount * 4 + Number(profile.mockInterviewHistory || 0)), 0, 45);
  const solved = clamp(Math.round(Number(profile.dsaScore || 0) * 1.7 + profileCount * 32 + profile.projects * 12), 0, 480);
  const consistency = clamp(35 + streak * 1.4 + profileCount * 10, 0, 98);

  return {
    profileCount,
    streak,
    solved,
    consistency: Math.round(consistency),
    languageDistribution: [
      { name: 'JavaScript', value: profile.skills.some((skill) => /react|javascript|node/i.test(skill)) ? 34 : 16 },
      { name: 'Python', value: profile.skills.some((skill) => /python|machine/i.test(skill)) ? 28 : 12 },
      { name: 'SQL', value: profile.skills.some((skill) => /sql|dbms/i.test(skill)) ? 22 : 9 },
      { name: 'Other', value: 16 },
    ],
    heatmap: Array.from({ length: 28 }, (_, index) => ({
      day: index + 1,
      value: Math.max(0, Math.round((Math.sin(index * 1.8) + 1.2) * (profileCount + 1) + (index % 6 === 0 ? profile.projects : 0))),
    })),
  };
}

export function buildAchievements(student = {}, drives = []) {
  const readiness = buildUnifiedReadiness({ student, drives, peers: [student] });
  const coding = buildCodingAnalytics(student);
  return [
    { title: 'ATS Ready', active: readiness.resumeStrength >= 75, note: `${readiness.resumeStrength}% resume strength` },
    { title: 'Strong Match', active: readiness.matchPercentage >= 75, note: `${readiness.matchPercentage}% best match` },
    { title: 'Coding Streak', active: coding.streak >= 14, note: `${coding.streak} day prep streak` },
    { title: 'Project Proof', active: Number(readiness.profile.projects || 0) >= 3, note: `${readiness.profile.projects || 0} projects tracked` },
    { title: 'Interview Ready', active: Number(readiness.profile.mockInterviewHistory || 0) > 0 || readiness.selectionProbability >= 72, note: `${readiness.selectionProbability}% selection probability` },
  ];
}

export function buildStudentNotifications({ student, drives = [], applications = [] }) {
  const readiness = buildUnifiedReadiness({ student, drives, applications, peers: [student] });
  const soon = drives
    .filter((drive) => drive.deadline)
    .slice(0, 2)
    .map((drive) => ({ type: 'deadline', title: `${drive.name} deadline`, text: `${drive.role} closes on ${drive.deadline}` }));

  return [
    readiness.resumeStrength < 70 ? { type: 'resume', title: 'Resume needs polish', text: 'Improve ATS keywords before applying to high-fit companies.' } : null,
    readiness.matchPercentage >= 75 ? { type: 'match', title: 'Strong role match', text: `${readiness.bestMatch?.name || 'A role'} is ready for application.` } : null,
    applications.length === 0 ? { type: 'application', title: 'No applications yet', text: 'Apply to one strong-fit opportunity to start your placement trail.' } : null,
    ...soon,
  ].filter(Boolean).slice(0, 5);
}

export function buildAlumniResumeVault({ companies = [], branch = 'CSE' }) {
  return (companies.length ? companies : [{ name: 'Microsoft', role: 'SWE Intern' }, { name: 'Nexora', role: 'Data Analyst' }])
    .slice(0, 4)
    .map((company, index) => ({
      id: `${company.name}-${index}`,
      company: company.name || company.company,
      role: company.role,
      branch,
      atsScore: 84 - index * 4,
      pattern: index % 2 === 0 ? 'Project-first resume with measurable impact' : 'Skills-first resume with strong keyword alignment',
      insight: index % 2 === 0
        ? 'Successful resumes showed deployed projects, GitHub proof, and clear system ownership.'
        : 'Successful resumes used JD keywords naturally across skills, projects, and experience.',
    }));
}

export async function syncGithubPublicProfile(input) {
  const username = extractGithubUsername(input);
  if (!username) return { ok: false, error: 'Enter a GitHub username or profile URL.' };

  try {
    const [userResponse, repoResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?per_page=50&sort=updated`),
    ]);

    if (!userResponse.ok) return { ok: false, error: 'GitHub profile was not found or rate limited.' };
    const user = await userResponse.json();
    const repos = repoResponse.ok ? await repoResponse.json() : [];
    const languageMap = new Map();
    repos.forEach((repo) => {
      if (!repo.language) return;
      languageMap.set(repo.language, (languageMap.get(repo.language) || 0) + 1);
    });

    return {
      ok: true,
      username,
      github: user.html_url,
      avatarUrl: user.avatar_url,
      publicRepos: user.public_repos || repos.length,
      followers: user.followers || 0,
      repoSignals: repos.slice(0, 6).map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        language: repo.language || 'Mixed',
        stars: repo.stargazers_count || 0,
        updatedAt: repo.updated_at,
      })),
      languageDistribution: [...languageMap.entries()].map(([name, value]) => ({ name, value })).slice(0, 6),
    };
  } catch {
    return { ok: false, error: 'Could not reach GitHub right now. Keep the URL saved and retry later.' };
  }
}
