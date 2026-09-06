// ATS scoring engine for resume vs job description comparison.
// Scoring approach is inspired by open-source ATS matching patterns used in:
// - https://github.com/srbhr/Resume-Matcher (Apache-2.0)

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have', 'in', 'is', 'it',
  'of', 'on', 'or', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'your', 'you', 'our', 'we',
  'this', 'these', 'those', 'their', 'them', 'they', 'its', 'if', 'but', 'not', 'can', 'should',
  'must', 'about', 'into', 'over', 'under', 'using', 'used', 'use', 'job', 'role', 'candidate',
  'responsibility', 'responsibilities', 'qualification', 'qualifications', 'required', 'preferred',
  'experience', 'strong', 'good', 'excellent', 'ability', 'team', 'work', 'working', 'knowledge',
  'years', 'year', 'etc', 'plus', 'including', 'need', 'needs',
]);

const COMMON_SKILL_TERMS = [
  'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'sql', 'nosql', 'mongodb',
  'postgresql', 'mysql', 'react', 'nextjs', 'node.js', 'node', 'express', 'fastapi', 'django',
  'spring', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'linux', 'git', 'github',
  'rest', 'api', 'microservices', 'html', 'css', 'tailwind', 'redux', 'pandas', 'numpy',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'power bi', 'tableau', 'excel',
  'spark', 'hadoop', 'ci/cd', 'jenkins', 'agile', 'jira', 'data structures', 'algorithms',
  'system design', 'oop', 'problem solving', 'communication', 'ownership',
];

const ACTION_VERBS = [
  'built', 'designed', 'implemented', 'developed', 'optimized', 'led', 'delivered', 'improved',
  'automated', 'deployed', 'analyzed', 'reduced', 'increased', 'created', 'launched', 'migrated',
];

function normalizeSpace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordInText(keyword, text) {
  const key = normalizeSpace(keyword).toLowerCase();
  const content = String(text || '').toLowerCase();
  if (!key || !content) return false;

  if (/^[a-z0-9]+$/.test(key)) {
    return new RegExp(`\\b${escapeRegex(key)}\\b`, 'i').test(content);
  }

  return new RegExp(`(^|[^a-z0-9])${escapeRegex(key)}(?=[^a-z0-9]|$)`, 'i').test(content);
}

function splitSentences(text) {
  return String(text || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
}

function tokenize(text) {
  return normalizeSpace(text)
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token) && !/^\d+$/.test(token));
}

function toTokenSet(text) {
  return new Set(tokenize(text));
}

function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  setA.forEach((item) => {
    if (setB.has(item)) intersection += 1;
  });
  const union = setA.size + setB.size - intersection;
  if (!union) return 0;
  return intersection / union;
}

function requirementWeight(sentence) {
  const s = sentence.toLowerCase();
  if (/(must|required|mandatory|need to|minimum)/i.test(s)) return 2.2;
  if (/(preferred|nice to have|plus|bonus)/i.test(s)) return 1.3;
  return 1.0;
}

function extractNgrams(tokens, n) {
  const grams = [];
  for (let i = 0; i <= tokens.length - n; i += 1) {
    const gram = tokens.slice(i, i + n).join(' ');
    if (gram.length >= 4) grams.push(gram);
  }
  return grams;
}

function extractWeightedKeywords(jobDescription, targetRole = '') {
  const jd = String(jobDescription || '').toLowerCase();
  const role = String(targetRole || '').toLowerCase();
  const sentences = splitSentences(`${role}. ${jd}`);
  const weighted = new Map();

  const addKeyword = (keyword, weight, sourceSentence = '') => {
    const key = normalizeSpace(keyword).toLowerCase();
    if (!key || key.length < 2 || STOP_WORDS.has(key)) return;

    const existing = weighted.get(key);
    if (!existing || existing.weight < weight) {
      weighted.set(key, {
        keyword: key,
        weight,
        category: requirementWeight(sourceSentence) > 1.5 ? 'required' : 'preferred',
      });
    }
  };

  COMMON_SKILL_TERMS.forEach((term) => {
    const matchesSentence = sentences.find((sentence) => keywordInText(term, sentence));
    if (matchesSentence) {
      addKeyword(term, 1.8 * requirementWeight(matchesSentence), matchesSentence);
    }
  });

  sentences.forEach((sentence) => {
    const w = requirementWeight(sentence);
    const tokens = tokenize(sentence).filter((t) => t.length >= 3);

    extractNgrams(tokens, 3).slice(0, 8).forEach((gram) => addKeyword(gram, 0.9 * w, sentence));
    extractNgrams(tokens, 2).slice(0, 10).forEach((gram) => addKeyword(gram, 0.8 * w, sentence));
    tokens.slice(0, 15).forEach((token) => addKeyword(token, 0.6 * w, sentence));
  });

  return Array.from(weighted.values())
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 120);
}

