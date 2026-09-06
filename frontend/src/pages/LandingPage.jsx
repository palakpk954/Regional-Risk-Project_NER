import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  MessagesSquare,
  Sparkles,
  Target,
  UploadCloud,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const features = [
  { title: 'Recruitment Intelligence', text: 'Analyze branches, companies, skills, packages, and conversion with decision-ready charts.', icon: BarChart3 },
  { title: 'Resume Match Predictor', text: 'Compare student profiles against role requirements and explain missing skills clearly.', icon: FileSearch },
  { title: 'AI Mock Interviews', text: 'Generate role-aware HR, technical, behavioral, and project questions with feedback.', icon: MessagesSquare },
  { title: 'Placement Readiness', text: 'Give each student a roadmap with readiness score, weak areas, and next best actions.', icon: Target },
];

const stats = [
  ['84%', 'readiness lift'],
  ['6.8 LPA', 'avg package tracked'],
  ['128', 'profiles analyzed'],
  ['24', 'active drives'],
];

const MotionDiv = motion.div;
const MotionArticle = motion.article;

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className='pf-shell-bg min-h-screen overflow-hidden text-[var(--pf-text)]'>
      <nav className='mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-3'>
          <div className='rounded-xl bg-gradient-to-br from-sky-400 to-teal-300 p-2 text-white shadow-lg shadow-sky-400/20'>
            <BrainCircuit className='h-5 w-5' />
          </div>
          <div>
            <p className='text-sm font-bold tracking-wide'>Placify AI</p>
            <p className='text-xs text-[var(--pf-muted)]'>Placement readiness platform</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' onClick={() => navigate('/login')}>
            Sign in
          </Button>
          <Button onClick={() => navigate('/login')}>
            Open Dashboard
            <ArrowRight className='h-4 w-4' />
          </Button>
        </div>
      </nav>

      <section className='relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-20'>
        <div className='pointer-events-none absolute inset-x-0 top-[-24rem] h-[42rem] bg-[radial-gradient(circle,rgba(14,165,233,0.18),transparent_62%)]' />
        <MotionDiv initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className='relative'>
          <span className='inline-flex items-center gap-2 rounded-full border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm dark:text-teal-100'>
            <Sparkles className='h-3.5 w-3.5' />
            AI-powered placement intelligence for colleges
          </span>
          <h1 className='mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-[var(--pf-text)] md:text-7xl'>
            Turn placement data into readiness, matches, and confident decisions.
          </h1>
          <p className='mt-6 max-w-2xl text-base leading-7 text-[var(--pf-muted)] md:text-lg'>
            Placify AI helps TPOs manage drives and helps students improve job readiness through analytics, resume scoring, match prediction, and mock interviews.
          </p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <Button size='lg' onClick={() => navigate('/login')}>
              Try Demo
              <ArrowRight className='h-4 w-4' />
            </Button>
            <Button size='lg' variant='secondary' onClick={() => navigate('/login')}>
              View Student Portal
            </Button>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 24, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className='relative rounded-[28px] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4 shadow-[var(--pf-shadow)] backdrop-blur'
        >
          <div className='rounded-3xl border border-[var(--pf-border)] bg-white/75 p-4 dark:bg-slate-950/70'>
            <div className='flex items-center justify-between border-b border-[var(--pf-border)] pb-4'>
              <div>
                <p className='text-xs uppercase tracking-[0.18em] text-sky-600 dark:text-teal-200'>Command Center</p>
                <h2 className='mt-1 text-xl font-semibold'>Recruitment Intelligence</h2>
              </div>
              <span className='rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200'>Live Demo</span>
            </div>
            <div className='mt-4 grid grid-cols-2 gap-3'>
              {stats.map(([value, label]) => (
                <div key={label} className='rounded-2xl border border-[var(--pf-border)] bg-white/70 p-4 dark:bg-white/[0.04]'>
                  <p className='text-2xl font-bold'>{value}</p>
                  <p className='text-xs text-[var(--pf-muted)]'>{label}</p>
                </div>
              ))}
            </div>
            <div className='mt-4 rounded-3xl border border-[var(--pf-border)] bg-[var(--pf-surface-soft)] p-4'>
              <div className='mb-3 flex items-center justify-between text-xs text-[var(--pf-muted)]'>
                <span>Branch placement trend</span>
                <span>2026</span>
              </div>
              <div className='flex h-40 items-end gap-3'>
                {[48, 72, 64, 88, 55, 78, 92].map((height, index) => (
                  <div key={height + index} className='flex flex-1 items-end rounded-t-md bg-gradient-to-t from-teal-500/40 to-sky-400' style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </div>
        </MotionDiv>
      </section>

      <section className='mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8'>
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <MotionArticle
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className='rounded-[24px] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-5 shadow-[var(--pf-shadow)] transition hover:-translate-y-1 hover:border-[var(--pf-border-strong)]'
            >
              <Icon className='h-5 w-5 text-sky-500 dark:text-teal-200' />
              <h3 className='mt-4 text-base font-semibold'>{feature.title}</h3>
              <p className='mt-2 text-sm leading-6 text-[var(--pf-muted)]'>{feature.text}</p>
            </MotionArticle>
          );
        })}
      </section>

      <section className='mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8'>
        <PreviewCard title='Resume Parsing' icon={UploadCloud} lines={['Skills extracted', 'Projects mapped', 'ATS score generated']} />
        <PreviewCard title='Job Match Engine' icon={Target} lines={['Weighted score', 'Missing skills', 'Hiring probability']} />
        <PreviewCard title='Mock Interview' icon={MessagesSquare} lines={['Role questions', 'Timer + chat', 'Feedback summary']} />
      </section>

      <section className='mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8'>
        <div className='rounded-3xl border border-[var(--pf-border)] bg-gradient-to-br from-sky-400/15 to-teal-300/10 p-8 text-center shadow-[var(--pf-shadow)]'>
          <h2 className='text-3xl font-semibold md:text-4xl'>Built for a fast, impressive college demo.</h2>
          <p className='mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--pf-muted)]'>
            Local demo data works instantly. Gemini-powered interviews activate when an API key is configured.
          </p>
          <Button size='lg' className='mt-6' onClick={() => navigate('/login')}>
            Launch Placify AI
            <ArrowRight className='h-4 w-4' />
          </Button>
        </div>
      </section>

      <footer className='border-t border-[var(--pf-border)] px-4 py-8 text-center text-xs text-[var(--pf-muted)]'>
        Placify AI — Placement Readiness and Recruitment Intelligence Platform
      </footer>
    </main>
  );
}

function PreviewCard({ title, icon, lines }) {
  const PreviewIcon = icon;
  return (
    <div className='rounded-[24px] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-5 shadow-[var(--pf-shadow)]'>
      <div className='flex items-center gap-3'>
        <span className='rounded-xl bg-sky-100 p-2 text-sky-600 dark:bg-teal-300/10 dark:text-teal-100'>
          <PreviewIcon className='h-5 w-5' />
        </span>
        <h3 className='font-semibold'>{title}</h3>
      </div>
      <div className='mt-4 space-y-2'>
        {lines.map((line) => (
          <p key={line} className='flex items-center gap-2 text-sm text-[var(--pf-muted)]'>
            <CheckCircle2 className='h-4 w-4 text-emerald-300' />
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
