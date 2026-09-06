const mammoth = require('mammoth');
const pdfParseModule = require('pdf-parse');
const { extractTextWithPaddleOcr } = require('./paddleOcrBridge');

function getFileExtension(filename = '') {
  const name = String(filename || '');
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index + 1).toLowerCase() : '';
}

async function parsePdfText(buffer) {
  if (typeof pdfParseModule === 'function') {
    return pdfParseModule(buffer);
  }

  if (pdfParseModule && typeof pdfParseModule.default === 'function') {
    return pdfParseModule.default(buffer);
  }

  if (pdfParseModule && typeof pdfParseModule.PDFParse === 'function') {
    const parser = new pdfParseModule.PDFParse({ data: buffer });
    try {
      return await parser.getText();
    } finally {
      await Promise.resolve(parser.destroy()).catch(() => undefined);
    }
  }

  throw new Error('Unsupported pdf-parse module export format.');
}

async function extractResumeTextFromFile(file, options = {}) {
  if (!file || !file.buffer) {
    return { ok: false, error: 'Resume file is required.' };
  }

  const extension = getFileExtension(file.originalname);
  try {
    if (extension === 'txt' || extension === 'md') {
      return { ok: true, text: file.buffer.toString('utf8'), source: 'txt-parser' };
    }

    if (extension === 'pdf') {
      const parsed = await parsePdfText(file.buffer);
      const parsedText = String(parsed.text || '');
      const tokenCount = parsedText.split(/\s+/).filter(Boolean).length;

      if (options.preferOcrForPdf && tokenCount < 35) {
        const ocr = await extractTextWithPaddleOcr(file, { preferOcrForPdf: true });
        if (ocr.ok && ocr.text.trim()) {
          return {
            ok: true,
            text: ocr.text,
            source: 'paddle-ocr',
            confidence: ocr.confidence,
          };
        }

        if (tokenCount === 0) {
          return {
            ok: false,
            error: `This PDF appears scanned or image-only. OCR was attempted but did not return text: ${ocr.error}`,
          };
        }
      }

      return { ok: true, text: parsedText, source: 'pdf-parse' };
    }

    if (extension === 'docx' || extension === 'doc') {
      const parsed = await mammoth.extractRawText({ buffer: file.buffer });
      return { ok: true, text: String(parsed.value || ''), source: 'mammoth' };
    }

    if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'].includes(extension)) {
      const ocr = await extractTextWithPaddleOcr(file, { preferOcrForPdf: false });
      if (ocr.ok) {
        return {
          ok: true,
          text: ocr.text,
          source: 'paddle-ocr',
          confidence: ocr.confidence,
        };
      }

      return {
        ok: false,
        error: `Image OCR failed: ${ocr.error}`,
      };
    }

    return { ok: false, error: 'Unsupported file type. Upload PDF, DOCX, DOC, TXT, MD, PNG, JPG, JPEG, WEBP, BMP, or TIFF.' };
  } catch (error) {
    return { ok: false, error: `Could not read resume file: ${error.message}` };
  }
}

module.exports = {
  extractResumeTextFromFile,
};
