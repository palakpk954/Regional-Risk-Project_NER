import { useState } from 'react';

function readStorage(key) {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Keep UI responsive if storage access is blocked.
  }
}

export default function SettingsModal({ onClose, onSaved }) {
  const [sheetUrl, setSheetUrl] = useState(readStorage('placify-sheet-url') || readStorage('placeiq-sheet-url'));
  const [apiKey, setApiKey] = useState(readStorage('placify-gemini-key') || readStorage('placeiq-gemini-key'));

  const handleSave = () => {
    writeStorage('placify-sheet-url', sheetUrl.trim());
    writeStorage('placify-gemini-key', apiKey.trim());
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative w-full max-w-xl animate-scale-in">
        {/* Glow behind modal */}
        <div className="absolute inset-x-10 inset-y-10 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-3)] opacity-20 blur-[60px] -z-10 rounded-full"></div>
        
        <div className="bg-[#12121a] rounded-[24px] border border-[var(--color-border)] shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--color-border-light)] bg-[#16161f]">
            <div>
              <h2 className="text-[20px] font-bold text-white tracking-tight">Configuration</h2>
              <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">Connect your data source and configure AI models</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-border-accent)] transition-all cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-8 py-7 space-y-7 bg-[var(--color-surface)]">
            
            {/* Sheet Config */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#34d39915] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-white">Google Sheet Connection</h3>
                  <p className="text-[12px] text-[var(--color-text-muted)]">Source database for placement records</p>
                </div>
              </div>
              
              <div className="pl-11">
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={e => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="input-field w-full rounded-xl px-4 py-3 text-[14px]"
                />
                <p className="text-[11px] text-[var(--color-text-muted)] mt-2">
                  Sheet must be <span className="text-[var(--color-info)] font-medium">publicly viewable</span>. Required columns: Company, Date, Students Appeared, Selected, Package (LPA), Status
                </p>
              </div>
            </div>

            <div className="h-px bg-[var(--color-border-light)] w-full"></div>

            {/* AI Config */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-surface)] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-3)" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                      Gemini API Integration
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--color-accent-2)] bg-opacity-20 text-[var(--color-accent-2)]">gemini</span>
                    </h3>
                    <p className="text-[12px] text-[var(--color-text-muted)]">Used for automated report generation</p>
                  </div>
                </div>
              </div>

              <div className="pl-11 relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="input-field w-full rounded-xl px-4 py-3 text-[14px]"
                />
                <p className="text-[11px] text-[var(--color-text-muted)] mt-2 flex items-center justify-between">
                  <span>Get your free key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-2)] hover:text-[var(--color-accent-3)] underline transition-colors">Google AI Studio</a></span>
                </p>
              </div>
            </div>

            {/* Privacy Alert */}
            <div className="mt-2 flex gap-3 bg-[var(--color-info-surface)] border border-[#38bdf820] rounded-xl p-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
              </svg>
              <div>
                <h4 className="text-[13px] font-semibold text-[var(--color-info)]">Local Processing Only</h4>
                <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                  Keys and data URLs are stored securely in your browser's local storage. This application functions entirely on-device and transmits zero data back to our servers.
                </p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-[var(--color-border)] bg-[#12121a]">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary px-6 py-2.5 rounded-xl text-[13px] tracking-wide"
            >
              Save Configuration
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
