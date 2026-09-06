import { useState } from 'react';
import { generateAIInsights, generatePPTReport } from '../services/api';

function getStoredValue(key) {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

export default function ReportGenerator({ data }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const apiKey = getStoredValue('placify-gemini-key') || getStoredValue('placeiq-gemini-key');

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please configure your Gemini API key in Settings');
      return;
    }
    if (!data || data.length === 0) {
      setError('No placement data available to analyze');
      return;
    }

    setLoading(true);
    setError('');

    try {
      setStatus('Analyzing data with Gemini 3.1 Pro...');
      const insights = await generateAIInsights(data, apiKey);

      setStatus('Structuring presentation...');
      const blob = await generatePPTReport(data, insights);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Placify_AI_Report_${new Date().toISOString().split('T')[0]}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('Download ready!');
      setTimeout(() => setStatus(''), 4000);
    } catch (err) {
      console.error('Report generation failed:', err);
      setError(err.message || 'Generation failed. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative gradient-border rounded-2xl p-6 overflow-hidden mt-8 mb-4">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 w-[40%] h-full bg-gradient-to-l from-[var(--color-accent-surface)] to-transparent pointer-events-none"></div>
      <div className="absolute right-[-20%] top-[-50%] w-[50%] h-[200%] bg-[var(--color-accent)] opacity-10 blur-[100px] pointer-events-none animate-float"></div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h3 className="text-[18px] font-bold text-white flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] bg-opacity-20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M13 8H7"/><path d="M17 12H7"/>
              </svg>
            </div>
            AI Insight Report
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)] text-white">Gemini 3.1 Pro</span>
          </h3>
          <p className="text-[14px] text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
            Instantly synthesize your placement data into a professional presentation. Our on-device AI analyzes trends, strengths, and areas for improvement.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`shrink-0 flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-[14px] font-medium text-white transition-all shadow-lg ${
            loading
              ? 'bg-[var(--color-surface-active)] cursor-not-allowed shadow-none'
              : 'btn-primary'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin text-[var(--color-accent-3)]" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2"/>
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              <span>Generate .PPTX</span>
            </>
          )}
        </button>
      </div>

      {/* Status Feedback */}
      <div className={`overflow-hidden transition-all duration-300 ${status || error || !apiKey ? 'mt-5 max-h-[100px]' : 'max-h-0'}`}>
        {status && !error && (
          <div className="flex items-center gap-2.5 text-[13px] font-medium text-[var(--color-accent-3)] bg-[var(--color-accent-surface)] py-2 px-4 rounded-lg inline-flex">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-3)]" style={{ animation: 'pulse-dot 1s infinite' }}></div>
            {status}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 text-[13px] font-medium text-[var(--color-danger)] bg-[var(--color-danger-surface)] border border-[#f8717140] py-2.5 px-4 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            {error}
          </div>
        )}

        {!apiKey && !error && !status && (
          <div className="flex items-center gap-2.5 text-[13px] font-medium text-[var(--color-warning)] bg-[var(--color-warning-surface)] border border-[#fbbf2440] py-2.5 px-4 rounded-lg inline-flex">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>
            </svg>
            Configure your Gemini API key in Settings to activate AI reporting.
          </div>
        )}
      </div>
    </div>
  );
}
