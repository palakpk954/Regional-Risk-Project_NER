import axios from 'axios';

/**
 * Parse a Google Sheets URL to extract the sheet ID.
 * Supports formats:
 *   https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
 *   https://docs.google.com/spreadsheets/d/SHEET_ID
 *   Just a raw sheet ID string
 */
function extractSheetId(url) {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  // Maybe it's just a raw ID
  if (/^[a-zA-Z0-9-_]+$/.test(url.trim())) return url.trim();
  return null;
}

/**
 * Fetch placement data from a public Google Sheet via opensheet API.
 * The Sheet must be public (anyone with link can view).
 */
export async function fetchSheetData(sheetUrl) {
  const sheetId = extractSheetId(sheetUrl);
  if (!sheetId) throw new Error('Invalid Google Sheet URL');

  const apiUrl = `https://opensheet.elk.sh/${sheetId}/Sheet1`;
  const res = await axios.get(apiUrl);

  if (!Array.isArray(res.data) || res.data.length === 0) {
    throw new Error('No data found in the sheet. Make sure it has headers in row 1.');
  }

  // Normalize column names (trim, lowercase for matching)
  return res.data.map((row, index) => {
    const normalized = {};
    Object.keys(row).forEach(key => {
      normalized[key.trim()] = row[key];
    });

    return {
      id: index + 1,
      company: normalized['Company'] || normalized['company'] || '',
      date: normalized['Date'] || normalized['date'] || '',
      appeared: parseInt(normalized['Students Appeared'] || normalized['Appeared'] || normalized['appeared'] || 0),
      selected: parseInt(normalized['Selected'] || normalized['selected'] || 0),
      package: parseFloat(normalized['Package (LPA)'] || normalized['Package'] || normalized['package'] || 0),
      status: normalized['Status'] || normalized['status'] || 'Completed',
      type: normalized['Type'] || normalized['type'] || 'On-Campus',
    };
  });
}

/**
 * Generate AI-powered placement report using Gemini API (runs on-device / client-side).
 * Returns the generated insights text.
 */
