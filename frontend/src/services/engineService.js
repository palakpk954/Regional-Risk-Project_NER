import {
  analyzeCompanyIntelligence,
  detectCompanyQuality,
  normalizeCompanyName,
} from './companyIntelService.js';

const PLACED_STATUS = 'Selected';
const DEFAULT_SIMULATION = {
  cgpaThreshold: 7,
  branchFilter: 'All',
};

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toNumber(value) {
  const numeric = Number(String(value ?? '').replace(/,/g, '.'));
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : 0;
}

function safeRate(part, total) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

function normalizeStatus(value) {
  const key = normalizeKey(value);
  if (key.includes('select') || key.includes('place') || key.includes('offer') || key.includes('hire')) {
    return 'Selected';
  }
  if (key.includes('interview') || key.includes('shortlist')) {
    return 'Interview';
  }
  return 'Applied';
}

function buildCopilotResponse(insight, reason, suggestion) {
  return {
    insight,
    reason,
    suggestion,
  };
}

function isRowEmpty(row) {
  return !Object.values(row || {}).some((value) => normalizeText(value));
}

export function normalizeEngineRows(inputRows) {
  const rows = Array.isArray(inputRows?.students)
    ? inputRows.students
    : Array.isArray(inputRows)
      ? inputRows
      : [];

  const cleaned = rows
    .filter((row) => row && !isRowEmpty(row))
    .map((row, index) => {
      const name = normalizeText(row.name || row.studentName || `Student ${index + 1}`);
      const email = normalizeText(row.email || `${name.toLowerCase().replace(/\s+/g, '.')}@local.demo`).toLowerCase();
      const cgpa = toNumber(row.cgpa);
      const branch = normalizeText(row.branch || 'Unknown');
      const company = normalizeText(row.company || 'Unassigned');
      const status = normalizeStatus(row.status);

      return {
        id: normalizeText(row.id || `engine_${index + 1}`),
        name,
        email,
        cgpa,
        branch,
        company,
        status,
      };
    });

  const deduped = new Map();
  cleaned.forEach((student) => {
    const key = normalizeKey(student.email || student.name);
    if (!key) return;

    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, student);
      return;
    }

    if (existing.status !== PLACED_STATUS && student.status === PLACED_STATUS) {
      deduped.set(key, student);
    }
  });

  return Array.from(deduped.values());
}

