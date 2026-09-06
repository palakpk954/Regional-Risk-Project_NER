import Card from './Card';

export default function ChartPanel({ title, subtitle, action, children, className = '' }) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div>
          <h2 className='text-base font-semibold text-white'>{title}</h2>
          {subtitle ? <p className='mt-1 text-sm text-slate-400'>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
