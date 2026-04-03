import { cn } from '../lib/utils';

export default function Card({ className, children }) {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200', className)}>
      {children}
    </div>
  );
}
