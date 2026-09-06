import { cn } from '../lib/utils';

export default function PageHeader({ eyebrow, title, subtitle, action, className }) {
  return (
    <section className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div>
        {eyebrow ? (
          <p className='mb-2 inline-flex rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-100'>
            {eyebrow}
          </p>
        ) : null}
        <h1 className='text-2xl font-semibold tracking-tight text-white md:text-3xl'>{title}</h1>
        {subtitle ? <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-400'>{subtitle}</p> : null}
      </div>
      {action}
    </section>
  );
}
