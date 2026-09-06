const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function buildFallbackQuestions({ role, profile, focusAreas }) {
  const name = profile?.name || 'candidate';
  const focus = Array.isArray(focusAreas) && focusAreas.length ? focusAreas.join(', ') : 'DSA, projects, communication';
  return [
    {
      id: 'q_hr_1',
      type: 'HR',
      question: `Tell me about yourself and why you are interested in the ${role} role.`,
      expectedSignals: ['clear introduction', 'role motivation', 'confidence'],
    },
    {
      id: 'q_resume_1',
      type: 'Resume',
      question: `${name}, choose one project from your resume and explain the problem, tech stack, and measurable outcome.`,
      expectedSignals: ['project clarity', 'technical ownership', 'impact'],
    },
    {
      id: 'q_technical_1',
      type: 'Technical',
      question: `For ${role}, explain one concept from ${focus} that you are confident about and where you used it.`,
      expectedSignals: ['technical accuracy', 'example-based answer'],
    },
    {
      id: 'q_behavioral_1',
      type: 'Behavioral',
      question: 'Describe a time you got stuck while building or learning something. How did you recover?',
      expectedSignals: ['problem solving', 'reflection', 'resilience'],
    },
    {
      id: 'q_project_1',
      type: 'Project',
      question: 'If you had two more weeks to improve your best project, what would you add and why?',
      expectedSignals: ['prioritization', 'product thinking', 'technical roadmap'],
    },
    {
      id: 'q_technical_2',
      type: 'Technical',
      question: `Take one requirement for ${role} and explain how you would prove that skill in a project or interview.`,
      expectedSignals: ['role alignment', 'practical implementation', 'clear reasoning'],
    },
    {
      id: 'q_behavioral_2',
      type: 'Behavioral',
      question: 'Tell me about a time you received feedback on your work. What changed after that?',
      expectedSignals: ['coachability', 'self-awareness', 'specific improvement'],
    },
  ];
}

function scoreAnswers(answers = []) {
  const joined = answers.map((answer) => String(answer.answer || '')).join(' ');
  const wordCount = joined.split(/\s+/).filter(Boolean).length;
  const hasExamples = /project|intern|built|implemented|created|deployed|measured/i.test(joined);
  const technicalTerms = (joined.match(/react|node|sql|api|model|database|algorithm|python|java|cloud|docker|system/gi) || []).length;

  const confidenceScore = Math.min(94, Math.max(42, 48 + wordCount * 0.8 + (hasExamples ? 10 : 0)));
  const communicationScore = Math.min(94, Math.max(45, 52 + Math.min(wordCount, 90) * 0.45));
  const technicalReadinessScore = Math.min(95, Math.max(40, 46 + technicalTerms * 6 + (hasExamples ? 8 : 0)));

  return {
    confidenceScore: Math.round(confidenceScore),
    communicationScore: Math.round(communicationScore),
    technicalReadinessScore: Math.round(technicalReadinessScore),
    feedback:
      wordCount < 70
        ? 'Answers are understandable, but need more depth, examples, and measurable outcomes.'
        : 'Good response depth. Improve by structuring answers with situation, action, impact, and technical tradeoffs.',
    strengths: hasExamples ? ['Uses examples from projects or experience', 'Shows practical ownership'] : ['Clear basic intent'],
    improvements: [
      'Use STAR format for behavioral answers',
      'Quantify project results wherever possible',
      'Add one role-specific technical example per answer',
    ],
    weakTopics: [
      wordCount < 70 ? 'Answer depth' : null,
      technicalTerms < 4 ? 'Role-specific technical proof' : null,
      hasExamples ? null : 'Project and internship examples',
    ].filter(Boolean),
    scoreReasons: [
      wordCount < 70
        ? 'Short answers lowered communication and confidence scores.'
        : 'Detailed answers improved communication and confidence scores.',
      technicalTerms < 4
        ? 'Limited technical vocabulary reduced technical readiness.'
        : 'Technical examples improved readiness confidence.',
      hasExamples
        ? 'Project or experience examples made answers more believable.'
        : 'Missing concrete examples reduced placement readiness confidence.',
    ],
    source: 'local-fallback-v1',
  };
}

