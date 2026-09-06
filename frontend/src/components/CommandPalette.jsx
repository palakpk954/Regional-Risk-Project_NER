import { Command, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNavItemsForRole } from './navigationConfig';

export default function CommandPalette({ open, onClose, role }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const navItems = useMemo(() => getNavItemsForRole(role), [role]);

  const actions = useMemo(
    () => [
      ...navItems.map((item) => ({ ...item, group: role === 'admin' ? 'TPO' : 'Student' })),
      { to: '/', label: 'Landing Page', icon: Command, group: 'Public' },
      { to: '/login', label: 'Switch Account', icon: Command, group: 'Account' },
    ],
    [navItems, role],
  );

  const filtered = actions.filter((action) =>
    `${action.label} ${action.group}`.toLowerCase().includes(query.toLowerCase()),
  );

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center bg-slate-950/75 px-4 pt-20 backdrop-blur-md'>
      <button className='absolute inset-0 cursor-default' type='button' aria-label='Close command palette' onClick={onClose} />
      <section className='relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl'>
        <div className='flex items-center gap-3 border-b border-white/10 px-4 py-3'>
          <Search className='h-4 w-4 text-slate-500' />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search Placify AI actions'
            className='h-10 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500'
          />
          <button
            type='button'
            onClick={onClose}
            className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white'
            title='Close'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        <div className='max-h-[420px] overflow-y-auto p-2'>
          {filtered.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={`${action.group}-${action.to}`}
                type='button'
                onClick={() => {
                  navigate(action.to);
                  onClose();
                }}
                className='flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/10'
              >
                <span className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-teal-300/20 bg-teal-300/10 text-teal-100'>
                  <Icon className='h-4 w-4' />
                </span>
                <span>
                  <span className='block text-sm font-semibold text-white'>{action.label}</span>
                  <span className='text-xs text-slate-500'>{action.group}</span>
                </span>
              </button>
            );
          })}
          {!filtered.length ? (
            <div className='px-4 py-10 text-center text-sm text-slate-500'>No matching action found.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
