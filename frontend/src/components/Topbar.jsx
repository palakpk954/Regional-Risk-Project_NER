import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Button from './Button';

const pageTitles = {
  '/': 'Placify AI Dashboard',
  '/migration': 'Migration Center',
  '/simulator': 'Placify AI Simulator',
  '/reports': 'Insight Reports',
};

export default function Topbar({ lastProcessedAt, onClearData }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Placement Engine';
  const lastRunLabel = lastProcessedAt ? new Date(lastProcessedAt).toLocaleTimeString() : '--';
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!lastProcessedAt) return undefined;

    const lastRunMs = new Date(lastProcessedAt).getTime();
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.floor((Date.now() - lastRunMs) / 1000));
      setElapsedSeconds(seconds);
    }, 1000);

    return () => clearInterval(timer);
  }, [lastProcessedAt]);

  return (
    <header className='sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur'>
      <div className='flex h-16 items-center justify-between gap-4 px-4 md:px-6'>
        <div>
          <h1 className='text-lg font-semibold text-slate-900'>{title}</h1>
          <div className='flex items-center gap-2 text-xs text-slate-500'>
            <span className='inline-block h-2 w-2 rounded-full bg-emerald-500 pulse-highlight' />
            <span>Real-time offline engine active</span>
            <span>|</span>
            <span>Last run {lastRunLabel}</span>
            {lastProcessedAt ? <span>({elapsedSeconds}s ago)</span> : null}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='secondary' size='sm' onClick={onClearData}>
            <Trash2 className='h-4 w-4' />
            Clear Offline Data
          </Button>
        </div>
      </div>
    </header>
  );
}
