const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff']);

function getFileExtension(filename = '') {
  const name = String(filename || '');
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index + 1).toLowerCase() : '';
}

function shouldAttemptPaddleOcr(filename = '', options = {}) {
  const extension = getFileExtension(filename);
  if (!extension) return false;

  if (IMAGE_EXTENSIONS.has(extension)) return true;
  if (extension === 'pdf' && options.preferOcrForPdf) return true;

  return false;
}

function isOcrExplicitlyDisabled() {
  const flag = String(process.env.ENABLE_PADDLE_OCR || '').toLowerCase();
  return flag === '0' || flag === 'false' || flag === 'no' || flag === 'off';
}

function runPythonScript(command, args, timeoutMs = 45000) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk || '');
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk || '');
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: error.message, timedOut });
    });
  });
}

async function extractTextWithPaddleOcr(file, options = {}) {
  if (isOcrExplicitlyDisabled()) {
    return {
      ok: false,
      skipped: true,
      error: 'PaddleOCR is disabled by ENABLE_PADDLE_OCR=false.',
    };
  }

  if (!file || !file.buffer) {
    return { ok: false, error: 'Resume file is required for OCR.' };
  }

  if (!shouldAttemptPaddleOcr(file.originalname, options)) {
    return {
      ok: false,
      skipped: true,
      error: 'PaddleOCR is only attempted for image files and optionally low-text PDFs.',
    };
  }

  const pythonCmd = process.env.PADDLE_PYTHON_CMD || 'python';
  const scriptPath = path.join(__dirname, '..', 'tools', 'paddle_ocr_extract.py');
  const extension = getFileExtension(file.originalname) || 'bin';
  const tempPath = path.join(os.tmpdir(), `resume-ocr-${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`);

  try {
    await fs.writeFile(tempPath, file.buffer);

    const outcome = await runPythonScript(pythonCmd, [scriptPath, tempPath], Number(process.env.PADDLE_OCR_TIMEOUT_MS || 45000));

    if (outcome.timedOut) {
      return { ok: false, error: 'PaddleOCR process timed out.' };
    }

    if (outcome.code !== 0) {
      return {
        ok: false,
        error: `PaddleOCR failed (${outcome.code}): ${outcome.stderr || 'unknown error'}`,
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(String(outcome.stdout || '').trim());
    } catch {
      return {
        ok: false,
        error: 'PaddleOCR returned non-JSON output.',
      };
    }

    if (!parsed.ok) {
      return {
        ok: false,
        error: parsed.error || 'PaddleOCR failed to extract text.',
      };
    }

    return {
      ok: true,
      text: String(parsed.text || ''),
      confidence: Number(parsed.confidence || 0),
      source: 'paddle-ocr',
    };
  } catch (error) {
    return { ok: false, error: `PaddleOCR integration error: ${error.message}` };
  } finally {
    await fs.unlink(tempPath).catch(() => undefined);
  }
}

module.exports = {
  extractTextWithPaddleOcr,
  shouldAttemptPaddleOcr,
};
