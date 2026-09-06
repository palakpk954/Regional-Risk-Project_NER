const express = require('express');
const { evaluateMockInterview, generateMockQuestions } = require('../services/mockInterviewEngine');

const router = express.Router();

router.post('/questions', async (req, res) => {
  const result = await generateMockQuestions({
    role: String(req.body?.role || 'Software Engineer Intern'),
    profile: req.body?.profile || {},
    focusAreas: Array.isArray(req.body?.focusAreas) ? req.body.focusAreas : [],
    apiKey: String(req.body?.apiKey || ''),
    jobDescription: String(req.body?.jobDescription || ''),
  });

  return res.json(result);
});

router.post('/evaluate', async (req, res) => {
  const result = await evaluateMockInterview({
    role: String(req.body?.role || 'Software Engineer Intern'),
    profile: req.body?.profile || {},
    answers: Array.isArray(req.body?.answers) ? req.body.answers : [],
    apiKey: String(req.body?.apiKey || ''),
    jobDescription: String(req.body?.jobDescription || ''),
  });

  return res.json(result);
});

module.exports = router;
