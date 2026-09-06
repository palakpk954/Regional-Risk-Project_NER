import { BarChart3, Compass, DatabaseBackup, LayoutDashboard, SlidersHorizontal, Trash2, Users2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Button from './Button';

const pageTitles = {
  '/': 'Placement Success Dashboard',
  '/launchpad': 'Placify Launchpad',
  '/students': 'Student Success Workflow',
  '/migration': 'Migration Center',
  '/simulator': 'Student Outcome Planner',
  '/reports': 'Insight Reports',
};

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/launchpad', label: 'Launchpad', icon: Compass },
  { to: '/students', label: 'Students', icon: Users2 },
  { to: '/migration', label: 'Migration', icon: DatabaseBackup },
  { to: '/simulator', label: 'Planner', icon: SlidersHorizontal },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Topbar({ lastProcessedAt, onClearData }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Placement Engine';
  const lastRunLabel = lastProcessedAt ? new Date(lastProcessedAt).toLocaleTimeString() : '--';
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!lastProcessedAt) return undefined;

    const lastRunMs = new Date(lastProcessedAt).getTime();
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.floor((Date.now() - lastRunMs) / 1000));
      setElapsedSeconds(seconds);
    }, 1000);

    return () => clearInterval(timer);
  }, [lastProcessedAt]);

  return (
    <header className='sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur'>
      <div className='flex h-16 items-center justify-between gap-4 px-4 md:px-6'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-[8px] font-bold tracking-wide text-white lg:hidden'>
            LOGO
          </div>
          <div className='min-w-0'>
            <h1 className='truncate text-base font-semibold text-slate-900 md:text-lg'>{title}</h1>
            <div className='hidden items-center gap-2 text-xs text-slate-500 sm:flex'>
              <span className='inline-block h-2 w-2 rounded-full bg-emerald-500' />
              <span>Offline placement workspace ready</span>
              <span>|</span>
              <span>Last analysis {lastRunLabel}</span>
              {lastProcessedAt ? <span>updated {elapsedSeconds}s ago</span> : null}
            </div>
          </div>
        </div>

        <nav className='hidden items-center gap-1 xl:flex'>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200'
                      : 'text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
                  }`
                }
              >
                <Icon className='h-4 w-4' />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className='flex items-center gap-2'>
          <Button variant='secondary' size='sm' className='hidden sm:inline-flex' onClick={onClearData}>
            <Trash2 className='h-4 w-4' />
            Clear Offline Data
          </Button>
          <Button variant='secondary' size='sm' className='sm:hidden' onClick={onClearData}>
            <Trash2 className='h-4 w-4' />
            Clear
          </Button>
        </div>
      </div>

      <div className='border-t border-slate-200 px-3 py-2 lg:hidden'>
        <nav className='flex items-center gap-2 overflow-x-auto'>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    isActive
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600',
                  ].join(' ')
                }
              >
                <Icon className='h-3.5 w-3.5' />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
