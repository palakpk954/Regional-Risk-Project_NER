import { cn } from '../lib/utils';

export default function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-2xl border border-[var(--pf-border)] bg-white/75 px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-200/40 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-sky-400/15',
        className,
      )}
      {...props}
    />
  );
}
