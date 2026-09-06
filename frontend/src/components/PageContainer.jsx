import { cn } from '../lib/utils';

export default function PageContainer({ className, children }) {
  return <div className={cn('pf-enter mx-auto w-full max-w-[1180px] px-4 py-8 md:px-6 md:py-10', className)}>{children}</div>;
}
