import Card from './Card';

export default function ChartCard({ title, subtitle, children, action }) {
  return (
    <Card className='h-full'>
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold text-[var(--pf-text)]'>{title}</h3>
          {subtitle ? <p className='mt-1 text-sm text-[var(--pf-muted)]'>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className='h-[280px] rounded-2xl border border-[var(--pf-border)] bg-white/65 p-2 dark:bg-white/[0.035]'>{children}</div>
    </Card>
  );
}
