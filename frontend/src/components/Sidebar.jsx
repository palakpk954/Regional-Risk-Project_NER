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
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className='h-4 w-4' />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}