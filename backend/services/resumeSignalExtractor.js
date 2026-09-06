function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function splitLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function inferName(text) {
  const lines = splitLines(text).slice(0, 8);
  const candidate = lines.find((line) => /^[A-Za-z][A-Za-z\s.'-]{2,50}$/.test(line) && line.split(/\s+/).length <= 4);
  return candidate || 'Student Candidate';
}

function inferBranch(text) {
  const content = String(text || '').toLowerCase();

  const branchRules = [
    { branch: 'CSE', patterns: ['computer science', 'cse', 'software engineering'] },
    { branch: 'IT', patterns: ['information technology', 'it'] },
    { branch: 'ECE', patterns: ['electronics', 'ece', 'communication engineering'] },
    { branch: 'EEE', patterns: ['electrical engineering', 'eee'] },
    { branch: 'MECH', patterns: ['mechanical engineering', 'mech'] },
    { branch: 'CIVIL', patterns: ['civil engineering', 'civil'] },
  ];

  for (const rule of branchRules) {
    if (rule.patterns.some((pattern) => content.includes(pattern))) {
      return rule.branch;
    }
  }

  return 'CSE';
}

function hasAny(text, phrases) {
  const content = String(text || '').toLowerCase();
  return phrases.some((phrase) => content.includes(phrase));
}

const SKILL_TERMS = [
  'python', 'java', 'javascript', 'typescript', 'react', 'node.js', 'express', 'sql', 'dbms', 'mongodb',
  'postgresql', 'machine learning', 'scikit-learn', 'tensorflow', 'pytorch', 'aws', 'azure', 'gcp', 'docker',
  'kubernetes', 'git', 'linux', 'html', 'css', 'tailwind', 'firebase', 'supabase', 'power bi', 'excel',
  'data structures', 'algorithms', 'api', 'rest api', 'next.js', 'fastapi', 'flask', 'spring boot', 'redis',
  'prisma', 'postgres', 'react native', 'figma', 'system design',
];

const CERT_TERMS = ['aws certified', 'azure', 'nptel', 'coursera', 'google data analytics', 'udemy', 'certification'];

function titleCase(value) {
  return String(value || '')
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractTerms(text, terms) {
  const content = String(text || '').toLowerCase();
  return terms
    .filter((term) => content.includes(term))
    .map((term) => {
      if (term === 'node.js') return 'Node.js';
      if (term === 'dbms') return 'DBMS';
      if (term === 'aws') return 'AWS';
      if (term === 'gcp') return 'GCP';
      if (term === 'sql') return 'SQL';
      return titleCase(term);
    });
}

function extractLinks(text) {
  const urls = String(text || '').match(/https?:\/\/[^\s)]+/gi) || [];
  const codingProfiles = urls
    .filter((url) => /leetcode|codechef|geeksforgeeks|hackerrank/i.test(url))
    .map((url) => {
      const lower = url.toLowerCase();
      const platform = lower.includes('leetcode')
        ? 'LeetCode'
        : lower.includes('codechef')
          ? 'CodeChef'
          : lower.includes('geeksforgeeks')
            ? 'GeeksforGeeks'
            : 'HackerRank';
      return { platform, url };
    });

  return {
    github: urls.find((url) => url.toLowerCase().includes('github.com')) || '',
    linkedin: urls.find((url) => url.toLowerCase().includes('linkedin.com')) || '',
    codingProfiles,
    links: urls.slice(0, 8),
  };
}

function inferSkillFlags(text) {
  return {
    dsa: hasAny(text, ['data structures', 'algorithms', 'leetcode', 'competitive programming']) ? 1 : 0,
    web_dev: hasAny(text, ['react', 'angular', 'vue', 'node.js', 'express', 'frontend', 'backend', 'full stack', 'web development']) ? 1 : 0,
    machine_learning: hasAny(text, ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'ml model', 'scikit']) ? 1 : 0,
    cloud: hasAny(text, ['aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'devops']) ? 1 : 0,
  };
}

function inferInternships(text) {
  const content = String(text || '').toLowerCase();
  const matches = content.match(/\b(intern|internship|trainee)\b/g) || [];
  return Math.max(0, Math.min(4, matches.length || (content.includes('experience') ? 1 : 0)));
}

function inferProjects(text) {
  const content = String(text || '');
  const lines = splitLines(content);
  const projectHeadingIndex = lines.findIndex((line) => /^(projects?|project experience)$/i.test(line));

  if (projectHeadingIndex >= 0) {
    const slice = lines.slice(projectHeadingIndex + 1, projectHeadingIndex + 16);
    const bulletCount = slice.filter((line) => /^[-*•]/.test(line)).length;
    if (bulletCount > 0) return Math.min(6, bulletCount);
  }

  const projectWordMatches = (content.toLowerCase().match(/\bproject\b/g) || []).length;
  if (projectWordMatches === 0) return 1;
  return Math.max(1, Math.min(6, projectWordMatches));
}

function inferProgrammingLanguages(text) {
  const languageTerms = [
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'kotlin', 'swift', 'php', 'r', 'matlab',
  ];

  const content = String(text || '').toLowerCase();
  const count = languageTerms.filter((term) => {
    if (term.includes('+') || term.includes('#')) {
      return content.includes(term);
    }
    return new RegExp(`\\b${term}\\b`, 'i').test(content);
  }).length;

  return Math.max(1, Math.min(8, count));
}

function calculateResumeScores(text, skills, projects, internships, links) {
  const wordCount = String(text || '').split(/\s+/).filter(Boolean).length;
  const sectionSignals = ['education', 'skills', 'projects', 'experience', 'certifications'].filter((section) =>
    String(text || '').toLowerCase().includes(section),
  ).length;
  const completeness = Math.min(100, 25 + sectionSignals * 12 + (links.github ? 8 : 0) + (links.linkedin ? 8 : 0));
  const keywordMatch = Math.min(100, 25 + skills.length * 7);
  const ats = Math.min(100, 35 + sectionSignals * 9 + (wordCount > 250 ? 12 : 0) + (links.github || links.linkedin ? 8 : 0));
  const formatting = Math.min(100, 55 + (wordCount > 180 ? 12 : 0) + (sectionSignals >= 4 ? 15 : 0));
  const resumeScore = Math.round(ats * 0.34 + keywordMatch * 0.26 + completeness * 0.25 + formatting * 0.15);

  return {
    resumeScore,
    atsScore: Math.round(ats),
    keywordScore: Math.round(keywordMatch),
    formattingScore: Math.round(formatting),
    resumeCompletenessScore: Math.round(completeness),
    projectQualityScore: Math.min(100, 42 + projects * 13 + skills.length * 2),
    roleAlignmentScore: Math.min(100, 35 + skills.length * 6 + internships * 8),
  };
}

function extractResumeSignalsFromText(text) {
  const clean = normalizeText(text);
  if (!clean) {
    return {
      ok: false,
      error: 'Resume text is empty after extraction.',
    };
  }

  const inferred_name = inferName(text);
  const inferred_branch = inferBranch(text);
  const flags = inferSkillFlags(text);
  const internships = inferInternships(text);
  const no_of_projects = inferProjects(text);
  const no_of_programming_languages = inferProgrammingLanguages(text);
  const skills = extractTerms(text, SKILL_TERMS);
  const technologies = skills.filter((skill) => !['Data Structures', 'Algorithms'].includes(skill));
  const certifications = extractTerms(text, CERT_TERMS);
  const links = extractLinks(text);
  const scores = calculateResumeScores(text, skills, no_of_projects, internships, links);

  return {
    ok: true,
    data: {
      inferred_name,
      inferred_branch,
      flags,
      skills,
      technologies,
      certifications,
      education: inferred_branch,
      achievements: hasAny(text, ['winner', 'rank', 'award', 'hackathon', 'finalist']) ? ['Achievement signals detected'] : [],
      github: links.github,
      linkedin: links.linkedin,
      codingProfiles: links.codingProfiles,
      links: links.links,
      internships,
      no_of_projects,
      no_of_programming_languages,
      ...scores,
      source: 'resume-content-parser-v1',
    },
  };
}

module.exports = {
  extractResumeSignalsFromText,
};
