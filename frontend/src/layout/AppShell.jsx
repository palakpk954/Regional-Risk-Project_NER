import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { usePlacementStore } from '../store/usePlacementStore';

export default function AppShell() {
  const lastProcessedAt = usePlacementStore((state) => state.lastProcessedAt);
  const clearEngineData = usePlacementStore((state) => state.clearEngineData);

  useEffect(() => {
    // Keep document title aligned with the engine-first experience.
    document.title = 'Placify AI';
  }, []);

  return (
    <div className='flex min-h-screen bg-slate-50'>
      <Sidebar />
      <div className='flex min-w-0 flex-1 flex-col'>
        <Topbar
          lastProcessedAt={lastProcessedAt}
          onClearData={clearEngineData}
        />
        <main className='flex-1'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
