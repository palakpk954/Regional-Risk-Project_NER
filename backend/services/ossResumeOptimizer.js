const { scoreResumeAgainstJob } = require('./atsScorerEngine');

function normalizeSpace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function splitLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function pickName(lines) {
  if (!lines.length) return 'Candidate';
  const top = lines.slice(0, 6).find((line) => /^[A-Za-z][A-Za-z\s.'-]{2,50}$/.test(line) && line.split(' ').length <= 4);
  return top || 'Candidate';
}

function pickEmail(text) {
  return String(text || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)?.[0] || '';
}

function pickPhone(text) {
  return String(text || '').match(/(\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/g)?.[0] || '';
}

function inferSummary({ targetRole, resumeText, matchedKeywords }) {
  const role = String(targetRole || 'target role').trim();
  const hasMetrics = /\b\d+%|\b\d+\+?\s*(users|clients|projects|k|m|million|lakh|crore)\b/i.test(resumeText);
  const keywordSlice = matchedKeywords.slice(0, 6);

  const metricLine = hasMetrics
    ? 'Delivers measurable impact with quantified outcomes in projects and internships.'
    : 'Focused on building measurable impact and translating project work into business outcomes.';

  return `${role} candidate with strengths in ${keywordSlice.join(', ') || 'problem solving, communication, and engineering fundamentals'}. ${metricLine}`;
}

function extractSectionBlock(text, headingPatterns) {
  const lines = String(text || '').split(/\r?\n/);
  const lower = lines.map((line) => line.trim().toLowerCase());

  const startIndex = lower.findIndex((line) => headingPatterns.some((pattern) => pattern.test(line)));
  if (startIndex < 0) return '';

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const current = lines[i].trim();
    if (/^(summary|profile|objective|experience|work experience|projects|skills|education|certifications?)$/i.test(current)) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex + 1, endIndex).join('\n').trim();
}

function extractBullets(sectionText) {
  const lines = String(sectionText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const bullets = lines
    .filter((line) => /^[-*•]/.test(line))
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter((line) => line.length > 15);

  if (bullets.length) return bullets;

  return lines
    .filter((line) => line.length > 30)
    .slice(0, 5);
}

function rewriteBullet(sourceBullet, boostKeyword = '') {
  const cleaned = String(sourceBullet || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  const startsWithVerb = /^(built|designed|implemented|developed|optimized|delivered|improved|created|led)\b/i.test(cleaned);
  const hasMetric = /\d|%|\$|k\b|m\b|million|lakh|crore/i.test(cleaned);

  let rewritten = startsWithVerb ? cleaned : `Implemented ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;

  if (boostKeyword && !new RegExp(`\\b${boostKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(rewritten)) {
    rewritten = `${rewritten} using ${boostKeyword}`;
  }

  if (!hasMetric) {
    rewritten = `${rewritten}, improving delivery quality and measurable impact.`;
  }

  return rewritten;
}

function sanitizeKeyword(keyword = '') {
  return String(keyword || '').replace(/[^a-z0-9+#\-\s.]/gi, '').trim();
}

function inferSkills({ matchedKeywords, missingKeywords }) {
  const strong = matchedKeywords.map(sanitizeKeyword).filter(Boolean);
  const priority = missingKeywords.map(sanitizeKeyword).filter(Boolean).slice(0, 8);

  return {
    core: Array.from(new Set(strong)).slice(0, 14),
    addNext: Array.from(new Set(priority)),
  };
}

function inferProjectBullets({ targetRole, matchedKeywords, missingKeywords }) {
  const role = String(targetRole || 'role').trim();
  const stack = matchedKeywords.slice(0, 5);
  const missing = missingKeywords.slice(0, 3);

  const bullets = [
    `Built and shipped an end-to-end ${role.toLowerCase()} portfolio project with ${stack.join(', ') || 'modern stack components'} and measurable outcome tracking.`,
    'Implemented production-style quality checks, logging, and edge-case handling to improve reliability and interview readiness.',
  ];

  if (missing.length) {
    bullets.push(`Integrated ${missing.join(', ')} into project scope to better align with current hiring trends and ATS filters.`);
  }

  return bullets;
}

function inferExperienceBullets({ matchedKeywords, missingKeywords }) {
  const strong = matchedKeywords.slice(0, 4);
  const missing = missingKeywords.slice(0, 2);

  const bullets = [
    `Collaborated across teams to deliver features using ${strong.join(', ') || 'agile engineering practices'} while meeting delivery deadlines.`,
    'Converted ambiguous requirements into structured deliverables with clear acceptance criteria and measurable impact.',
  ];

  if (missing.length) {
    bullets.push(`Added role-relevant contributions around ${missing.join(' and ')} to improve ATS and recruiter alignment.`);
  }

  return bullets;
}

function inferBulletsFromResume({ resumeText, matchedKeywords, missingKeywords }) {
  const experienceBlock = extractSectionBlock(resumeText, [/^experience$/i, /^work experience$/i, /^employment$/i]);
  const projectBlock = extractSectionBlock(resumeText, [/^projects?$/i, /^project experience$/i]);

  const sourceExperience = extractBullets(experienceBlock);
  const sourceProjects = extractBullets(projectBlock);

  const boostedExperience = sourceExperience
    .slice(0, 4)
    .map((bullet, index) => rewriteBullet(bullet, matchedKeywords[index] || missingKeywords[index] || ''))
    .filter(Boolean);

  const boostedProjects = sourceProjects
    .slice(0, 4)
    .map((bullet, index) => rewriteBullet(bullet, matchedKeywords[index + 2] || missingKeywords[index] || ''))
    .filter(Boolean);

  return {
    experienceBullets: boostedExperience,
    projectBullets: boostedProjects,
  };
}

function buildMarkdownResume({ profile, optimizedSummary, skills, experienceBullets, projectBullets }) {
  const lines = [
    `# ${profile.name}`,
    '',
    [profile.email, profile.phone, profile.linkedin, profile.github].filter(Boolean).join(' | '),
    '',
    '## Summary',
    optimizedSummary,
    '',
    '## Skills',
    `Core: ${skills.core.join(', ') || 'Add role-specific technical skills here'}`,
    `Priority additions for ATS: ${skills.addNext.join(', ') || 'No major missing keywords detected'}`,
    '',
    '## Experience',
    ...experienceBullets.map((line) => `- ${line}`),
    '',
    '## Projects',
    ...projectBullets.map((line) => `- ${line}`),
    '',
    '## Education',
    '- Add degree, institution, graduation year, and GPA (if strong).',
  ];

  return lines.join('\n');
}

function buildJsonResume({ profile, optimizedSummary, skills, experienceBullets, projectBullets }) {
  return {
    basics: {
      name: profile.name,
      email: profile.email || undefined,
      phone: profile.phone || undefined,
      summary: optimizedSummary,
      profiles: [
        profile.linkedin
          ? { network: 'LinkedIn', username: '', url: profile.linkedin }
          : null,
        profile.github
          ? { network: 'GitHub', username: '', url: profile.github }
          : null,
      ].filter(Boolean),
    },
    work: [
      {
        name: 'Recent Experience',
        position: 'Role-Relevant Contributor',
        summary: 'Resume optimized for ATS and recruiter readability.',
        highlights: experienceBullets,
      },
    ],
    projects: [
      {
        name: 'Flagship Project',
        description: 'ATS-tailored project section generated from prior resume and JD analysis.',
        highlights: projectBullets,
      },
    ],
    skills: [
      {
        name: 'Core Skills',
        keywords: skills.core,
      },
      {
        name: 'Priority ATS Additions',
        keywords: skills.addNext,
      },
    ],
    education: [
      {
        institution: 'Add your institution',
        area: 'Add branch/specialization',
        studyType: 'Degree',
      },
    ],
    meta: {
      canonical: 'https://jsonresume.org/schema/',
      version: 'v1.0.0',
      optimizedBy: 'Placify AI Profile Intelligence',
    },
  };
}

function buildPipelineMetadata(extractionSource = 'unknown') {
  return {
    extraction: extractionSource,
    components: [
      {
        name: 'PaddleOCR',
        purpose: 'OCR extraction for scanned resumes',
        repo: 'https://github.com/PaddlePaddle/PaddleOCR',
        license: 'Apache-2.0',
      },
      {
        name: 'Resume-Matcher-inspired ATS scorer',
        purpose: 'Keyword and semantic match analysis',
        repo: 'https://github.com/srbhr/Resume-Matcher',
        license: 'Apache-2.0',
      },
      {
        name: 'Reactive Resume compatible JSON export',
        purpose: 'Use optimized content in modern resume builders',
        repo: 'https://github.com/amruthpillai/reactive-resume',
        license: 'MIT',
      },
    ],
  };
}

function optimizeResumePackage({ resumeText, jobDescription, targetRole, extractionSource = 'unknown' }) {
  const cleanResume = normalizeSpace(resumeText);
  const cleanJd = normalizeSpace(jobDescription);

  if (!cleanResume) {
    return { ok: false, error: 'Resume text is empty. Upload a readable file.' };
  }

  if (!cleanJd) {
    return { ok: false, error: 'Job description is required to optimize resume.' };
  }

  const ats = scoreResumeAgainstJob({
    resumeText,
    jobDescription,
    targetRole,
  });

  if (!ats.ok) {
    return ats;
  }

  const lines = splitLines(resumeText);
  const profile = {
    name: pickName(lines),
    email: pickEmail(resumeText),
    phone: pickPhone(resumeText),
    linkedin: /https?:\/\/(www\.)?linkedin\.com\/in\/[^\s)]+/i.exec(resumeText)?.[0] || '',
    github: /https?:\/\/(www\.)?github\.com\/[^\s)]+/i.exec(resumeText)?.[0] || '',
  };

  const optimizedSummary = inferSummary({
    targetRole,
    resumeText,
    matchedKeywords: ats.data.keyword_stats.matched_keywords || [],
  });

  const skills = inferSkills({
    matchedKeywords: ats.data.keyword_stats.matched_keywords || [],
    missingKeywords: ats.data.keyword_stats.missing_keywords || [],
  });

  const experienceBullets = inferExperienceBullets({
    matchedKeywords: ats.data.keyword_stats.matched_keywords || [],
    missingKeywords: ats.data.keyword_stats.missing_keywords || [],
  });

  const projectBullets = inferProjectBullets({
    targetRole,
    matchedKeywords: ats.data.keyword_stats.matched_keywords || [],
    missingKeywords: ats.data.keyword_stats.missing_keywords || [],
  });

  const extractedBullets = inferBulletsFromResume({
    resumeText,
    matchedKeywords: ats.data.keyword_stats.matched_keywords || [],
    missingKeywords: ats.data.keyword_stats.missing_keywords || [],
  });

  const finalExperienceBullets = extractedBullets.experienceBullets.length
    ? extractedBullets.experienceBullets
    : experienceBullets;

  const finalProjectBullets = extractedBullets.projectBullets.length
    ? extractedBullets.projectBullets
    : projectBullets;

  const markdownResume = buildMarkdownResume({
    profile,
    optimizedSummary,
    skills,
    experienceBullets: finalExperienceBullets,
    projectBullets: finalProjectBullets,
  });

  const jsonResume = buildJsonResume({
    profile,
    optimizedSummary,
    skills,
    experienceBullets: finalExperienceBullets,
    projectBullets: finalProjectBullets,
  });

  return {
    ok: true,
    data: {
      ats: ats.data,
      profile,
      optimized_resume: {
        summary: optimizedSummary,
        skills,
        experience_bullets: finalExperienceBullets,
        project_bullets: finalProjectBullets,
        markdown: markdownResume,
      },
      exports: {
        reactive_resume_json: jsonResume,
        filename_base: `${(profile.name || 'optimized-resume').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'optimized-resume'}-2026`,
      },
      pipeline: buildPipelineMetadata(extractionSource),
      source: 'resume-studio-oss-pipeline-v1',
    },
  };
}

module.exports = {
  optimizeResumePackage,
};
