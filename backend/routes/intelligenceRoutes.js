const express = require('express');
const { buildInstitutionalIntelligence } = require('../services/institutionalIntelligenceEngine');
const { getMlStatus } = require('../services/mlPredictionClient');
const { buildPredictionSummary } = require('../services/placementPredictionEngine');

const router = express.Router();

function build(req, res) {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) {
    return res.status(400).json({ message: 'rows array is required for placement intelligence.' });
  }

  return res.json(buildInstitutionalIntelligence({
    rows,
    criteria: req.body?.criteria || {},
  }));
}

router.post('/ops', build);

router.get('/prediction-summary', async (req, res) => {
  const summary = buildPredictionSummary();
  const mlStatus = await getMlStatus();
  return res.json({
    ...summary,
    activeModel: mlStatus.active_model || summary.activeModel,
    preferredModel: mlStatus.preferred_model || summary.preferredModel,
    catBoost: {
      ...summary.catBoost,
      status: mlStatus.active_model === 'catboost-tabular-v1' ? 'active' : summary.catBoost.status,
      artifactPresent: Boolean(mlStatus.catboost_artifact_present),
      available: Boolean(mlStatus.catboost_available),
      fallbackReady: Boolean(mlStatus.fallback_ready),
      error: mlStatus.error,
    },
  });
});

router.post('/eligibility', (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) {
    return res.status(400).json({ message: 'rows array is required for eligibility scoring.' });
  }

  const result = buildInstitutionalIntelligence({
    rows,
    criteria: req.body?.criteria || {},
  });

  return res.json({
    source: 'placify-eligibility-rules-v1',
    totalStudents: result.totalStudents,
    eligibleStudents: result.eligibleStudents,
    ineligibleStudents: result.ineligibleStudents,
    eligibilityRate: result.eligibilityRate,
    students: result.riskRows.map((student) => ({
      name: student.name,
      enrollment: student.enrollment,
      branch: student.branch,
      eligibility: student.eligibility,
    })),
  });
});

router.post('/risk', (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) {
    return res.status(400).json({ message: 'rows array is required for risk scoring.' });
  }

  const result = buildInstitutionalIntelligence({
    rows,
    criteria: req.body?.criteria || {},
  });

  return res.json({
    source: 'placify-risk-rules-v1',
    atRiskStudents: result.atRiskStudents,
    students: result.riskRows.map((student) => ({
      name: student.name,
      enrollment: student.enrollment,
      branch: student.branch,
      risk: student.risk,
      eligibility: student.eligibility,
    })),
  });
});

module.exports = router;
