const express = require('express');
const { buildInstitutionalIntelligence } = require('../services/institutionalIntelligenceEngine');

const router = express.Router();

function normalizeStatus(value) {
  const key = String(value || '').toLowerCase();
  if (key.includes('unplaced') || key.includes('not placed') || key.includes('reject')) return 'Unplaced';
  if (key.includes('placed') || key.includes('selected') || key.includes('offer')) return 'Placed';
  if (key.includes('short')) return 'Shortlisted';
  if (key.includes('interview')) return 'Interview';
  return 'Unplaced';
}

router.post('/summary', (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) {
    return res.status(400).json({ message: 'rows array is required for report generation.' });
  }

  const intelligence = buildInstitutionalIntelligence({
    rows,
    criteria: req.body?.criteria || {},
  });

  const companyStats = rows.reduce((acc, row) => {
    const company = row.company || row.companyName || row.employer || 'Unassigned';
    if (!acc[company]) acc[company] = { company, total: 0, placed: 0 };
    acc[company].total += 1;
    if (normalizeStatus(row.status || row.placementStatus) === 'Placed') acc[company].placed += 1;
    return acc;
  }, {});

  return res.json({
    title: 'Placify AI Placement Intelligence Report',
    generatedAt: new Date().toISOString(),
    source: 'placify-report-summary-v1',
    totals: {
      totalStudents: intelligence.totalStudents,
      eligibleStudents: intelligence.eligibleStudents,
      ineligibleStudents: intelligence.ineligibleStudents,
      atRiskStudents: intelligence.atRiskStudents,
      noResumeStudents: intelligence.noResumeStudents,
      duplicateRows: intelligence.duplicateRows,
      eligibilityRate: intelligence.eligibilityRate,
    },
    branchStats: intelligence.branches,
    companyStats: Object.values(companyStats),
    readinessSummary: {
      highChance: intelligence.riskRows.filter((student) => student.risk.category === 'High Chance').length,
      medium: intelligence.riskRows.filter((student) => student.risk.category === 'Medium').length,
      atRisk: intelligence.riskRows.filter((student) => student.risk.category === 'At Risk').length,
    },
    atRiskList: intelligence.riskRows.filter((student) => student.risk.category === 'At Risk').slice(0, 25),
    insights: intelligence.insights,
  });
});

module.exports = router;
