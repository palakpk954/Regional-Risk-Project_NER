export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className='rounded-2xl border border-dashed border-white/12 bg-slate-950/45 p-8 text-center'>
      {Icon ? <Icon className='mx-auto h-9 w-9 text-slate-500' /> : null}
      <h3 className='mt-3 text-base font-semibold text-white'>{title}</h3>
      {description ? <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400'>{description}</p> : null}
      {action ? <div className='mt-4'>{action}</div> : null}
    </div>
  );
}