export async function generateAIInsights(data, apiKey) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-pro' });

  // Prepare data summary for the prompt
  const totalCompanies = new Set(data.map(d => d.company)).size;
  const totalAppeared = data.reduce((s, d) => s + d.appeared, 0);
  const totalSelected = data.reduce((s, d) => s + d.selected, 0);
  const avgPackage = data.length > 0
    ? (data.reduce((s, d) => s + d.package, 0) / data.length).toFixed(2)
    : 0;
  const selectionRate = totalAppeared > 0 ? ((totalSelected / totalAppeared) * 100).toFixed(1) : 0;

  const topCompanies = [...data]
    .sort((a, b) => b.selected - a.selected)
    .slice(0, 5)
    .map(d => `${d.company}: ${d.selected} selected, ${d.package} LPA`)
    .join('\n');

  const prompt = `You are a placement analytics expert for a university. Analyze this placement data and generate a professional report.

DATA SUMMARY:
- Total Companies Visited: ${totalCompanies}
- Total Students Appeared: ${totalAppeared}
- Total Students Selected: ${totalSelected}
- Selection Rate: ${selectionRate}%
- Average Package: ${avgPackage} LPA

TOP COMPANIES:
${topCompanies}

RAW DATA:
${JSON.stringify(data.slice(0, 30), null, 2)}

Generate a structured placement report with these exact sections:
1. EXECUTIVE SUMMARY (2-3 sentences)
2. KEY HIGHLIGHTS (4-5 bullet points)
3. PERFORMANCE ANALYSIS (2-3 paragraphs analyzing trends, strengths, areas of improvement)
4. TOP RECRUITERS ANALYSIS (brief analysis of top recruiting companies)
5. RECOMMENDATIONS (3-4 actionable recommendations)
6. OUTLOOK (1-2 sentences about future placement prospects)

Be specific, use numbers from the data, and make it sound professional. Do NOT use markdown formatting — use plain text with section headers in CAPS.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate a PowerPoint presentation from placement data and AI insights.
 * Returns a Blob that can be downloaded.
 */
export async function generatePPTReport(data, insights) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Placify AI Dashboard';
  pptx.subject = 'Placement Report';

  const COLORS = {
    bg: 'F8F9FB',
    surface: 'FFFFFF',
    accent: '6366F1',
    accentLight: 'E0E7FF',
    text: '1E293B',
    textSecondary: '64748B',
    success: '10B981',
    border: 'E5E7EB',
  };

  // ── Slide 1: Title ────────────────────────────
  const slide1 = pptx.addSlide();
  slide1.background = { color: COLORS.accent };
  slide1.addText('Placement Intelligence Report', {
    x: 0.8, y: 1.5, w: 11.5, h: 1.5,
    fontSize: 36, fontFace: 'Arial', color: 'FFFFFF', bold: true,
  });
  slide1.addText(`Generated on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: 0.8, y: 3.0, w: 11.5, h: 0.6,
    fontSize: 16, fontFace: 'Arial', color: 'E0E7FF',
  });
  slide1.addText('Powered by Placify AI', {
    x: 0.8, y: 6.0, w: 11.5, h: 0.5,
    fontSize: 12, fontFace: 'Arial', color: 'C7D2FE',
  });

  // ── Slide 2: Key Metrics ──────────────────────
  const totalCompanies = new Set(data.map(d => d.company)).size;
  const totalSelected = data.reduce((s, d) => s + d.selected, 0);
  const totalAppeared = data.reduce((s, d) => s + d.appeared, 0);
  const avgPkg = data.length > 0 ? (data.reduce((s, d) => s + d.package, 0) / data.length).toFixed(1) : 0;
  const selRate = totalAppeared > 0 ? ((totalSelected / totalAppeared) * 100).toFixed(1) : 0;

  const slide2 = pptx.addSlide();
  slide2.addText('Key Metrics', {
    x: 0.8, y: 0.4, w: 11.5, h: 0.7,
    fontSize: 24, fontFace: 'Arial', color: COLORS.text, bold: true,
  });

  const metrics = [
    { label: 'Total Companies', value: String(totalCompanies), color: COLORS.accent },
    { label: 'Students Selected', value: String(totalSelected), color: COLORS.success },
    { label: 'Selection Rate', value: `${selRate}%`, color: 'F59E0B' },
    { label: 'Avg Package', value: `${avgPkg} LPA`, color: '06B6D4' },
  ];

  metrics.forEach((m, i) => {
    const x = 0.5 + i * 3.1;
    slide2.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.5, w: 2.8, h: 2.0,
      fill: { color: COLORS.surface },
      line: { color: COLORS.border, width: 1 },
      rectRadius: 0.15,
    });
    slide2.addText(m.value, {
      x, y: 1.7, w: 2.8, h: 1.0,
      fontSize: 32, fontFace: 'Arial', color: m.color, bold: true, align: 'center',
    });
    slide2.addText(m.label, {
      x, y: 2.7, w: 2.8, h: 0.6,
      fontSize: 13, fontFace: 'Arial', color: COLORS.textSecondary, align: 'center',
    });
  });

  // ── Slide 3: Top Companies Table ──────────────
  const slide3 = pptx.addSlide();
  slide3.addText('Top Recruiting Companies', {
    x: 0.8, y: 0.4, w: 11.5, h: 0.7,
    fontSize: 24, fontFace: 'Arial', color: COLORS.text, bold: true,
  });

  const topData = [...data].sort((a, b) => b.selected - a.selected).slice(0, 10);
  const tableRows = [
    [
      { text: 'Company', options: { bold: true, color: 'FFFFFF', fill: { color: COLORS.accent } } },
      { text: 'Appeared', options: { bold: true, color: 'FFFFFF', fill: { color: COLORS.accent } } },
      { text: 'Selected', options: { bold: true, color: 'FFFFFF', fill: { color: COLORS.accent } } },
      { text: 'Package (LPA)', options: { bold: true, color: 'FFFFFF', fill: { color: COLORS.accent } } },
    ],
    ...topData.map((d, i) => [
      { text: d.company, options: { fill: { color: i % 2 === 0 ? COLORS.surface : COLORS.bg } } },
      { text: String(d.appeared), options: { fill: { color: i % 2 === 0 ? COLORS.surface : COLORS.bg } } },
      { text: String(d.selected), options: { fill: { color: i % 2 === 0 ? COLORS.surface : COLORS.bg } } },
      { text: String(d.package), options: { fill: { color: i % 2 === 0 ? COLORS.surface : COLORS.bg } } },
    ]),
  ];

  slide3.addTable(tableRows, {
    x: 0.5, y: 1.3, w: 12.0,
    fontSize: 12, fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: COLORS.border },
    colW: [4, 2.5, 2.5, 3],
  });

  // ── Slide 4+: AI Insights ─────────────────────
  if (insights) {
    const sections = insights.split(/\n(?=[A-Z]{2,})/);
    let currentSlide = pptx.addSlide();
    currentSlide.addText('AI-Generated Insights', {
      x: 0.8, y: 0.4, w: 11.5, h: 0.7,
      fontSize: 24, fontFace: 'Arial', color: COLORS.text, bold: true,
    });

    let yPos = 1.3;
    sections.forEach((section) => {
      if (yPos > 5.5) {
        currentSlide = pptx.addSlide();
        currentSlide.addText('AI-Generated Insights (cont.)', {
          x: 0.8, y: 0.4, w: 11.5, h: 0.7,
          fontSize: 24, fontFace: 'Arial', color: COLORS.text, bold: true,
        });
        yPos = 1.3;
      }

      const lines = section.trim().split('\n');
      const title = lines[0];
      const body = lines.slice(1).join('\n').trim();

      if (title) {
        currentSlide.addText(title, {
          x: 0.8, y: yPos, w: 11.5, h: 0.4,
          fontSize: 14, fontFace: 'Arial', color: COLORS.accent, bold: true,
        });
        yPos += 0.45;
      }

      if (body) {
        const textHeight = Math.min(Math.ceil(body.length / 120) * 0.3 + 0.3, 3);
        currentSlide.addText(body, {
          x: 0.8, y: yPos, w: 11.5, h: textHeight,
          fontSize: 11, fontFace: 'Arial', color: COLORS.textSecondary,
          lineSpacingMultiple: 1.3, valign: 'top',
        });
        yPos += textHeight + 0.2;
      }
    });
  }

  // ── Slide Last: Thank You ─────────────────────
  const slideLast = pptx.addSlide();
  slideLast.background = { color: COLORS.accent };
  slideLast.addText('Thank You', {
    x: 0.8, y: 2.0, w: 11.5, h: 1.5,
    fontSize: 42, fontFace: 'Arial', color: 'FFFFFF', bold: true, align: 'center',
  });
  slideLast.addText('Report generated by Placify AI — Placement Intelligence Dashboard', {
    x: 0.8, y: 3.8, w: 11.5, h: 0.6,
    fontSize: 14, fontFace: 'Arial', color: 'C7D2FE', align: 'center',
  });

  const blob = await pptx.write({ outputType: 'blob' });
  return blob;
}
