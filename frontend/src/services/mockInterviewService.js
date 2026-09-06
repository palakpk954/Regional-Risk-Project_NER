import axios from 'axios';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: `${BACKEND_BASE}/api/interview`,
  timeout: 20000,
});

const fallbackQuestions = [
  {
    id: 'q1',
    type: 'HR',
    question: 'Tell me about yourself and the role you are targeting.',
    expectedSignals: ['clear introduction', 'role motivation'],
  },
  {
    id: 'q2',
    type: 'Resume',
    question: 'Walk me through your strongest project and the impact it created.',
    expectedSignals: ['project clarity', 'impact'],
  },
  {
    id: 'q3',
    type: 'Technical',
    question: 'Explain a technical concept you used recently and why it mattered.',
    expectedSignals: ['technical accuracy', 'practical example'],
  },
  {
    id: 'q4',
    type: 'Behavioral',
    question: 'Tell me about a time you handled a difficult deadline.',
    expectedSignals: ['ownership', 'communication'],
  },
  {
    id: 'q5',
    type: 'Technical',
    question: 'Pick one required skill for this role and explain how you used it in a project.',
    expectedSignals: ['role alignment', 'technical clarity'],
  },
  {
    id: 'q6',
    type: 'Project',
    question: 'If your project had to support real users tomorrow, what would you improve first?',
    expectedSignals: ['practical judgement', 'system thinking'],
  },
  {
    id: 'q7',
    type: 'Behavioral',
    question: 'Tell me about a moment when feedback changed how you worked.',
    expectedSignals: ['self-awareness', 'coachability'],
  },
];

function sanitizeQuestions(questions) {
  const normalized = Array.isArray(questions)
    ? questions
      .filter((item) => item && item.question)
      .slice(0, 7)
      .map((item, index) => ({
        id: String(item.id || `q${index + 1}`),
        type: String(item.type || 'Technical'),
        question: String(item.question || '').trim(),
        expectedSignals: Array.isArray(item.expectedSignals) ? item.expectedSignals.slice(0, 4) : [],
      }))
    : [];

  return normalized.length ? normalized : fallbackQuestions;
}

export async function generateInterviewQuestions(payload) {
  try {
    const { data } = await api.post('/questions', payload);
    return {
      questions: sanitizeQuestions(data.questions),
      source: data.source || 'backend',
    };
  } catch {
    return { questions: fallbackQuestions, source: 'local-ui-fallback' };
  }
}

export async function evaluateInterview(payload) {
  try {
    const { data } = await api.post('/evaluate', payload);
    return data;
  } catch {
    const answers = Array.isArray(payload.answers) ? payload.answers : [];
    const wordCount = answers.map((item) => item.answer || '').join(' ').split(/\s+/).filter(Boolean).length;
    return {
      confidenceScore: Math.min(92, Math.max(45, 50 + wordCount)),
      communicationScore: Math.min(90, Math.max(48, 56 + Math.round(wordCount * 0.55))),
      technicalReadinessScore: Math.min(88, Math.max(42, 52 + answers.length * 6)),
      feedback: 'Fallback feedback: answers were captured successfully. Add specific project outcomes and technical tradeoffs to improve.',
      strengths: ['Completed the interview flow', 'Showed role intent'],
      improvements: ['Use STAR format', 'Mention measurable outcomes', 'Add deeper technical examples'],
      weakTopics: ['Answer depth', 'Role-specific examples'],
      scoreReasons: ['Fallback scoring rewards complete, specific answers with project and technical evidence.'],
      source: 'local-ui-fallback',
    };
  }
}
