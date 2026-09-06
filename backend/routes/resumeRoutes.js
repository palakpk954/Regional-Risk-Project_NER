const express = require('express');
const multer = require('multer');
const { scoreResumeAgainstJob } = require('../services/atsScorerEngine');
const { optimizeResumePackage } = require('../services/ossResumeOptimizer');
const { shouldAttemptPaddleOcr } = require('../services/paddleOcrBridge');
const { extractResumeSignalsFromText } = require('../services/resumeSignalExtractor');
const { extractResumeTextFromFile } = require('../services/resumeTextExtractor');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

router.get('/ocr-status', (req, res) => {
  const disabled = ['0', 'false', 'no', 'off'].includes(String(process.env.ENABLE_PADDLE_OCR || '').toLowerCase());
  res.json({
    available: !disabled,
    engine: 'PaddleOCR',
    mode: disabled ? 'disabled' : 'auto-attempt',
    supportedFiles: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'],
    note: disabled
      ? 'Set ENABLE_PADDLE_OCR=true or remove the false flag to allow OCR attempts.'
      : 'OCR is attempted for images and low-text PDFs when PaddleOCR is installed in the configured Python environment.',
    canAttemptImage: shouldAttemptPaddleOcr('resume.png'),
    canAttemptPdf: shouldAttemptPaddleOcr('resume.pdf', { preferOcrForPdf: true }),
  });
});

router.post('/parse', upload.single('resume'), async (req, res) => {
  const extracted = await extractResumeTextFromFile(req.file, { preferOcrForPdf: true });
  if (!extracted.ok) {
    return res.status(400).json({ message: extracted.error });
  }

  const parsedSignals = extractResumeSignalsFromText(extracted.text);
  if (!parsedSignals.ok) {
    return res.status(400).json({ message: parsedSignals.error });
  }

  return res.json({
    ...parsedSignals.data,
    extraction_source: extracted.source || 'unknown',
    ocrStatus: extracted.source === 'ocr' ? 'used' : 'not-needed',
  });
});

router.post('/ats-score', upload.single('resume'), async (req, res) => {
  const extracted = await extractResumeTextFromFile(req.file);
  if (!extracted.ok) {
    return res.status(400).json({ message: extracted.error });
  }

  const scoring = scoreResumeAgainstJob({
    resumeText: extracted.text,
    jobDescription: String(req.body?.jobDescription || ''),
    targetRole: String(req.body?.targetRole || ''),
  });

  if (!scoring.ok) {
    return res.status(400).json({ message: scoring.error });
  }

  return res.json(scoring.data);
});

router.post('/optimize', upload.single('resume'), async (req, res) => {
  const extracted = await extractResumeTextFromFile(req.file, { preferOcrForPdf: true });
  if (!extracted.ok) {
    return res.status(400).json({ message: extracted.error });
  }

  const optimized = optimizeResumePackage({
    resumeText: extracted.text,
    jobDescription: String(req.body?.jobDescription || ''),
    targetRole: String(req.body?.targetRole || ''),
    extractionSource: extracted.source || 'unknown',
  });

  if (!optimized.ok) {
    return res.status(400).json({ message: optimized.error });
  }

  return res.json(optimized.data);
});

module.exports = router;
