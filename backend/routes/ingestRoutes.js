const express = require('express');
const { buildInstitutionalIntelligence } = require('../services/institutionalIntelligenceEngine');

const router = express.Router();

function normalizeText(value) {
  return String(value || '').trim();
}

function extractGoogleSheetMeta(url) {
  const text = normalizeText(url);
  const idMatch = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = text.match(/[?#&]gid=([0-9]+)/);
  return {
    spreadsheetId: idMatch ? idMatch[1] : null,
    gid: gidMatch ? gidMatch[1] : '0',
  };
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseCsvText(csvText) {
  const lines = String(csvText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header, index) => header || `Column ${index + 1}`);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
}

function rowsFromBody(body = {}) {
  return Array.isArray(body.rows) ? body.rows : [];
}

function criteriaFromBody(body = {}) {
  return {
    minCgpa: body.criteria?.minCgpa ?? body.minCgpa ?? 6.5,
    minAttendance: body.criteria?.minAttendance ?? body.minAttendance ?? 70,
    maxBacklogs: body.criteria?.maxBacklogs ?? body.maxBacklogs ?? 0,
    eligibleBranches: body.criteria?.eligibleBranches ?? body.eligibleBranches ?? [],
  };
}

router.post('/preview', (req, res) => {
  const rows = rowsFromBody(req.body);
  if (!rows.length) {
    return res.status(400).json({ message: 'rows array is required for ingestion preview.' });
  }

  const intelligence = buildInstitutionalIntelligence({
    rows,
    criteria: criteriaFromBody(req.body),
  });

  return res.json({
    source: 'placify-ingest-preview-v1',
    totalRows: rows.length,
    mappings: intelligence.mappings,
    duplicateRows: intelligence.duplicateRows,
    normalizedStudents: intelligence.riskRows,
    insights: intelligence.insights,
    summary: {
      totalStudents: intelligence.totalStudents,
      eligibleStudents: intelligence.eligibleStudents,
      ineligibleStudents: intelligence.ineligibleStudents,
      atRiskStudents: intelligence.atRiskStudents,
      noResumeStudents: intelligence.noResumeStudents,
      eligibilityRate: intelligence.eligibilityRate,
    },
  });
});

router.post('/normalize', (req, res) => {
  const rows = rowsFromBody(req.body);
  if (!rows.length) {
    return res.status(400).json({ message: 'rows array is required for normalization.' });
  }

  const intelligence = buildInstitutionalIntelligence({
    rows,
    criteria: criteriaFromBody(req.body),
  });

  return res.json({
    source: 'placify-normalized-students-v1',
    students: intelligence.riskRows,
    mappings: intelligence.mappings,
    duplicateRows: intelligence.duplicateRows,
  });
});

router.post('/google-sheet', async (req, res) => {
  const { spreadsheetId, gid } = extractGoogleSheetMeta(req.body?.url);
  if (!spreadsheetId) {
    return res.status(400).json({ message: 'Paste a valid public Google Sheets URL.' });
  }

  const endpoints = [
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
  ];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'User-Agent': 'PlacifyAI/1.0' },
      });

      if (!response.ok) throw new Error(`Google returned HTTP ${response.status}`);

      const text = await response.text();
      if (/html/i.test(response.headers.get('content-type') || '') && text.includes('<html')) {
        throw new Error('Sheet is not public or Google returned a permission page.');
      }

      const rows = parseCsvText(text);
      if (!rows.length) throw new Error('No tabular rows found in the selected sheet tab.');

      const intelligence = buildInstitutionalIntelligence({
        rows,
        criteria: criteriaFromBody(req.body),
      });

      return res.json({
        source: 'placify-google-sheet-ingest-v1',
        sourceName: `Google Sheet (${spreadsheetId.slice(0, 8)}...)`,
        spreadsheetId,
        gid,
        rows,
        mappings: intelligence.mappings,
        duplicateRows: intelligence.duplicateRows,
        summary: {
          totalStudents: intelligence.totalStudents,
          eligibleStudents: intelligence.eligibleStudents,
          ineligibleStudents: intelligence.ineligibleStudents,
          atRiskStudents: intelligence.atRiskStudents,
          noResumeStudents: intelligence.noResumeStudents,
          eligibilityRate: intelligence.eligibilityRate,
        },
        insights: intelligence.insights,
      });
    } catch (error) {
      lastError = error;
    }
  }

  return res.status(400).json({
    message: `Unable to read this sheet. Make sure it is public: Share -> Anyone with the link -> Viewer. ${lastError?.message || ''}`,
  });
});

module.exports = router;
