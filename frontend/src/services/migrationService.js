import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const FIELD_ALIASES = {
  name: ['name', 'studentname', 'student', 'candidate'],
  email: ['email', 'mail', 'studentemail'],
  cgpa: ['cgpa', 'gpa', 'grade', 'score'],
  branch: ['branch', 'department', 'stream'],
  company: ['company', 'companyname', 'organization', 'employer'],
  status: ['status', 'result', 'outcome', 'stage'],
};

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getFileExtension(filename) {
  const text = normalizeText(filename);
  const dot = text.lastIndexOf('.');
  if (dot < 0) return '';
  return text.slice(dot + 1).toLowerCase();
}

function toNumber(value) {
  const numeric = Number(String(value ?? '').replace(/,/g, '.'));
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : 0;
}

function normalizeCgpa(value) {
  const numeric = toNumber(value);
  return Math.max(0, Math.min(10, numeric));
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

function isEmptyRow(row) {
  return !Object.values(row || {}).some((value) => normalizeText(value));
}

function pickField(row, canonicalKey) {
  const aliases = FIELD_ALIASES[canonicalKey] || [canonicalKey];
  const keys = Object.keys(row || {});

  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (!aliases.some((alias) => normalized === alias || normalized.includes(alias))) continue;

    const value = normalizeText(row[key]);
    if (value) return value;
  }

  return '';
}

function canonicalizeStudent(row, index) {
  if (isEmptyRow(row)) return null;

  const name = pickField(row, 'name');
  const email = pickField(row, 'email');
  const cgpa = normalizeCgpa(pickField(row, 'cgpa'));
  const branch = pickField(row, 'branch') || 'Unknown';
  const company = pickField(row, 'company') || 'Unassigned';
  const status = normalizeStatus(pickField(row, 'status'));

  if (!name && !email && !branch && !company && !status && !cgpa) {
    return null;
  }

  const fallbackName = name || `Student ${index + 1}`;
  const normalizedEmail = email || `${normalizeText(fallbackName).toLowerCase().replace(/\s+/g, '.')}@local.demo`;

  return {
    name: normalizeText(fallbackName),
    email: normalizeText(normalizedEmail).toLowerCase(),
    cgpa,
    branch: normalizeText(branch) || 'Unknown',
    company: normalizeText(company) || 'Unassigned',
    status,
  };
}

function dedupeStudents(students) {
  const map = new Map();

  (students || []).forEach((student) => {
    const key = normalizeKey(student.email || student.name);
    if (!key) return;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, student);
      return;
    }

    if (existing.status !== 'Selected' && student.status === 'Selected') {
      map.set(key, student);
    }
  });

  return Array.from(map.values());
}

function hasUsefulHeader(fields = []) {
  const normalized = (fields || []).map((field) => normalizeKey(field));
  const matchedGroups = Object.values(FIELD_ALIASES).reduce((count, aliases) => {
    const matched = normalized.some((header) => aliases.some((alias) => header === alias || header.includes(alias)));
    return count + (matched ? 1 : 0);
  }, 0);

  return matchedGroups >= 3;
}

function cleanStudentRows(rows) {
  const cleaned = (rows || [])
    .map((row, index) => canonicalizeStudent(row, index))
    .filter(Boolean);

  return dedupeStudents(cleaned);
}

function parseGvizPayload(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('Invalid Google Sheets response format.');
  }

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error('Failed to parse Google Sheets JSON payload.');
  }
}

function gvizTableToRows(table) {
  const cols = (table?.cols || []).map((col, index) => normalizeText(col?.label || col?.id || `column_${index + 1}`));
  const rows = table?.rows || [];

  return rows.map((row) => {
    const cells = row?.c || [];
    const mapped = {};

    cols.forEach((col, index) => {
      const cell = cells[index];
      const value = cell?.f ?? cell?.v ?? '';
      mapped[col] = value;
    });

    return mapped;
  });
}

function extractSheetMeta(url) {
  const text = normalizeText(url);
  const idMatch = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = text.match(/[?#&]gid=([0-9]+)/);

  return {
    spreadsheetId: idMatch ? idMatch[1] : null,
    gid: gidMatch ? gidMatch[1] : null,
  };
}

export function parseCsvContent(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected. Please upload CSV or Excel data.'));
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => normalizeKey(header),
      complete: (result) => {
        if (result.errors?.length) {
          reject(new Error(result.errors[0]?.message || 'Invalid CSV format.'));
          return;
        }

        const fields = (result.meta?.fields || []).map((field) => normalizeText(field));
        if (!hasUsefulHeader(fields)) {
          reject(
            new Error(
              'CSV headers are invalid. Expected at least 3 key columns among: name, email, cgpa, branch, company, status.',
            ),
          );
          return;
        }

        if (!(result.data || []).length) {
          reject(new Error('CSV is empty. Please upload a file with placement rows.'));
          return;
        }

        const students = cleanStudentRows(result.data || []);
        const rawRows = (result.data || []).length;
        if (!students.length) {
          reject(new Error('CSV has no valid student rows after cleaning.'));
          return;
        }

        resolve({
          sourceName: file?.name || 'CSV Upload',
          rawRows,
          cleanedRows: students.length,
          students,
        });
      },
      error: (error) => {
        reject(new Error(error?.message || 'Unable to parse CSV file.'));
      },
    });
  });
}

