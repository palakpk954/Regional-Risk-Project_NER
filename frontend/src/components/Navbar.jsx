export default function Navbar({ role, onRoleChange, onSettingsClick, autoRefresh, onAutoRefreshToggle, onRefresh }) {
  return (
    <nav className="sticky top-0 z-50 glass-strong">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-[60px]">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <div className="absolute -inset-1 rounded-xl opacity-40 blur-md -z-10"
                style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}></div>
            </div>
            <span className="text-[17px] font-semibold tracking-tight">
              <span className="text-[var(--color-text)]">Place</span>
              <span className="gradient-text">IQ</span>
            </span>
          </div>

          {/* Center: Role Toggle */}
          <div className="flex items-center bg-[var(--color-bg)] rounded-full p-[3px] border border-[var(--color-border)]">
            <button
              onClick={() => onRoleChange('admin')}
              className={`relative px-5 py-[6px] rounded-full text-[13px] font-medium transition-all duration-300 cursor-pointer ${
                role === 'admin'
                  ? 'text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              {role === 'admin' && (
                <div className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}></div>
              )}
              <span className="relative z-10">Admin</span>
            </button>
            <button
              onClick={() => onRoleChange('student')}
              className={`relative px-5 py-[6px] rounded-full text-[13px] font-medium transition-all duration-300 cursor-pointer ${
                role === 'student'
                  ? 'text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              {role === 'student' && (
                <div className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}></div>
              )}
              <span className="relative z-10">Student</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5">
            {/* Auto-refresh indicator */}
            {autoRefresh && (
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-success)] font-medium mr-1 px-2.5 py-1 rounded-full"
                style={{ background: 'var(--color-success-surface)' }}>
                <div className="w-[5px] h-[5px] rounded-full bg-[var(--color-success)]" style={{ animation: 'pulse-soft 2s infinite' }}></div>
                Live
              </div>
            )}

            {/* Refresh */}
            <button onClick={onRefresh}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 cursor-pointer"
              title="Refresh data">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
              </svg>
            </button>

            {/* Auto-refresh toggle */}
            <button onClick={onAutoRefreshToggle}
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                autoRefresh
                  ? 'text-[var(--color-accent-2)] hover:bg-[var(--color-accent-surface)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
              }`}
              title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-[var(--color-border)] mx-1"></div>

            {/* Settings */}
            <button onClick={onSettingsClick}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 cursor-pointer"
              title="Settings">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
