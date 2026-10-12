import { useState } from 'react';
import {
  ShieldAlert,
  Mountain,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Radio,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Cpu,
  FileText,
  Activity,
} from 'lucide-react';

const roles = [
  {
    id: 'sdma',
    role: 'Disaster Management Officer',
    badge: 'SDMA Authority',
    email: 'admin@sdma.gov.in',
    name: 'Officer P. Sangma',
    avatar: 'PS',
    description: 'Disaster control room, alert acknowledgement, team dispatch & evacuation orders.',
    icon: ShieldAlert,
    color: 'rose',
  },
  {
    id: 'research',
    role: 'Research Scientist',
    badge: 'NASA & JECRC Lab',
    email: 'palak.research@jecrc.ac.in',
    name: 'Palak Kumari (23BCON1858)',
    avatar: 'PK',
    description: 'Copernicus DEM Random Forest model, GPM IMERG 60-day rainfall thresholds & calibration.',
    icon: Cpu,
    color: 'emerald',
  },
  {
    id: 'ranger',
    role: 'Field Ranger',
    badge: 'Highway Response',
    email: 'ranger.ekh@forest.gov.in',
    name: 'K. Lyngdoh (Field Lead)',
    avatar: 'KL',
    description: 'Geo-tagged field incident reporting, photo verification & arterial road clearance.',
    icon: FileText,
    color: 'amber',
  },
  {
    id: 'citizen',
    role: 'Citizen Observer',
    badge: 'Public Advisory',
    email: 'citizen@resilience.in',
    name: 'Public Citizen Observer',
    avatar: 'CO',
    description: 'Real-time road transit status, safe detour guidance & multilingual early warnings.',
    icon: Activity,
    color: 'blue',
  },
];