function computeCompanyDistribution(students) {
  const map = new Map();

  students.forEach((student) => {
    if (student.status !== PLACED_STATUS) return;
    if (!student.company || student.company === 'Unassigned') return;

    map.set(student.company, (map.get(student.company) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value - a.value) || a.name.localeCompare(b.name));
}

function computeBranchPerformance(students) {
  const map = new Map();

  students.forEach((student) => {
    const key = student.branch || 'Unknown';
    if (!map.has(key)) {
      map.set(key, { branch: key, total: 0, placed: 0, rate: 0 });
    }

    const item = map.get(key);
    item.total += 1;
    if (student.status === PLACED_STATUS) item.placed += 1;
    item.rate = safeRate(item.placed, item.total);
  });

  return Array.from(map.values())
    .filter((item) => item.total > 0)
    .sort((a, b) => (b.rate - a.rate) || (b.placed - a.placed));
}

function computeCgpaCorrelation(students) {
  const buckets = [
    { bucket: '<6', min: -Infinity, max: 6 },
    { bucket: '6-7', min: 6, max: 7 },
    { bucket: '7-8', min: 7, max: 8 },
    { bucket: '8+', min: 8, max: Infinity },
  ];

  return buckets.map((range) => {
    const grouped = students.filter((student) => student.cgpa >= range.min && student.cgpa < range.max);
    const placed = grouped.filter((student) => student.status === PLACED_STATUS).length;

    return {
      bucket: range.bucket,
      total: grouped.length,
      placed,
      rate: safeRate(placed, grouped.length),
    };
  });
}

function computeAtRisk(students) {
  return students
    .filter((student) => student.cgpa < 7 && student.status !== PLACED_STATUS)
    .map((student) => ({
      id: student.id,
      name: student.name,
      branch: student.branch,
      cgpa: student.cgpa,
      company: student.company,
      riskScore: Math.min(100, Math.round((7 - student.cgpa) * 30 + (student.company === 'Unassigned' ? 25 : 10))),
    }))
    .sort((a, b) => b.riskScore - a.riskScore || a.name.localeCompare(b.name));
}

function computePrediction(students, placementRate) {
  const highCgpaShare = safeRate(students.filter((student) => student.cgpa >= 8).length, students.length);
  const readinessScore = Number((placementRate * 0.6 + highCgpaShare * 0.4).toFixed(1));
  const predictedPlacementRate = Number(Math.max(0, Math.min(100, placementRate + (highCgpaShare - 40) / 8)).toFixed(1));

  return {
    readinessScore,
    predictedPlacementRate,
    trend: predictedPlacementRate >= placementRate ? 'improving' : 'declining',
  };
}

function buildInsights({
  students,
  branchPerformance,
  companyDistribution,
  cgpaCorrelation,
  placementRate,
  companyIntelligence,
}) {
  const lowBand = cgpaCorrelation.find((item) => item.bucket === '<6');
  const lowBandRate = lowBand ? lowBand.rate : 0;
  const topBranch = branchPerformance[0] || null;
  const topCompany = companyDistribution[0] || null;
  const riskCount = students.filter((student) => student.cgpa < 7 && student.status !== PLACED_STATUS).length;
  const techDetected = companyIntelligence?.detectedTopTechCompanies || 0;
  const totalCompanies = companyIntelligence?.totalDistinctCompanies || 0;
  const catalogSize = companyIntelligence?.catalogSize || 0;

  return [
    `Students below 6 CGPA have ${lowBandRate}% placement conversion.`,
    topBranch
      ? `${topBranch.branch} is the top branch with ${topBranch.rate}% placement rate.`
      : 'No branch trend available yet.',
    topCompany
      ? `${topCompany.name} is the top hiring company with ${topCompany.value} selections.`
      : 'No selected-company trend available yet.',
    `Auto company intelligence matched ${techDetected}/${totalCompanies} imported companies against a ${catalogSize}+ tech-company index.`,
    `Current overall placement rate is ${placementRate}%, with ${riskCount} students flagged as at-risk.`,
  ];
}

export function runPlacementEngine(inputRows) {
  const students = normalizeEngineRows(inputRows);
  const totalStudents = students.length;
  const placedStudents = students.filter((student) => student.status === PLACED_STATUS).length;
  const placementRate = safeRate(placedStudents, totalStudents);

  const companyDistribution = computeCompanyDistribution(students);
  const companyIntelligence = analyzeCompanyIntelligence(students.map((student) => student.company));

  const companyDetectionMap = new Map(
    companyIntelligence.allDetections.map((item) => [item.normalizedName, item]),
  );

  const companyDistributionWithIntel = companyDistribution.map((company) => {
    const detection = companyDetectionMap.get(normalizeCompanyName(company.name)) || detectCompanyQuality(company.name);
    return {
      ...company,
      isTopTech: detection.isTopTech,
      qualityScore: detection.score,
      qualityConfidence: detection.confidence,
    };
  });

  const branchPerformance = computeBranchPerformance(students);
  const cgpaCorrelation = computeCgpaCorrelation(students);
  const atRiskStudents = computeAtRisk(students);
  const prediction = computePrediction(students, placementRate);

  const topBranch = branchPerformance[0] || null;
  const topCompany = companyDistributionWithIntel[0] || null;
  const topTechHiringCompany = companyDistributionWithIntel.find((company) => company.isTopTech) || null;
  const techSelections = companyDistributionWithIntel
    .filter((company) => company.isTopTech)
    .reduce((sum, company) => sum + company.value, 0);
  const techSelectionRate = safeRate(techSelections, placedStudents);

  const insights = buildInsights({
    students,
    branchPerformance,
    companyDistribution: companyDistributionWithIntel,
    cgpaCorrelation,
    placementRate,
    companyIntelligence,
  });

  return {
    processedAt: new Date().toISOString(),
    records: students,
    kpis: {
      totalStudents,
      placedStudents,
      placementRate,
    },
    companyDistribution: companyDistributionWithIntel,
    companyIntelligence: {
      ...companyIntelligence,
      topTechHiringCompany,
      techSelections,
      techSelectionRate,
    },
    branchPerformance,
    cgpaCorrelation,
    atRiskStudents,
    topBranch,
    topCompany,
    prediction,
    insights,
  };
}

export function simulate(data, config = {}) {
  const engine = Array.isArray(data) || Array.isArray(data?.students) ? runPlacementEngine(data) : data;

  const cgpaThreshold = Number(config.cgpaThreshold ?? DEFAULT_SIMULATION.cgpaThreshold);
  const branchFilter = normalizeText(config.branchFilter || DEFAULT_SIMULATION.branchFilter) || 'All';

  const scopedStudents = branchFilter === 'All'
    ? engine.records
    : engine.records.filter((student) => student.branch === branchFilter);

  const baselinePlaced = scopedStudents.filter((student) => student.status === PLACED_STATUS).length;
  const baselineRate = safeRate(baselinePlaced, scopedStudents.length);

  const eligible = scopedStudents.filter((student) => student.cgpa >= cgpaThreshold);
  const eligiblePlaced = eligible.filter((student) => student.status === PLACED_STATUS).length;
  const placementRate = safeRate(eligiblePlaced, eligible.length);
  const affectedStudents = scopedStudents.length - eligible.length;
  const delta = Number((placementRate - baselineRate).toFixed(1));

  return {
    controls: {
      cgpaThreshold,
      branchFilter,
    },
    placementRate,
    affectedStudents,
    delta,
    baselineRate,
    scopedStudents: scopedStudents.length,
    eligibleStudents: eligible.length,
  };
}

export function runPlacementSimulation(engine, controls = DEFAULT_SIMULATION) {
  const result = simulate(engine, {
    cgpaThreshold: controls.cgpaThreshold,
    branchFilter: controls.branchFilter || controls.branch || 'All',
  });

  const insights = [
    `${result.controls.branchFilter === 'All' ? 'All branches' : result.controls.branchFilter}: simulated placement is ${result.placementRate}% after applying CGPA >= ${result.controls.cgpaThreshold}.`,
    `${result.affectedStudents} students are filtered out by the current threshold.`,
    result.delta >= 0
      ? `Scenario improves by +${result.delta}% over baseline.`
      : `Scenario drops by ${result.delta}% from baseline.`,
  ];

  return {
    controls: result.controls,
    baselineRate: result.baselineRate,
    globalBaselineRate: engine.kpis.placementRate,
    projectedPlacementRate: result.placementRate,
    projectedPlaced: Math.round((result.placementRate / 100) * result.eligibleStudents),
    scopedStudents: result.scopedStudents,
    eligibleStudents: result.eligibleStudents,
    studentsAffected: result.affectedStudents,
    delta: result.delta,
    insights,
  };
}

export function generateCopilotReply(question, engine, simulation) {
  const text = normalizeText(question).toLowerCase();

  if (!text) {
    return buildCopilotResponse(
      'Ask about placement health, branch issues, forecast, or simulation impact.',
      'Copilot uses only current uploaded data and simulation outputs.',
      'Try: Why placement is low? or How can we improve next cycle?',
    );
  }

  if (text.includes('why') && text.includes('low')) {
    const lowBand = engine.cgpaCorrelation.find((item) => item.bucket === '<6');
    const lowBandRate = lowBand ? lowBand.rate : 0;

    return buildCopilotResponse(
      'Placement is being pulled down by low-CGPA and non-selected cohorts.',
      `CGPA <6 converts at ${lowBandRate}%, and there are ${engine.atRiskStudents.length} at-risk students with cgpa < 7 and non-selected status.`,
      'Run simulator with threshold 6.5-7.0 and branch-specific support to improve conversion safely.',
    );
  }

  if (text.includes('branch')) {
    if (!engine.topBranch) {
      return buildCopilotResponse(
        'Branch performance is unavailable.',
        'No branch-segmented rows were found after cleaning.',
        'Upload rows with valid branch values to unlock branch comparison.',
      );
    }

    return buildCopilotResponse(
      `${engine.topBranch.branch} is currently the strongest branch.`,
      `Its placement rate is ${engine.topBranch.rate}% compared with overall ${engine.kpis.placementRate}%.`,
      'Apply top-branch preparation strategy to lower-performing branches and monitor in simulator.',
    );
  }

  if (text.includes('company') || text.includes('tech')) {
    const intel = engine.companyIntelligence;
    const topTechName = intel?.topTechHiringCompany?.name || 'N/A';
    return buildCopilotResponse(
      `${intel?.detectedTopTechCompanies || 0} companies are auto-detected as strong tech organizations.`,
      `Detection runs against a ${intel?.catalogSize || 0}+ company intelligence index and currently tracks ${intel?.detectionRate || 0}% company match coverage.`,
      `Focus outreach toward ${topTechName} style companies and increase records for currently unmatched company names.`,
    );
  }

  if (text.includes('simulate') || text.includes('scenario') || text.includes('what if')) {
    if (!simulation) {
      return buildCopilotResponse(
        'No active simulation found.',
        'Simulation output is needed to reason about scenario impact.',
        'Open simulator, adjust controls, and ask again.',
      );
    }

    return buildCopilotResponse(
      `Scenario placement is ${simulation.projectedPlacementRate}% for ${simulation.controls.branchFilter}.`,
      `Baseline is ${simulation.baselineRate}%, delta is ${simulation.delta}%, and ${simulation.studentsAffected} students are affected by threshold filtering.`,
      simulation.delta >= 0
        ? 'Keep this scenario and iterate threshold by 0.1 to maximize upside without over-filtering.'
        : 'Lower threshold or switch branch filter to recover conversion.',
    );
  }

  if (text.includes('predict') || text.includes('forecast')) {
    return buildCopilotResponse(
      `Forecast suggests ${engine.prediction.predictedPlacementRate}% next-cycle placement.`,
      `Readiness score is ${engine.prediction.readinessScore} with ${engine.prediction.trend} momentum.`,
      'Improve readiness by reducing at-risk pool and increasing selected-company alignment.',
    );
  }

  return buildCopilotResponse(
    `Current placement baseline is ${engine.kpis.placementRate}%.`,
    `Top branch: ${engine.topBranch?.branch || 'N/A'}; Top company: ${engine.topCompany?.name || 'N/A'}; Forecast: ${engine.prediction.predictedPlacementRate}%.`,
    'Ask a focused question about branch, risk, forecast, or scenario for targeted recommendations.',
  );
}

export function generateReportAiInsights(engine, simulation) {
  return [
    generateCopilotReply('Why placement is low?', engine, simulation),
    generateCopilotReply('Which branch needs attention?', engine, simulation),
    generateCopilotReply('How can we improve next cycle?', engine, simulation),
  ];
}

export const defaultSimulationControls = DEFAULT_SIMULATION;
