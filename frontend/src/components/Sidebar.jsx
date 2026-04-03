import { NavLink } from 'react-router-dom';
import { BarChart3, Building2, DatabaseBackup, LayoutDashboard, SlidersHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', label: 'Engine Dashboard', icon: LayoutDashboard },
  { to: '/migration', label: 'Migration', icon: DatabaseBackup },
  { to: '/simulator', label: 'Simulator', icon: SlidersHorizontal },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className='hidden h-screen w-[260px] shrink-0 border-r border-slate-200 bg-white lg:block'>
      <div className='flex h-16 items-center gap-2 border-b border-slate-200 px-5'>
        <div className='rounded-lg bg-indigo-600 p-2 text-white'>
          <Building2 className='h-4 w-4' />
        </div>
        <div>
          <p className='text-sm font-semibold text-slate-900'>Placify AI</p>
          <p className='text-xs text-slate-500'>Simulation Engine</p>
        </div>
      </div>

      <nav className='space-y-1 p-3'>
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