import Card from './Card';

export default function StatCard({ label, value, helper, icon }) {
  return (
    <Card className='group border-slate-200/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-sm text-slate-500'>{label}</p>
          <p className='mt-2 text-2xl font-semibold text-slate-900'>{value}</p>
          {helper ? <p className='mt-1 text-xs text-slate-500'>{helper}</p> : null}
        </div>
        <div className='rounded-xl border border-teal-100 bg-teal-50 p-2 text-teal-700'>{icon}</div>
      </div>
    </Card>
  );
}