export async function parseExcelContent(file) {
  if (!file) {
    throw new Error('No file selected. Please upload CSV or Excel data.');
  }

  const extension = getFileExtension(file?.name);
  if (!['xlsx', 'xls'].includes(extension)) {
    throw new Error('Please upload a valid Excel file (.xlsx or .xls).');
  }

  let workbook;
  try {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: 'array' });
  } catch {
    throw new Error('Unable to read Excel file. Please verify the file format.');
  }

  const firstSheetName = workbook?.SheetNames?.[0];
  if (!firstSheetName) {
    throw new Error('Excel file has no readable worksheet.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });

  if (!rawRows.length) {
    throw new Error('Excel file is empty. Please upload a sheet with placement rows.');
  }

  const fields = rawRows.length ? Object.keys(rawRows[0]) : [];
  if (!hasUsefulHeader(fields)) {
    throw new Error('Excel headers are invalid. Expected at least 3 key columns among: name, email, cgpa, branch, company, status.');
  }

  const students = cleanStudentRows(rawRows);
  if (!students.length) {
    throw new Error('Excel has no valid student rows after cleaning.');
  }

  return {
    sourceName: file?.name || `Excel (${firstSheetName})`,
    rawRows: rawRows.length,
    cleanedRows: students.length,
    students,
  };
}

export function parseUploadedFile(file) {
  if (!file) {
    throw new Error('No file selected. Please upload CSV, XLSX, or XLS files.');
  }

  const extension = getFileExtension(file?.name);

  if (extension === 'csv') {
    return parseCsvContent(file);
  }

  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcelContent(file);
  }

  throw new Error('Unsupported file type. Please upload CSV, XLSX, or XLS files.');
}

export async function importRowsFromGoogleSheetUrl(url) {
  const { spreadsheetId, gid } = extractSheetMeta(url);
  if (!spreadsheetId) {
    throw new Error('Invalid Google Sheets URL. Please provide a valid public link.');
  }

  const endpoint = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json${gid ? `&gid=${gid}` : ''}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Unable to fetch sheet data (HTTP ${response.status}).`);
  }

  const text = await response.text();
  const payload = parseGvizPayload(text);
  if (payload?.status && String(payload.status).toLowerCase() !== 'ok') {
    const message = payload?.errors?.[0]?.detailed_message || payload?.errors?.[0]?.message;
    throw new Error(message || 'Google Sheets returned an error. Ensure the sheet is public.');
  }

  const rawRows = gvizTableToRows(payload.table);
  if (!rawRows.length) {
    throw new Error('Google Sheet is empty. Add placement rows before importing.');
  }

  const fields = Object.keys(rawRows[0] || {});
  if (!hasUsefulHeader(fields)) {
    throw new Error('Sheet headers are invalid. Expected at least 3 key columns among: name, email, cgpa, branch, company, status.');
  }

  const students = cleanStudentRows(rawRows);

  if (!students.length) {
    throw new Error('Sheet has no valid student rows after cleaning.');
  }

  return {
    sourceName: `Google Sheet (${spreadsheetId.slice(0, 6)}...)`,
    rawRows: rawRows.length,
    cleanedRows: students.length,
    students,
  };
}

export function mockGoogleSheetData(url) {
  const sourceName = normalizeText(url).includes('docs.google.com') ? 'Google Sheet' : 'Mock Sheet';
  return {
    sourceName,
    rawRows: 3,
    cleanedRows: 3,
    students: [
      {
        name: 'Neha Khanna',
        email: 'neha@college.edu',
        cgpa: 8.5,
        branch: 'IT',
        company: 'NovaSys',
        status: 'Selected',
      },
      {
        name: 'Rahul Verma',
        email: 'rahul@college.edu',
        cgpa: 6.9,
        branch: 'CSE',
        company: 'PixelCraft',
        status: 'Interview',
      },
      {
        name: 'Aman Soni',
        email: 'aman@college.edu',
        cgpa: 6.4,
        branch: 'ECE',
        company: 'Unassigned',
        status: 'Applied',
      },
    ],
  };
}
