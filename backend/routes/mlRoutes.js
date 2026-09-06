const express = require('express');
const multer = require('multer');
const { predictCampusStats } = require('../services/campusPredictorEngine');
const { extractResumeTextFromFile } = require('../services/resumeTextExtractor');
const { scoreResumeAgainstJob } = require('../services/atsScorerEngine');
const { optimizeResumePackage } = require('../services/ossResumeOptimizer');
const { extractResumeSignalsFromText } = require('../services/resumeSignalExtractor');
const { evaluateMockInterview, generateMockQuestions } = require('../services/mockInterviewEngine');
const { predictPlacement } = require('../services/placementPredictionEngine');
const { buildInstitutionalIntelligence } = require('../services/institutionalIntelligenceEngine');
const { shouldAttemptPaddleOcr } = require('../services/paddleOcrBridge');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatus(value) {
  const key = String(value || '').toLowerCase();
  if (key.includes('unplaced') || key.includes('not placed') || key.includes('reject')) return 'Rejected';
  if (key.includes('select') || key.includes('place') || key.includes('offer') || key.includes('hire')) return 'Selected';
  if (key.includes('interview') || key.includes('shortlist')) return 'Interview';
  return 'Applied';
}

function safeRate(part, total) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

router.post('/student-predict', (req, res) => {
  const body = req.body || {};

  const tier = toNumber(body.tier, 2);
  const cgpa = toNumber(body.cgpa, 0);
  const internships = toNumber(body.internships, 0);
  const projects = toNumber(body.no_of_projects, 0);
  const langs = toNumber(body.no_of_programming_languages, 0);
  const dsa = toNumber(body.dsa, 0);
  const webDev = toNumber(body.web_dev, 0);
  const ml = toNumber(body['Machine Learning'] ?? body.machine_learning, 0);
  const cloud = toNumber(body.cloud, 0);
  const hackathon = toNumber(body.is_participate_hackathon, 0);
  const extracurricular = toNumber(body.is_participated_extracurricular, 0);

  const score =
    cgpa * 7.5 +
    internships * 4 +
    projects * 2.8 +
    langs * 1.7 +
    (dsa ? 9 : 0) +
    (webDev ? 7 : 0) +
    (ml ? 6 : 0) +
    (cloud ? 5 : 0) +
    (hackathon ? 3 : 0) +
    (extracurricular ? 2 : 0) +
    (tier <= 1 ? 10 : tier === 2 ? 5 : 0);

  const placementProbability = clamp(Number((score / 1.6).toFixed(1)), 5, 98);
  const predictedSalary = Number((2.4 + placementProbability / 20 + internships * 0.35 + projects * 0.18 + ml * 0.6).toFixed(2));

  return res.json({
    is_placed: placementProbability >= 55 ? 1 : 0,
    placement_probability: placementProbability,
    predicted_salary: predictedSalary,
    top_improvement_factors: [
      'Improve CGPA consistency',
      'Increase project depth',
      'Strengthen DSA for interview rounds',
      'Add role-aligned internship experience',
    ],
    model_used: 'node-ml-stub-v1',
  });
});

router.post('/campus-predict', (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

  const prediction = predictCampusStats(rows);
  if (!prediction.ok) {
    return res.status(400).json({
      message: prediction.error,
    });
  }

  return res.json(prediction.data);
});

router.post('/resume-parse', upload.single('resume'), async (req, res) => {
  const extracted = await extractResumeTextFromFile(req.file, {
    preferOcrForPdf: true,
  });

  if (!extracted.ok) {
    return res.status(400).json({ message: extracted.error });
  }

  const parsedSignals = extractResumeSignalsFromText(extracted.text);
  if (!parsedSignals.ok) {
    return res.status(400).json({ message: parsedSignals.error });
  }

  return res.json({
    ...parsedSignals.data,
    extraction_source: extracted.source || 'unknown',
  });
});

