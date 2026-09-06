import { cn } from '../lib/utils';

export default function Button({ className, variant = 'primary', size = 'md', ...props }) {
  const variantStyles = {
    primary: 'border border-sky-400/30 bg-sky-500 text-white shadow-sm shadow-sky-500/20 hover:bg-sky-600 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300',
    secondary: 'border border-[var(--pf-border)] bg-white/70 text-slate-700 hover:bg-white hover:text-slate-950 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10',
    ghost: 'border border-transparent bg-transparent text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 border border-rose-400',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
