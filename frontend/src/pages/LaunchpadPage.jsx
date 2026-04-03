import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  DatabaseBackup,
  LayoutDashboard,
  Rocket,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Users2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';

const steps = [
  {
    id: '01',
    title: 'Import Data in Migration',
    subtitle: 'Bring student records from CSV, Excel, or Google Sheets into the engine.',
    route: '/migration',
    actionLabel: 'Open Migration',
    icon: DatabaseBackup,
    tone: 'border-sky-200 bg-sky-50/70',
    checklist: [
      'Upload CSV or Excel, or paste a public Google Sheet URL.',
      'Use Load Demo Dataset for instant presentation mode.',
      'Confirm cleaned student count and preview rows before moving ahead.',
    ],
    output: 'You get validated records, baseline KPIs, and company intelligence detection.',
  },
  {
    id: '02',
    title: 'Read Campus Snapshot on Dashboard',
    subtitle: 'Understand placement performance, branch spread, and company distribution quickly.',
    route: '/',
    actionLabel: 'Open Dashboard',
    icon: LayoutDashboard,
    tone: 'border-indigo-200 bg-indigo-50/70',
    checklist: [
      'Review total students, placed students, and placement rate.',
      'Click chart segments to filter and focus on a company or branch.',
      'Export filtered student rows when faculty asks for evidence.',
    ],
    output: 'You get a single-screen operational view for current cycle performance.',
  },
  {
    id: '03',
    title: 'Track Student Readiness',
    subtitle: 'Move from aggregate analytics to student-level intervention planning.',
    route: '/students',
    actionLabel: 'Open Students',
    icon: Users2,
    tone: 'border-emerald-200 bg-emerald-50/70',
    checklist: [
      'Filter by branch and readiness band to build action cohorts.',
      'Scan intervention queue to identify highest-risk students.',
      'Use recommended actions as mentoring and training inputs.',
    ],
    output: 'You get a prioritized support list and student-wise readiness visibility.',
  },
  {
    id: '04',
    title: 'Run What-Ifs in Outcome Planner',
    subtitle: 'Simulate policy changes before rolling them out in real placement cycles.',
    route: '/simulator',
    actionLabel: 'Open Planner',
    icon: SlidersHorizontal,
    tone: 'border-amber-200 bg-amber-50/70',
    checklist: [
      'Adjust CGPA threshold and branch scope.',
      'Compare projected placement rate with baseline.',
      'Capture the expected delta to justify your strategy.',
    ],
    output: 'You get scenario-backed decisions instead of intuition-only planning.',
  },
  {
    id: '05',
    title: 'Publish Insights and Reports',
    subtitle: 'Package outcomes into stakeholder-ready summaries and AI-enhanced narratives.',
    route: '/reports',
    actionLabel: 'Open Reports',
    icon: BarChart3,
    tone: 'border-violet-200 bg-violet-50/70',
    checklist: [
      'Download summary text for principal/TPO review.',
      'Open AI Report Studio for optional model-based narratives.',
      'Combine dashboard metrics + simulation impact in your final briefing.',
    ],
    output: 'You get a final intelligence report ready for meetings and review boards.',
  },
];

const demoRun = [
  'Import demo dataset from Migration.',
  'Show dashboard filters and chart drill-downs.',
  'Open Students and explain intervention queue.',
  'Run one conservative and one aggressive simulation.',
  'Download report summary and show AI report studio option.',
];

export default function LaunchpadPage() {
  const navigate = useNavigate();

  return (
    <PageContainer className='space-y-8'>
      <Card className='card-hover relative overflow-hidden border-indigo-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50'>
        <div className='pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-indigo-100/60 blur-2xl' />
        <div className='pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-sky-100/70 blur-2xl' />

        <div className='relative'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700'>
            <Rocket className='h-3.5 w-3.5' />
            Placify Launchpad
          </div>

          <SectionHeader
            title='How To Use Placify Step by Step'
            subtitle='Follow this launch flow to move from raw student data to decision-ready placement intelligence in one guided journey.'
            action={
              <Button onClick={() => navigate('/migration')}>
                Start Flow
                <ArrowRight className='h-4 w-4' />
              </Button>
            }
          />

          <div className='grid gap-3 md:grid-cols-3'>
            <div className='rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700'>
              <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Best For</p>
              <p className='mt-1'>Demo presentations, TPO reviews, weekly placement war-rooms.</p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700'>
              <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Run Time</p>
              <p className='mt-1 inline-flex items-center gap-1.5'>
                <Timer className='h-4 w-4 text-indigo-600' />
                5-7 minutes for complete walkthrough.
              </p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700'>
              <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Outcome</p>
              <p className='mt-1'>Clear insights, targeted interventions, and export-ready reports.</p>
            </div>
          </div>
        </div>
      </Card>

      <div className='grid gap-4 xl:grid-cols-2'>
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.id} className={`card-hover border ${step.tone}`}>
              <div className='mb-3 flex items-start justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-900 shadow-sm'>
                    {step.id}
                  </div>
                  <div>
                    <h3 className='text-base font-semibold text-slate-900'>{step.title}</h3>
                    <p className='text-sm text-slate-600'>{step.subtitle}</p>
                  </div>
                </div>
                <div className='rounded-lg border border-white/80 bg-white p-2'>
                  <Icon className='h-4 w-4 text-slate-700' />
                </div>
              </div>

              <div className='space-y-2'>
                {step.checklist.map((item) => (
                  <p key={item} className='inline-flex w-full items-start gap-2 rounded-lg border border-white/80 bg-white px-3 py-2 text-sm text-slate-700'>
                    <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600' />
                    <span>{item}</span>
                  </p>
                ))}
              </div>

              <div className='mt-3 rounded-lg border border-white/80 bg-white px-3 py-2 text-sm text-slate-700'>
                <span className='font-semibold text-slate-900'>Result: </span>
                {step.output}
              </div>

              <div className='mt-4'>
                <Button variant='secondary' onClick={() => navigate(step.route)}>
                  {step.actionLabel}
                  <ArrowRight className='h-4 w-4' />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className='card-hover border-emerald-100 bg-emerald-50/70'>
        <SectionHeader
          title='7-Minute Demo Script'
          subtitle='Use this exact sequence during showcases and evaluations.'
          action={<Sparkles className='h-4 w-4 text-emerald-700' />}
        />

        <div className='grid gap-2 md:grid-cols-2'>
          {demoRun.map((item, index) => (
            <div key={item} className='rounded-xl border border-emerald-200 bg-white p-3 text-sm text-slate-700'>
              <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700'>Step {index + 1}</p>
              <p className='mt-1'>{item}</p>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