async function callGemini(prompt, apiKey) {
  const key = String(apiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!key) return null;

  const response = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.72, topP: 0.9, responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  return parseGeminiJson(text);
}

function parseGeminiJson(text) {
  const raw = String(text || '').trim();
  const stripped = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(stripped.slice(start, end + 1));
    }
    throw new Error('Gemini did not return valid JSON.');
  }
}

function normalizeQuestions(questions = []) {
  return questions
    .filter((item) => item && typeof item === 'object' && item.question)
    .slice(0, 7)
    .map((item, index) => ({
      id: String(item.id || `q${index + 1}`),
      type: String(item.type || 'Technical'),
      question: String(item.question || '').trim(),
      expectedSignals: Array.isArray(item.expectedSignals) ? item.expectedSignals.slice(0, 4).map(String) : [],
    }));
}

async function generateQuestionsWithGemini(context) {
  const prompt = `You are Placify AI, a strict but supportive placement interviewer for Indian college students.
Create a realistic company-role mock interview that feels like an actual campus placement round.

Role: ${context.role}
Candidate profile: ${JSON.stringify(context.profile || {})}
Job description: ${context.jobDescription || 'Not provided'}
Focus areas: ${(context.focusAreas || []).join(', ')}

Rules:
- Ask practical questions, not generic textbook trivia.
- Include resume/project follow-ups when profile data exists.
- Include one DSA/problem-solving question if relevant to the role.
- Include one behavioral question with a STAR-format expectation.
- Make questions concise and interview-ready.
- Expected signals must say what a strong answer should demonstrate.

Return only JSON:
{
  "questions": [
    { "id": "q1", "type": "HR|Technical|Resume|Behavioral|Project", "question": "...", "expectedSignals": ["...", "..."] }
  ],
  "source": "gemini"
}
Create exactly 7 questions.`;

  const result = await callGemini(prompt, context.apiKey);
  const questions = normalizeQuestions(result?.questions);
  if (!questions.length) return null;
  return { questions, source: 'gemini' };
}

async function evaluateWithGemini(context) {
  const prompt = `You are Placify AI evaluating a mock placement interview.
Be honest, specific, and useful. Do not overpraise. Explain what lowered each score.

Role: ${context.role}
Candidate profile: ${JSON.stringify(context.profile || {})}
Job description: ${context.jobDescription || 'Not provided'}
Answers: ${JSON.stringify(context.answers || [])}

Return only JSON:
{
  "confidenceScore": number,
  "communicationScore": number,
  "technicalReadinessScore": number,
  "feedback": "short paragraph",
  "strengths": ["..."],
  "improvements": ["..."],
  "weakTopics": ["..."],
  "scoreReasons": ["..."],
  "source": "gemini"
}`;

  const result = await callGemini(prompt, context.apiKey);
  if (!result) return null;
  return {
    confidenceScore: Number(result.confidenceScore || 0),
    communicationScore: Number(result.communicationScore || 0),
    technicalReadinessScore: Number(result.technicalReadinessScore || 0),
    feedback: result.feedback || '',
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    improvements: Array.isArray(result.improvements) ? result.improvements : [],
    weakTopics: Array.isArray(result.weakTopics) ? result.weakTopics : [],
    scoreReasons: Array.isArray(result.scoreReasons) ? result.scoreReasons : [],
    source: 'gemini',
  };
}

async function generateMockQuestions(context) {
  try {
    const gemini = await generateQuestionsWithGemini(context);
    if (gemini) return gemini;
  } catch {
    // Demo fallback keeps viva flow working without API configuration.
  }

  return {
    questions: buildFallbackQuestions(context),
    source: 'local-fallback-v1',
  };
}

async function evaluateMockInterview(context) {
  try {
    const gemini = await evaluateWithGemini(context);
    if (gemini) return gemini;
  } catch {
    // Demo fallback keeps viva flow working without API configuration.
  }

  return scoreAnswers(context.answers);
}

module.exports = {
  generateMockQuestions,
  evaluateMockInterview,
};
