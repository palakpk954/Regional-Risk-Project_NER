const tones = {
  success: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
  warning: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
  danger: 'border-rose-300/20 bg-rose-300/10 text-rose-100',
  info: 'border-sky-300/20 bg-sky-300/10 text-sky-100',
  muted: 'border-slate-300/20 bg-slate-300/10 text-slate-200',
};

export default function StatusBadge({ children, tone = 'muted' }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.muted}`}>
      {children}
    </span>
  );
}
