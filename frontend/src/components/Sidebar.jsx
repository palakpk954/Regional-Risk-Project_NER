import { NavLink } from 'react-router-dom';
import { BarChart3, Compass, DatabaseBackup, LayoutDashboard, SlidersHorizontal, Users2 } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/launchpad', label: 'Launchpad', icon: Compass },
  { to: '/students', label: 'Students', icon: Users2 },
  { to: '/migration', label: 'Migration', icon: DatabaseBackup },
  { to: '/simulator', label: 'Outcome Planner', icon: SlidersHorizontal },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className='hidden h-screen w-[260px] shrink-0 border-r border-slate-200 bg-white lg:block'>
      <div className='flex h-16 items-center gap-3 border-b border-slate-200 px-5'>
        <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-[9px] font-bold tracking-wide text-white'>
          LOGO
        </div>
        <div className='min-w-0'>
          <p className='text-sm font-semibold text-slate-900'>Placify AI</p>
          <p className='truncate text-xs text-slate-500'>Student Success Suite</p>
        </div>
      </div>

      <nav className='space-y-1 p-3'>
        <p className='px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-teal-300/18 to-sky-400/12 text-teal-50 shadow-[inset_0_0_0_1px_rgba(94,234,212,0.26)]'
                    : 'text-slate-400 hover:bg-white/[0.055] hover:text-slate-100',
                )
              }
            >
              <Icon className='h-4 w-4 transition-transform duration-200 group-hover:scale-105' />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className='p-3'>
        <div className='rounded-2xl border border-white/10 bg-white/[0.035] p-3'>
          <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Workflow</p>
          <p className='mt-1 text-sm font-semibold text-white'>Ingest, validate, analyze.</p>
          <p className='mt-1 text-xs text-slate-400'>Start with data ingestion, then review risks and reports.</p>
        </div>
      </div>
    </aside>
  );
}
