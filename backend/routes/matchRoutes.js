const express = require('express');
const { predictWithMl } = require('../services/mlPredictionClient');
const { predictPlacement } = require('../services/placementPredictionEngine');

const router = express.Router();

function average(values) {
  const list = values.map(Number).filter(Number.isFinite);
  if (!list.length) return 0;
  return Math.round(list.reduce((sum, value) => sum + value, 0) / list.length);
}

function buildReadinessInsights(student, predictions) {
  const best = predictions[0];
  const missingRequired = best?.missingSkills?.length || 0;
  const resumeScore = Number(student.resumeScore || student.atsScore || 0);
  const cgpa = Number(student.cgpa || 0);

  return [
    best ? `Your chances for ${best.job?.company || best.job?.name || 'the best-fit company'} are ${best.hiringProbability}%.` : 'Add an opening to calculate company-specific chances.',
    missingRequired ? `You are missing ${missingRequired} required skill${missingRequired > 1 ? 's' : ''} for your best role.` : 'No critical required-skill blocker was found for your best role.',
    resumeScore && resumeScore < 72 ? 'Resume quality is reducing prediction confidence.' : 'Resume quality is in a healthy range for screening.',
    cgpa >= Number(best?.job?.minimumCgpa || best?.job?.minCgpa || best?.job?.eligibility || 0) ? 'CGPA matches the company criteria.' : 'CGPA is below the best role cutoff.',
  ].filter(Boolean);
}

router.post('/placement', (req, res) => {
  return res.json(predictPlacement({
    student: req.body?.student || req.body || {},
    job: req.body?.job || {},
  }));
});

router.post('/predict', async (req, res) => {
  const student = req.body?.student || {};
  const job = req.body?.drive || req.body?.job || {};
  const result = predictPlacement({ student, job });

  try {
    const ml = await predictWithMl({
      ...student,
      applicationsCount: req.body?.datasetContext?.applicationsCount ?? student.applicationsCount,
    });

    return res.json({
      probability: ml.probability,
      shortlistProbability: ml.shortlist_probability,
      riskCategory: ml.risk_category,
      scoreBreakdown: {
        ...result.scoreBreakdown,
        mlAcademics: ml.score_breakdown?.academics,
        mlAttendance: ml.score_breakdown?.attendance,
        mlResume: ml.score_breakdown?.resume,
        mlPerformance: ml.score_breakdown?.performance,
        mlProof: ml.score_breakdown?.proof,
        mlActivity: ml.score_breakdown?.activity,
      },
      explanations: ml.explanations?.length ? ml.explanations : result.explanations,
      suggestions: ml.suggestions?.length ? ml.suggestions : result.suggestions,
      missingSkills: result.missingSkills,
      positiveFactors: (ml.explanations || result.explanations).filter((item) => /supports|improve|healthy|matches/i.test(item)),
      negativeFactors: (ml.explanations || result.explanations).filter((item) => /missing|reduced|below|need|risk/i.test(item)),
      modelUsed: ml.model_used || 'catboost-tabular-v1',
      catboostAvailable: Boolean(ml.catboost_available),
      fallbackReady: true,
      datasetContext: req.body?.datasetContext || null,
    });
  } catch {
    // Keep the demo reliable if the Python ML service is not running.
  }

  return res.json({
    probability: result.placementProbability,
    riskCategory: result.riskCategory,
    scoreBreakdown: result.scoreBreakdown,
    explanations: result.explanations,
    suggestions: result.suggestions,
    missingSkills: result.missingSkills,
    positiveFactors: result.explanations.filter((item) => /strongly|healthy|matches/i.test(item)),
    negativeFactors: result.explanations.filter((item) => /missing|reduced|below|need/i.test(item)),
    modelUsed: result.modelUsed,
    fallbackReady: true,
    datasetContext: req.body?.datasetContext || null,
  });
});

router.post('/role', (req, res) => {
  return res.json(predictPlacement({
    student: req.body?.student || {},
    job: req.body?.drive || req.body?.job || {},
  }));
});

router.post('/readiness', (req, res) => {
  const student = req.body?.student || {};
  const drives = Array.isArray(req.body?.drives) ? req.body.drives : [];
  const predictions = drives
    .map((drive) => ({
      ...predictPlacement({ student, job: drive }),
      job: {
        id: drive.id,
        company: drive.name || drive.company,
        role: drive.role,
        minimumCgpa: drive.minimumCgpa ?? drive.minCgpa ?? drive.eligibility,
      },
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
  const best = predictions[0] || null;

  return res.json({
    ok: true,
    readinessScore: best?.readinessScore || average([student.resumeScore, student.atsScore, Number(student.cgpa || 0) * 10]),
    matchPercentage: best?.matchScore || 0,
    selectionProbability: best?.hiringProbability || 0,
    resumeStrength: average([student.resumeScore, student.atsScore, student.keywordScore, student.formattingScore]),
    bestMatch: best,
    predictions,
    insights: buildReadinessInsights(student, predictions),
    engine: 'placify-explainable-readiness-v1',
  });
});

module.exports = router;