router.get('/ocr-status', (req, res) => {
  const disabled = ['0', 'false', 'no', 'off'].includes(String(process.env.ENABLE_PADDLE_OCR || '').toLowerCase());
  res.json({
    available: !disabled,
    engine: 'PaddleOCR',
    mode: disabled ? 'disabled' : 'auto-attempt',
    supportedFiles: ['pdf with low embedded text', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'],
    note: disabled
      ? 'Set ENABLE_PADDLE_OCR=true or remove the false flag to allow OCR attempts.'
      : 'OCR is attempted for images and low-text PDFs when PaddleOCR is installed in the configured Python environment.',
    canAttemptImage: shouldAttemptPaddleOcr('resume.png'),
    canAttemptPdf: shouldAttemptPaddleOcr('resume.pdf', { preferOcrForPdf: true }),
  });
});

router.post('/ats-score', upload.single('resume'), async (req, res) => {
  const jobDescription = String(req.body?.jobDescription || '');
  const targetRole = String(req.body?.targetRole || '');

  const extracted = await extractResumeTextFromFile(req.file);
  if (!extracted.ok) {
    return res.status(400).json({ message: extracted.error });
  }

  const scoring = scoreResumeAgainstJob({
    resumeText: extracted.text,
    jobDescription,
    targetRole,
  });

  if (!scoring.ok) {
    return res.status(400).json({ message: scoring.error });
  }

  return res.json(scoring.data);
});

router.post('/resume-optimize', upload.single('resume'), async (req, res) => {
  const jobDescription = String(req.body?.jobDescription || '');
  const targetRole = String(req.body?.targetRole || '');

  const extracted = await extractResumeTextFromFile(req.file, {
    preferOcrForPdf: true,
  });

  if (!extracted.ok) {
    return res.status(400).json({ message: extracted.error });
  }

  const optimized = optimizeResumePackage({
    resumeText: extracted.text,
    jobDescription,
    targetRole,
    extractionSource: extracted.source || 'unknown',
  });

  if (!optimized.ok) {
    return res.status(400).json({ message: optimized.error });
  }

  return res.json(optimized.data);
});

router.post('/recommend-skills', (req, res) => {
  const body = req.body || {};
  const suggestions = [];

  if (!toNumber(body.dsa, 0)) suggestions.push('Data Structures and Algorithms');
  if (!toNumber(body.web_dev, 0)) suggestions.push('Web Development Projects');
  if (!toNumber(body['Machine Learning'] ?? body.machine_learning, 0)) suggestions.push('Machine Learning Basics');
  if (!toNumber(body.cloud, 0)) suggestions.push('Cloud Fundamentals');
  if (toNumber(body.no_of_projects, 0) < 3) suggestions.push('Build at least 3 quality projects');
  if (toNumber(body.internships, 0) < 1) suggestions.push('Gain internship experience');

  return res.json({
    recommended_skills: suggestions,
    source: 'node-ml-stub-v1',
  });
});

router.post('/placement-predict', (req, res) => {
  return res.json(predictPlacement({
    student: req.body?.student || req.body || {},
    job: req.body?.job || {},
  }));
});

router.post('/ops-intelligence', (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) {
    return res.status(400).json({ message: 'rows array is required for operations intelligence.' });
  }

  return res.json(buildInstitutionalIntelligence({
    rows,
    criteria: req.body?.criteria || {},
  }));
});

router.post('/mock-interview/questions', async (req, res) => {
  const role = String(req.body?.role || 'Software Engineer Intern');
  const profile = req.body?.profile || {};
  const focusAreas = Array.isArray(req.body?.focusAreas) ? req.body.focusAreas : [];
  const apiKey = String(req.body?.apiKey || '');
  const jobDescription = String(req.body?.jobDescription || '');

  const result = await generateMockQuestions({ role, profile, focusAreas, apiKey, jobDescription });
  return res.json(result);
});

router.post('/mock-interview/evaluate', async (req, res) => {
  const role = String(req.body?.role || 'Software Engineer Intern');
  const profile = req.body?.profile || {};
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const apiKey = String(req.body?.apiKey || '');
  const jobDescription = String(req.body?.jobDescription || '');

  const result = await evaluateMockInterview({ role, profile, answers, apiKey, jobDescription });
  return res.json(result);
});

module.exports = router;
