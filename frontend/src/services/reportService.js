import { generateReportAiInsights } from './engineService.js';

const DEFAULT_PROVIDER = 'gemini';
const DEFAULT_MODELS = {
  gemini: 'gemini-1.5-flash',
  openrouter: 'openai/gpt-4o-mini',
  openai: 'gpt-4o-mini',
};

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeProvider(provider) {
  const key = normalizeText(provider).toLowerCase();
  if (key === 'openrouter' || key === 'openai') return key;
  return DEFAULT_PROVIDER;
}

function buildReportPrompt(summary) {
  return [
    'You are a placement analytics expert helping a college training and placement team.',
    'Convert the provided summary into a polished final report that is practical and student-outcome focused.',
    'Use only the given facts and numbers. Do not invent unknown metrics.',
    '',
    'Output sections in this order:',
    '1) Executive Summary',
    '2) Student Outcome Highlights',
    '3) Risk And Intervention Priorities',
    '4) Branch-Level Actions',
    '5) Company And Hiring Strategy',
    '6) Next 30-Day Plan',
    '',
    'Write concise professional text in plain markdown.',
    '',
    'SUMMARY INPUT:',
    summary,
  ].join('\n');
}

function readChatContent(payload) {
  const raw = payload?.choices?.[0]?.message?.content;
  if (Array.isArray(raw)) {
    return raw
      .map((part) => {
        if (typeof part === 'string') return part;
        return part?.text || '';
      })
      .join('\n')
      .trim();
  }

  return normalizeText(raw);
}

async function callGemini({ apiKey, model, prompt }) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const aiModel = genAI.getGenerativeModel({ model });
  const result = await aiModel.generateContent(prompt);
  return normalizeText(result?.response?.text?.());
}

async function callChatCompletions({ endpoint, apiKey, model, prompt, extraHeaders = {} }) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You are a concise placement analytics assistant.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text || 'Unable to generate AI report.'}`);
  }

  const payload = await response.json();
  return readChatContent(payload);
}

export function getDefaultAiModel(provider = DEFAULT_PROVIDER) {
  return DEFAULT_MODELS[normalizeProvider(provider)] || DEFAULT_MODELS[DEFAULT_PROVIDER];
}

export function generateSummaryText(engine, simulation) {
  const companyStats = engine.companyStats || engine.companyDistribution || [];
  const branchStats = engine.branchStats || engine.branchPerformance || [];
  const cgpaAnalysis = engine.cgpaAnalysis || engine.cgpaCorrelation || [];
  const topCompany = engine.topCompany || companyStats[0] || null;
  const topBranch = engine.topBranch || branchStats[0] || null;
  const aiInsights = generateReportAiInsights(engine, simulation);
  const lines = [
    'Placify AI - Placement Intelligence & Simulation Report',
    '',
    `Total Students: ${engine.kpis.totalStudents}`,
    `Placed: ${engine.kpis.placedStudents}`,
    `Placement Rate: ${engine.kpis.placementRate}%`,
    `Top Company: ${topCompany ? `${topCompany.name} (${topCompany.value})` : 'N/A'}`,
    `Top Branch: ${topBranch ? `${topBranch.branch} (${topBranch.rate}%)` : 'N/A'}`,
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
    ...companyStats.map((row) => `- ${row.name}: ${row.value}`),
    '',
    'Branch Performance:',
    ...branchStats.map((row) => `- ${row.branch}: ${row.rate}% (${row.placed}/${row.total})`),
    '',
    'CGPA Analysis:',
    ...cgpaAnalysis.map((row) => `- ${row.bucket}: ${row.rate}% (${row.placed}/${row.total})`),
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

export function generateLocalReport(summary) {
  const timestamp = new Date().toLocaleString();
  return [
    '# Placify AI Local Report',
    '',
    `Generated: ${timestamp}`,
    '',
    'This report was generated using local deterministic analytics only.',
    'External model generation is optional and can be enabled with an API key.',
    '',
    summary,
    '',
    '## Suggested Actions',
    '- Review student intervention queue and assign mentors.',
    '- Run branch-specific outcome planner scenarios weekly.',
    '- Track progress in Students workflow and refresh report at cycle milestones.',
  ].join('\n');
}

export async function generateAiReport({ apiKey, summary, provider = DEFAULT_PROVIDER, model }) {
  const key = normalizeText(apiKey);
  if (!key) {
    return {
      ok: false,
      error: 'API key is required.',
    };
  }

  const providerKey = normalizeProvider(provider);
  const modelName = normalizeText(model) || getDefaultAiModel(providerKey);
  const prompt = buildReportPrompt(summary);

  try {
    let report = '';

    if (providerKey === 'gemini') {
      report = await callGemini({
        apiKey: key,
        model: modelName,
        prompt,
      });
    } else if (providerKey === 'openrouter') {
      report = await callChatCompletions({
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: key,
        model: modelName,
        prompt,
        extraHeaders: {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Placify AI',
        },
      });
    } else {
      report = await callChatCompletions({
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: key,
        model: modelName,
        prompt,
      });
    }

    if (!report) {
      return {
        ok: false,
        error: 'AI provider returned an empty response.',
      };
    }

    return {
      ok: true,
      report,
    };
  } catch (error) {
    return {
      ok: false,
      error: error?.message || 'Unable to generate AI report right now.',
    };
  }
}