function scoreKeywordCoverage(resumeText, weightedKeywords) {
  if (!weightedKeywords.length) {
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: [],
      matchedCount: 0,
      totalKeywords: 0,
      requiredCoverage: 0,
      preferredCoverage: 0,
    };
  }

  let totalWeight = 0;
  let matchedWeight = 0;
  let requiredTotal = 0;
  let requiredMatched = 0;
  let preferredTotal = 0;
  let preferredMatched = 0;

  const matchedKeywords = [];
  const missingKeywords = [];

  weightedKeywords.forEach((item) => {
    totalWeight += item.weight;
    if (item.category === 'required') requiredTotal += item.weight;
    else preferredTotal += item.weight;

    if (keywordInText(item.keyword, resumeText)) {
      matchedWeight += item.weight;
      matchedKeywords.push(item.keyword);
      if (item.category === 'required') requiredMatched += item.weight;
      else preferredMatched += item.weight;
    } else {
      missingKeywords.push(item.keyword);
    }
  });

  const score = totalWeight ? (matchedWeight / totalWeight) * 100 : 0;
  const requiredCoverage = requiredTotal ? (requiredMatched / requiredTotal) * 100 : 0;
  const preferredCoverage = preferredTotal ? (preferredMatched / preferredTotal) * 100 : 0;

  return {
    score,
    matchedKeywords: Array.from(new Set(matchedKeywords)),
    missingKeywords: Array.from(new Set(missingKeywords)),
    matchedCount: Array.from(new Set(matchedKeywords)).length,
    totalKeywords: weightedKeywords.length,
    requiredCoverage,
    preferredCoverage,
  };
}

function semanticCoverageScore(resumeText, jobDescription) {
  const jdSentences = splitSentences(jobDescription);
  const resumeSentences = splitSentences(resumeText);
  if (!jdSentences.length || !resumeSentences.length) return 0;

  const resumeTokenSets = resumeSentences.map((sentence) => toTokenSet(sentence));

  let total = 0;
  jdSentences.forEach((sentence) => {
    const jdSet = toTokenSet(sentence);
    if (!jdSet.size) return;

    let best = 0;
    resumeTokenSets.forEach((resumeSet) => {
      const overlap = jaccardSimilarity(jdSet, resumeSet);
      if (overlap > best) best = overlap;
    });

    total += best;
  });

  return (total / jdSentences.length) * 100;
}

function extractYearsExperience(text) {
  const matches = [...String(text || '').matchAll(/(\d{1,2})\s*\+?\s*(years|year|yrs|yr)/gi)];
  if (!matches.length) return 0;
  return Math.max(...matches.map((match) => Number(match[1]) || 0));
}

function extractContactSignals(text) {
  const content = String(text || '');
  const email = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)?.[0] || '';
  const phone = content.match(/(\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/g)?.[0] || '';

  return {
    email,
    phone,
    hasLinkedIn: /linkedin\.com\/in\//i.test(content),
    hasGithub: /github\.com\//i.test(content),
  };
}

function sectionCompleteness(text) {
  const checks = {
    summary: /(summary|profile|objective)/i.test(text),
    experience: /(experience|employment|work history)/i.test(text),
    skills: /(skills|technical skills|competencies)/i.test(text),
    education: /(education|university|college|degree)/i.test(text),
    projects: /(projects|project experience)/i.test(text),
    certifications: /(certification|certifications|licenses)/i.test(text),
  };

  const weights = {
    summary: 10,
    experience: 25,
    skills: 20,
    education: 15,
    projects: 20,
    certifications: 10,
  };

  let achieved = 0;
  let total = 0;
  Object.entries(weights).forEach(([key, value]) => {
    total += value;
    if (checks[key]) achieved += value;
  });

  const sectionsFound = Object.entries(checks)
    .filter(([, value]) => value)
    .map(([key]) => key);

  return {
    score: total ? (achieved / total) * 100 : 0,
    checks,
    sectionsFound,
  };
}

function formatQualityScore(text, contactSignals) {
  const normalized = normalizeSpace(text);
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim());
  const bullets = lines.filter((line) => /^[-*•]/.test(line));

  const wordCount = normalized ? normalized.split(' ').length : 0;
  const actionBullets = bullets.filter((line) => ACTION_VERBS.some((verb) => new RegExp(`\\b${verb}\\b`, 'i').test(line)));
  const quantifiedBullets = bullets.filter((line) => /\d|%|\$|x|times|k|m|million|lakh|crore/i.test(line));

  let score = 0;
  if (contactSignals.email) score += 12;
  if (contactSignals.phone) score += 10;
  if (contactSignals.hasLinkedIn) score += 5;
  if (contactSignals.hasGithub) score += 3;

  if (bullets.length >= 6) score += 20;
  else if (bullets.length >= 3) score += 12;

  const quantifiedRatio = bullets.length ? quantifiedBullets.length / bullets.length : 0;
  score += Math.min(25, quantifiedRatio * 25);

  const actionRatio = bullets.length ? actionBullets.length / bullets.length : 0;
  score += Math.min(15, actionRatio * 15);

  if (wordCount >= 350 && wordCount <= 900) score += 10;
  else if (wordCount >= 220 && wordCount <= 1100) score += 6;

  return {
    score: Math.min(100, score),
    wordCount,
    bulletCount: bullets.length,
    quantifiedBulletCount: quantifiedBullets.length,
  };
}

