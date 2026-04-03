import { useEffect, useMemo, useState } from 'react';
import Button from './Button';
import Input from './Input';
import { generateAiReport, generateLocalReport, getDefaultAiModel } from '../services/reportService';

const STORAGE_KEYS = {
  provider: 'placify-ai-provider',
  model: 'placify-ai-model',
  apiKey: 'placify-ai-api-key',
};

const providerOptions = [
  { value: 'gemini', label: 'Gemini' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'openai', label: 'OpenAI' },
];

export default function AiReportModal({ open, onClose, summary }) {
  const [provider, setProvider] = useState(localStorage.getItem(STORAGE_KEYS.provider) || 'gemini');
  const [apiKey, setApiKey] = useState(localStorage.getItem(STORAGE_KEYS.apiKey) || '');
  const [model, setModel] = useState(
    localStorage.getItem(STORAGE_KEYS.model) || getDefaultAiModel(localStorage.getItem(STORAGE_KEYS.provider) || 'gemini'),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState('');

  const fallbackReport = useMemo(() => generateLocalReport(summary), [summary]);

  useEffect(() => {
    setModel(getDefaultAiModel(provider));
  }, [provider]);

  if (!open) return null;

  const runReport = async () => {
    setError('');
    setLoading(true);

    localStorage.setItem(STORAGE_KEYS.provider, provider);
    localStorage.setItem(STORAGE_KEYS.model, model.trim());
    localStorage.setItem(STORAGE_KEYS.apiKey, apiKey.trim());

    const result = await generateAiReport({
      apiKey,
      summary,
      provider,
      model,
    });

    if (result.ok) {
      setReport(result.report);
    } else {
      setError(result.error);
      setReport(fallbackReport);
    }
    setLoading(false);
  };

  const downloadReport = () => {
    const content = report || fallbackReport;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'placify-ai-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4'>
      <div className='w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl'>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-slate-900'>AI Report Studio</h3>
            <p className='text-sm text-slate-500'>Use Gemini, OpenRouter, or OpenAI. Local fallback report works even without any key.</p>
          </div>
          <Button variant='ghost' onClick={onClose}>Close</Button>
        </div>

        <div className='rounded-xl border border-indigo-100 bg-indigo-50 p-4'>
          <div className='grid gap-2 md:grid-cols-3'>
            <div>
              <label className='mb-1 block text-xs font-semibold uppercase tracking-wide text-indigo-700'>Provider</label>
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                className='h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
              >
                {providerOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className='mb-1 block text-xs font-semibold uppercase tracking-wide text-indigo-700'>Model</label>
              <Input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder={getDefaultAiModel(provider)}
              />
            </div>

            <div>
              <label className='mb-1 block text-xs font-semibold uppercase tracking-wide text-indigo-700'>API Key</label>
              <Input
                type='password'
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder='Paste API key'
              />
            </div>
          </div>

          <div className='mt-3 flex flex-wrap gap-2'>
            <Button onClick={runReport} disabled={loading}>{loading ? 'Generating...' : 'Generate AI Report'}</Button>
            <Button variant='secondary' onClick={() => setReport(fallbackReport)}>Use Local Fallback</Button>
          </div>

          <p className='mt-2 text-xs text-slate-600'>Provider, model, and API key are stored only in this browser session storage area (localStorage).</p>
          {error ? <p className='mt-2 text-xs text-rose-600'>{error}</p> : null}
        </div>

        <div className='mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4'>
          <pre className='max-h-[360px] overflow-auto whitespace-pre-wrap text-sm text-slate-700'>
            {report || 'Your report preview will appear here.'}
          </pre>
        </div>

        <div className='mt-4 flex justify-end gap-2'>
          <Button variant='secondary' onClick={downloadReport}>Download</Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
