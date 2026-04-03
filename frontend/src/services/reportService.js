import { generateReportAiInsights } from './engineService.js';

export function generateSummaryText(engine, simulation) {
  const aiInsights = generateReportAiInsights(engine, simulation);
  const lines = [
    'Placify AI - Placement Intelligence & Simulation Report',
    '',
    `Total Students: ${engine.kpis.totalStudents}`,
    `Placed: ${engine.kpis.placedStudents}`,
    `Placement Rate: ${engine.kpis.placementRate}%`,
    `Top Company: ${engine.topCompany ? `${engine.topCompany.name} (${engine.topCompany.value})` : 'N/A'}`,
    `Top Branch: ${engine.topBranch ? `${engine.topBranch.branch} (${engine.topBranch.rate}%)` : 'N/A'}`,
    `Risk Students: ${engine.atRiskStudents.length}`,
    `Top Tech Companies Detected: ${engine.companyIntelligence?.detectedTopTechCompanies || 0}/${engine.companyIntelligence?.totalDistinctCompanies || 0}`,
    `Tech Company Catalog Size: ${engine.companyIntelligence?.catalogSize || 0}+`,
    `Tech Selection Share: ${engine.companyIntelligence?.techSelectionRate || 0}%`,
    '',
    'Engine Insights:',
    ...engine.insights.map((line) => `- ${line}`),
    '',
    'Simulation Results:',
    `- Branch Filter: ${simulation?.controls?.branchFilter ?? 'All'}`,
    `- CGPA Threshold: ${simulation?.controls?.cgpaThreshold ?? 7}`,
    `- Baseline Rate: ${simulation?.baselineRate ?? engine.kpis.placementRate}%`,
    `- New Rate: ${simulation?.projectedPlacementRate ?? engine.kpis.placementRate}%`,
    `- Delta: ${simulation?.delta ?? 0}%`,
    `- Affected Students: ${simulation?.studentsAffected ?? 0}`,
    ...(simulation?.insights || []).map((line) => `- ${line}`),
    '',
    'Prediction:',
    `Forecasted Next Cycle Rate: ${engine.prediction?.predictedPlacementRate || engine.kpis.placementRate}%`,
    '',
    'AI Copilot Insights:',
    ...aiInsights.flatMap((item, index) => [
      `- AI Insight ${index + 1}: ${item.insight}`,
      `  Reason: ${item.reason}`,
      `  Suggestion: ${item.suggestion}`,
    ]),
    '',
    'Company Distribution:',
    ...engine.companyDistribution.map((row) => `- ${row.name}: ${row.value}`),
    '',
    'Auto Detected Top Tech Companies:',
    ...(engine.companyIntelligence?.topDetectedCompanies || []).map((row) => `- ${row.companyName} (score ${row.score})`),
  ];

  return lines.join('\n');
}

export function downloadTextReport(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