function roleAlignmentScore(resumeText, targetRole) {
  const role = normalizeSpace(targetRole).toLowerCase();
  if (!role) return 60;

  const roleTokens = tokenize(role);
  if (!roleTokens.length) return 60;

  const resume = String(resumeText || '').toLowerCase();
  const matched = roleTokens.filter((token) => keywordInText(token, resume)).length;
  return (matched / roleTokens.length) * 100;
}

function generateRecommendations({ keywordStats, semanticScore, sectionInfo, formatInfo }) {
  const recommendations = [];

  if (keywordStats.requiredCoverage < 65) {
    recommendations.push(`Add required JD terms first: ${keywordStats.missingKeywords.slice(0, 8).join(', ')}.`);
  }

  if (keywordStats.preferredCoverage < 45) {
    recommendations.push('Include preferred stack terms naturally in experience/projects where genuinely applicable.');
  }

  if (semanticScore < 48) {
    recommendations.push('Mirror JD phrasing in summary and top bullets, especially responsibilities and outcomes.');
  }

  if (!sectionInfo.checks.skills || !sectionInfo.checks.projects) {
    recommendations.push('Ensure both Skills and Projects sections are present with concrete tool + impact details.');
  }

  if (formatInfo.quantifiedBulletCount < 2) {
    recommendations.push('Add quantified outcomes (%, time saved, users served, cost reduced) in bullet points.');
  }

  if (formatInfo.wordCount < 250) {
    recommendations.push('Resume is too short for ATS depth. Expand evidence in experience and projects.');
  }

  if (formatInfo.wordCount > 1100) {
    recommendations.push('Trim long text and keep bullets concise for parser readability.');
  }

  if (!recommendations.length) {
    recommendations.push('Strong alignment detected. Continue tailoring for each role and keep impact metrics updated.');
  }

  return recommendations;
}

function scoreResumeAgainstJob({ resumeText, jobDescription, targetRole }) {
  const resume = String(resumeText || '');
  const jd = String(jobDescription || '');

  if (!normalizeSpace(resume)) {
    return { ok: false, error: 'Resume text could not be extracted.' };
  }

  if (!normalizeSpace(jd)) {
    return { ok: false, error: 'Job description is required for ATS scoring.' };
  }

  const weightedKeywords = extractWeightedKeywords(jd, targetRole);
  const keywordStats = scoreKeywordCoverage(resume, weightedKeywords);
  const semanticScore = semanticCoverageScore(resume, jd);
  const sectionInfo = sectionCompleteness(resume);
  const contactSignals = extractContactSignals(resume);
  const formatInfo = formatQualityScore(resume, contactSignals);
  const roleScore = roleAlignmentScore(resume, targetRole);
  const yearsExperience = extractYearsExperience(resume);

  const overallScore = Math.round(
    keywordStats.score * 0.42 +
      semanticScore * 0.23 +
      sectionInfo.score * 0.16 +
      formatInfo.score * 0.12 +
      roleScore * 0.07,
  );

  const grade = overallScore >= 82 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 58 ? 'C' : 'D';

  const recommendations = generateRecommendations({
    keywordStats,
    semanticScore,
    sectionInfo,
    formatInfo,
  });

  return {
    ok: true,
    data: {
      overall_score: overallScore,
      grade,
      score_breakdown: {
        keyword_match: Number(keywordStats.score.toFixed(1)),
        semantic_similarity: Number(semanticScore.toFixed(1)),
        section_completeness: Number(sectionInfo.score.toFixed(1)),
        format_quality: Number(formatInfo.score.toFixed(1)),
        role_alignment: Number(roleScore.toFixed(1)),
      },
      keyword_stats: {
        total_keywords: keywordStats.totalKeywords,
        matched_count: keywordStats.matchedCount,
        matched_keywords: keywordStats.matchedKeywords,
        missing_keywords: keywordStats.missingKeywords,
        required_coverage: Number(keywordStats.requiredCoverage.toFixed(1)),
        preferred_coverage: Number(keywordStats.preferredCoverage.toFixed(1)),
      },
      extracted_profile: {
        email: contactSignals.email,
        phone: contactSignals.phone,
        has_linkedin: contactSignals.hasLinkedIn,
        has_github: contactSignals.hasGithub,
        years_experience: yearsExperience,
        sections_found: sectionInfo.sectionsFound,
        word_count: formatInfo.wordCount,
        bullet_count: formatInfo.bulletCount,
      },
      recommendations,
      source: 'ats-engine-weighted-v2',
      attribution: {
        inspired_by: 'srbhr/Resume-Matcher',
        license: 'Apache-2.0',
      },
    },
  };
}

module.exports = {
  scoreResumeAgainstJob,
};
