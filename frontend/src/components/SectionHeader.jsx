import { cn } from '../lib/utils';

export default function SectionHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div>
        <h2 className='text-xl font-semibold tracking-tight text-white'>{title}</h2>
        {subtitle ? <p className='mt-1 max-w-2xl text-sm text-slate-400'>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
