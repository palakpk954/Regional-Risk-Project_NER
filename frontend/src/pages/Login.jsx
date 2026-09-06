import { ArrowRight, BarChart3, CheckCircle2, Database, Moon, Sparkles, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup } from '../services/authService';
import { usePlacementStore } from '../store/usePlacementStore';

const DEMO = {
  admin: { email: 'admin@placify.edu', password: 'admin123', label: 'TPO Demo' },
  student: { email: 'student@placify.edu', password: 'student123', label: 'Student Demo' },
};

function useLoginTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('placify-theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('placify-theme', theme);
    } catch {
      // Keep theme local to the session when storage is unavailable.
    }
  }, [theme]);

  return [theme, setTheme];
}

function DemoPreviewCard() {
  return (
    <div className='rounded-[32px] border border-[var(--pf-border)] bg-[var(--pf-surface-strong)] p-5 shadow-[var(--pf-shadow)] backdrop-blur-2xl'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-semibold text-[var(--pf-text)]'>Placement Overview</p>
          <p className='text-xs text-[var(--pf-muted)]'>Preview after importing student data</p>
        </div>
        <span className='rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200'>
          Sample
        </span>
      </div>

      <div className='mt-5 grid gap-3 sm:grid-cols-3'>
        {[
          ['Students', 'After import'],
          ['Eligible', 'Auto-calculated'],
          ['At Risk', 'Predicted'],
        ].map(([label, value]) => (
          <div key={label} className='rounded-3xl border border-[var(--pf-border)] bg-white/70 p-4 dark:bg-white/5'>
            <p className='text-xs text-[var(--pf-muted)]'>{label}</p>
            <p className='mt-2 text-lg font-semibold text-[var(--pf-text)]'>{value}</p>
          </div>
        ))}
      </div>

      <div className='mt-5 rounded-3xl border border-[var(--pf-border)] bg-white/70 p-4 dark:bg-white/5'>
        <div className='mb-3 flex items-center justify-between'>
          <p className='text-sm font-semibold text-[var(--pf-text)]'>Branch Readiness</p>
          <BarChart3 className='h-4 w-4 text-sky-500' />
        </div>
        <div className='space-y-3'>
          {[
            ['CSE', 82, 'bg-sky-400'],
            ['IT', 74, 'bg-teal-400'],
            ['ECE', 58, 'bg-violet-400'],
          ].map(([label, value, color]) => (
            <div key={label}>
              <div className='mb-1 flex justify-between text-xs text-[var(--pf-muted)]'>
                <span>{label}</span>
                <span>{value}%</span>
              </div>
              <div className='h-2 rounded-full bg-slate-200 dark:bg-slate-800'>
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState(DEMO.admin.email);
  const [password, setPassword] = useState(DEMO.admin.password);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useLoginTheme();
  const navigate = useNavigate();
  const refreshData = usePlacementStore((state) => state.refreshData);

  const applyDemoRole = (nextRole) => {
    setRole(nextRole);
    setEmail(DEMO[nextRole].email);
    setPassword(DEMO[nextRole].password);
    setError('');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(role, email, password);
    if (result.ok) {
      refreshData();
      navigate(role === 'admin' ? '/tpo/dashboard' : '/student/dashboard');
    } else {
      setError(result.error || 'Could not sign in. Check the demo credentials.');
    }

    setLoading(false);
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await signup(email, password, {
      name: name || email,
      cgpa: cgpa ? Number(cgpa) : 0,
      phone: '',
      interests: [],
      activeBacklogs: 0,
    });

    if (result.ok) {
      refreshData();
      navigate('/student/dashboard');
    } else {
      setError(result.error || 'Could not create account.');
    }

    setLoading(false);
  };

  return (
    <div className='pf-shell-bg min-h-screen px-4 py-6 text-[var(--pf-text)] md:px-6'>
      <header className='mx-auto flex max-w-[1120px] items-center justify-between rounded-[28px] border border-[var(--pf-border)] bg-[var(--pf-surface-strong)] px-4 py-3 shadow-[var(--pf-shadow)] backdrop-blur-2xl'>
        <div className='flex items-center gap-3'>
          <div className='grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-teal-300 text-white shadow-lg shadow-sky-400/20'>
            <Database className='h-5 w-5' />
          </div>
          <div>
            <p className='font-semibold text-[var(--pf-text)]'>Placify</p>
            <p className='text-xs text-[var(--pf-muted)]'>Placement made simple</p>
          </div>
        </div>

        <button
          type='button'
          onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
          className='grid h-10 w-10 place-items-center rounded-2xl border border-[var(--pf-border)] bg-white/70 text-slate-700 dark:bg-white/5 dark:text-slate-200'
          title='Toggle theme'
        >
          {theme === 'dark' ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
        </button>
      </header>

      <main className='mx-auto grid max-w-[1120px] gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
        <section>
          <div className='inline-flex items-center gap-2 rounded-full border border-[var(--pf-border)] bg-white/70 px-3 py-1 text-sm text-[var(--pf-muted)] shadow-sm dark:bg-white/5'>
            <Sparkles className='h-4 w-4 text-sky-500' />
            Demo credentials ready
          </div>

          <h1 className='mt-6 max-w-2xl text-4xl font-extrabold tracking-tight text-[var(--pf-text)] md:text-6xl'>
            Turn student data into a clean placement dashboard.
          </h1>
          <p className='mt-5 max-w-xl text-base leading-8 text-[var(--pf-muted)]'>
            Paste a Google Sheet, upload Excel, or use the demo data. Placify instantly shows eligible students,
            placement progress, resume gaps, and students who need help.
          </p>

          <div className='mt-8 grid gap-3 sm:grid-cols-3'>
            {['Import data', 'See charts', 'Export reports'].map((item) => (
              <div key={item} className='flex items-center gap-2 rounded-2xl border border-[var(--pf-border)] bg-white/65 px-4 py-3 text-sm font-semibold text-[var(--pf-text)] shadow-sm dark:bg-white/5'>
                <CheckCircle2 className='h-4 w-4 text-teal-500' />
                {item}
              </div>
            ))}
          </div>

          <div className='mt-8 hidden lg:block'>
            <DemoPreviewCard />
          </div>
        </section>

        <section className='rounded-[34px] border border-[var(--pf-border)] bg-[var(--pf-surface-strong)] p-5 shadow-[var(--pf-shadow)] backdrop-blur-2xl md:p-7'>
          <div className='mb-6'>
            <p className='text-sm font-semibold text-sky-600 dark:text-sky-300'>Explore demo</p>
            <h2 className='mt-2 text-2xl font-bold text-[var(--pf-text)]'>
              {isSignup ? 'Create student account' : 'Sign in instantly'}
            </h2>
            <p className='mt-2 text-sm text-[var(--pf-muted)]'>
              Use the ready credentials for a smooth college demo.
            </p>
          </div>

          {!isSignup ? (
            <form onSubmit={handleLogin} className='space-y-4'>
              <div className='grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900'>
                {['admin', 'student'].map((item) => (
                  <button
                    key={item}
                    type='button'
                    onClick={() => applyDemoRole(item)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      role === item
                        ? 'bg-white text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-200'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {DEMO[item].label}
                  </button>
                ))}
              </div>

              <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'>
                Demo Credentials Ready
              </div>

              <label className='block'>
                <span className='mb-1 block text-sm font-semibold text-[var(--pf-text)]'>Email</span>
                <input
                  type='email'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className='h-12 w-full rounded-2xl border border-[var(--pf-border)] bg-white/80 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-200/40 dark:bg-white/5 dark:text-white'
                />
              </label>

              <label className='block'>
                <span className='mb-1 block text-sm font-semibold text-[var(--pf-text)]'>Password</span>
                <input
                  type='password'
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className='h-12 w-full rounded-2xl border border-[var(--pf-border)] bg-white/80 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-200/40 dark:bg-white/5 dark:text-white'
                />
              </label>

              {error ? <p className='rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-200'>{error}</p> : null}

              <button
                type='submit'
                disabled={loading}
                className='group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-60'
              >
                {loading ? 'Opening dashboard...' : 'Explore Demo Dashboard'}
                <ArrowRight className='h-4 w-4 transition group-hover:translate-x-0.5' />
              </button>

              <button
                type='button'
                onClick={() => {
                  setIsSignup(true);
                  setRole('student');
                  setEmail('');
                  setPassword('');
                }}
                className='w-full rounded-2xl border border-[var(--pf-border)] bg-white/60 py-3 text-sm font-semibold text-[var(--pf-muted)] transition hover:bg-white hover:text-[var(--pf-text)] dark:bg-white/5 dark:hover:bg-white/10'
              >
                Create a student account
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className='space-y-4'>
              <label className='block'>
                <span className='mb-1 block text-sm font-semibold text-[var(--pf-text)]'>Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className='h-12 w-full rounded-2xl border border-[var(--pf-border)] bg-white/80 px-4 text-sm text-slate-900 outline-none dark:bg-white/5 dark:text-white' />
              </label>
              <label className='block'>
                <span className='mb-1 block text-sm font-semibold text-[var(--pf-text)]'>Email</span>
                <input type='email' value={email} onChange={(event) => setEmail(event.target.value)} className='h-12 w-full rounded-2xl border border-[var(--pf-border)] bg-white/80 px-4 text-sm text-slate-900 outline-none dark:bg-white/5 dark:text-white' />
              </label>
              <div className='grid gap-3 sm:grid-cols-2'>
                <label className='block'>
                  <span className='mb-1 block text-sm font-semibold text-[var(--pf-text)]'>Password</span>
                  <input type='password' value={password} onChange={(event) => setPassword(event.target.value)} className='h-12 w-full rounded-2xl border border-[var(--pf-border)] bg-white/80 px-4 text-sm text-slate-900 outline-none dark:bg-white/5 dark:text-white' />
                </label>
                <label className='block'>
                  <span className='mb-1 block text-sm font-semibold text-[var(--pf-text)]'>CGPA</span>
                  <input type='number' min='0' max='10' step='0.01' value={cgpa} onChange={(event) => setCgpa(event.target.value)} className='h-12 w-full rounded-2xl border border-[var(--pf-border)] bg-white/80 px-4 text-sm text-slate-900 outline-none dark:bg-white/5 dark:text-white' />
                </label>
              </div>

              {error ? <p className='rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-200'>{error}</p> : null}

              <button type='submit' disabled={loading} className='h-12 w-full rounded-2xl bg-sky-500 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-60'>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
              <button type='button' onClick={() => applyDemoRole('admin') || setIsSignup(false)} className='w-full rounded-2xl border border-[var(--pf-border)] bg-white/60 py-3 text-sm font-semibold text-[var(--pf-muted)] dark:bg-white/5'>
                Back to demo login
              </button>
            </form>
          )}
        </section>

        <div className='lg:hidden'>
          <DemoPreviewCard />
        </div>
      </main>
    </div>
  );
}
