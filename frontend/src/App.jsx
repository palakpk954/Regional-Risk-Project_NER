import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './layout/AppShell';
import Skeleton from './components/ui/Skeleton';

// Lazy loaded pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const MigrationPage = lazy(() => import('./pages/MigrationPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage'));

export default function App() {
  return (
    <Suspense fallback={<div className='p-6'><Skeleton className='h-16 w-full' /></div>}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path='/' element={<AdminDashboard />} />
          <Route path='/migration' element={<MigrationPage />} />
          <Route path='/reports' element={<ReportsPage />} />
          <Route path='/simulator' element={<SimulatorPage />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}