export default function LoginPage({ onLogin, apiBase = 'http://localhost:5000/api' }) {
  const [selectedRole, setSelectedRole] = useState(roles[1]); // Default to Research Scientist (Palak Kumari)
  const [email, setEmail] = useState(roles[1].email);
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectRole = (roleItem) => {
    setSelectedRole(roleItem);
    setEmail(roleItem.email);
    setError('');
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email) {
      setError('Please provide an email address.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole.role,
        }),
      });

      const data = await response.json();
      if (data.ok && data.user) {
        if (rememberMe) {
          localStorage.setItem('himalya_watch_user', JSON.stringify(data.user));
          localStorage.setItem('himalya_watch_token', data.token || 'demo-token');
        }
        onLogin(data.user);
      } else {
        // Safe fallback
        const fallbackUser = {
          id: selectedRole.id,
          name: selectedRole.name,
          email,
          role: selectedRole.role,
          badge: selectedRole.badge,
          avatar: selectedRole.avatar,
        };
        if (rememberMe) {
          localStorage.setItem('himalya_watch_user', JSON.stringify(fallbackUser));
        }
        onLogin(fallbackUser);
      }
    } catch {
      // Offline direct authentication
      const fallbackUser = {
        id: selectedRole.id,
        name: selectedRole.name,
        email,
        role: selectedRole.role,
        badge: selectedRole.badge,
        avatar: selectedRole.avatar,
      };
      if (rememberMe) {
        localStorage.setItem('himalya_watch_user', JSON.stringify(fallbackUser));
      }
      onLogin(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = (roleItem) => {
    setSelectedRole(roleItem);
    setEmail(roleItem.email);
    const userObj = {
      id: roleItem.id,
      name: roleItem.name,
      email: roleItem.email,
      role: roleItem.role,
      badge: roleItem.badge,
      avatar: roleItem.avatar,
    };
    localStorage.setItem('himalya_watch_user', JSON.stringify(userObj));
    onLogin(userObj);
  };

  return (
    <div className='min-h-screen bg-[#0d2318] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white'>
      {/* Background Ambience */}
      <div className='fixed inset-0 pointer-events-none overflow-hidden opacity-30'>
        <div className='absolute -top-40 -left-40 w-96 h-96 bg-emerald-600 rounded-full blur-[140px]' />
        <div className='absolute top-1/2 -right-40 w-96 h-96 bg-teal-600 rounded-full blur-[160px]' />
        <div className='absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-800 rounded-full blur-[140px]' />
      </div>

      {/* Top Bar */}
      <header className='relative z-10 flex items-center justify-between px-6 py-6 border-b border-emerald-900/40 backdrop-blur-md bg-[#0d2318]/60 max-w-7xl mx-auto w-full'>
        <div className='flex items-center gap-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 text-white shadow-lg shadow-emerald-950'>
            <Mountain className='h-6 w-6' />
          </div>
          <div>
            <h1 className='text-base font-extrabold tracking-tight text-white'>Himālya Watch</h1>
            <p className='text-[10px] font-bold uppercase tracking-[.18em] text-emerald-400'>NER Resilience Grid</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <span className='hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-700/60 bg-emerald-950/60 px-3 py-1 text-[11px] font-bold text-emerald-300'>
            <Radio className='h-3 w-3 text-emerald-400 animate-pulse' /> Operational Telemetry Active
          </span>
          <span className='rounded-full bg-emerald-900/40 border border-emerald-700/50 px-2.5 py-1 text-[10px] font-mono text-emerald-200'>
            v2.4
          </span>
        </div>
      </header>

      {/* Main Auth Container */}
      <main className='relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8 my-auto max-w-6xl mx-auto w-full'>
        <div className='grid gap-8 lg:grid-cols-[1.1fr_1fr] w-full items-center'>
          
          {/* Left Column: Welcome & Research Paper Hero */}
          <div className='space-y-6'>
            <div className='inline-flex items-center gap-2 rounded-full border border-emerald-600/40 bg-emerald-950/60 px-3.5 py-1 text-xs font-bold text-emerald-300 shadow-sm'>
              <Sparkles className='h-3.5 w-3.5 text-emerald-400' />
              <span>North Eastern Region Early Warning System</span>
            </div>

            <div>
              <h2 className='text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1]'>
                Welcome to our <br />
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300'>
                  Regional Risk Calculator
                </span>
              </h2>
              <p className='mt-4 text-sm sm:text-base text-emerald-100/80 leading-relaxed max-w-xl'>
                Autonomous landslide hazard monitoring combining <b>NASA Global Landslide Catalog (GLC)</b> ground truth, <b>GPM IMERG</b> antecedent rainfall thresholding, and <b>Copernicus DEM</b> Random Forest susceptibility modeling for Meghalaya & NER.
              </p>
            </div>

            {/* Academic Paper Accreditation Card */}
            <div className='rounded-2xl border border-emerald-800/60 bg-emerald-950/50 p-4 sm:p-5 backdrop-blur-md shadow-xl space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-[10px] font-bold uppercase tracking-wider text-emerald-400'>
                  Scientific Case Study & Model
                </span>
                <span className='rounded bg-emerald-800/80 px-2 py-0.5 text-[10px] font-mono text-emerald-200 font-bold'>
                  ROC-AUC = 0.7313
                </span>
              </div>
              <p className='text-xs font-semibold text-white leading-snug'>
                "Automated Landslide Risk Monitoring and Early Warning System Through AI for the North Eastern Region of India: A Case Study of Meghalaya"
              </p>
              <div className='flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-emerald-300/80'>
                <span><b>Palak Kumari</b> (23BCON1858)</span>
                <span>• JECRC University, Jaipur</span>
                <span>• 35 Validated Meghalaya Events</span>
              </div>
            </div>

            {/* Feature Pills */}
            <div className='grid grid-cols-2 gap-3 pt-2 text-xs text-emerald-200/90'>
              <div className='flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-2.5'>
                <ShieldCheck className='h-4 w-4 text-emerald-400 shrink-0' />
                <span>Seismic Zone V & Monsoon Resilient</span>
              </div>
              <div className='flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-2.5'>
                <Radio className='h-4 w-4 text-emerald-400 shrink-0' />
                <span>LoRaWAN Sensor Backhaul</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login Card */}
          <div className='rounded-3xl border border-emerald-700/40 bg-white/95 p-6 sm:p-8 text-slate-900 shadow-2xl backdrop-blur-xl'>
            <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
              <div>
                <h3 className='text-lg font-extrabold text-slate-900'>Access Calculator Portal</h3>
                <p className='text-xs text-slate-500'>Select your operational role or sign in below</p>
              </div>
              <div className='rounded-xl bg-emerald-100 p-2 text-emerald-800'>
                <UserCheck className='h-5 w-5' />
              </div>
            </div>

            {/* Role Selectors */}
            <div className='mt-5 space-y-2'>
              <label className='block text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                Select Operational Role
              </label>
              <div className='grid grid-cols-2 gap-2'>
                {roles.map((r) => {
                  const isSelected = selectedRole.id === r.id;
                  return (
                    <button
                      key={r.id}
                      type='button'
                      onClick={() => selectRole(r)}
                      className={`flex flex-col text-left p-3 rounded-xl border transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        <span className='text-[9px] font-bold uppercase tracking-wider text-slate-400'>
                          {r.badge}
                        </span>
                      </div>
                      <b className='mt-1 text-xs font-bold leading-tight'>{r.role}</b>
                      <span className='text-[10px] text-slate-500 truncate mt-0.5'>{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleLogin} className='mt-5 space-y-4'>
              <div>
                <label className='block text-[11px] font-bold text-slate-600 mb-1'>Authorized Email</label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder='officer@regionalrisk.gov.in'
                    className='w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                  />
                </div>
              </div>

              <div>
                <label className='block text-[11px] font-bold text-slate-600 mb-1'>Security Password</label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder='••••••••••••'
                    className='w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword((prev) => !prev)}
                    className='absolute right-3 top-2.5 text-slate-400 hover:text-slate-600'
                  >
                    {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>
              </div>

              <div className='flex items-center justify-between text-xs text-slate-500'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className='rounded border-slate-300 text-emerald-600 focus:ring-emerald-500'
                  />
                  <span>Keep session signed in</span>
                </label>
                <span className='text-[11px] text-emerald-700 font-bold'>Demo credentials loaded</span>
              </div>

              {error && (
                <div className='rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-semibold'>
                  {error}
                </div>
              )}

              <button
                type='submit'
                disabled={loading}
                className='w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-900 transition disabled:opacity-50'
              >
                <span>{loading ? 'Authenticating…' : 'Enter Regional Risk Calculator'}</span>
                <ArrowRight className='h-4 w-4' />
              </button>
            </form>

            {/* 1-Click Fast Role Sign-In */}
            <div className='mt-5 pt-4 border-t border-slate-100'>
              <p className='text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2'>
                Instant 1-Click Role Login
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type='button'
                    onClick={() => quickLoginAs(r)}
                    className='rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition'
                  >
                    {r.name.split(' ')[0]} ({r.badge.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='relative z-10 py-4 text-center text-xs text-emerald-400/60 border-t border-emerald-900/40'>
        <p>
          Himālya Watch · Indian North Eastern Region Landslide Resilience Grid · JECRC University AI Early Warning Research
        </p>
      </footer>
    </div>
  );
}
