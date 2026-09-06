import { createElement, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  DatabaseZap,
  Info,
  LineChart,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Button from '../components/Button';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import { calculateJobMatch, inferStudentProfile } from '../services/jobMatchService';
import { usePlacementStore } from '../store/usePlacementStore';

const CATBOOST_FEATURE_IMPORTANCE = [
  { name: 'CGPA', value: 22, color: '#38bdf8' },
  { name: 'Attendance', value: 18, color: '#5eead4' },
  { name: 'ATS Score', value: 17, color: '#a78bfa' },
  { name: 'Projects', value: 15, color: '#34d399' },
  { name: 'Communication', value: 14, color: '#f59e0b' },
  { name: 'Internships', value: 14, color: '#fb7185' },
];
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function scoreLabel(probability) {
  if (probability >= 72) return 'High Chance';
  if (probability >= 46) return 'Medium';
  return 'At Risk';
}

function riskTone(category) {
  if (category === 'High Chance') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200';
  if (category === 'Medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200';
  return 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200';
}

function MiniMetric({ label, value, helper, icon }) {
  return (
    <Card className='p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[var(--pf-muted)]'>{label}</p>
          <p className='mt-2 text-3xl font-semibold text-[var(--pf-text)]'>{value}</p>
          <p className='mt-1 text-xs text-[var(--pf-muted)]'>{helper}</p>
        </div>
        <span className='grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200'>
          {createElement(icon, { className: 'h-5 w-5' })}
        </span>
      </div>
    </Card>
  );
}

function FeatureImportanceRow({ item }) {
  return (
    <div>
      <div className='mb-1 flex items-center justify-between gap-3 text-xs'>
        <span className='font-semibold text-[var(--pf-text)]'>{item.name}</span>
        <span className='text-[var(--pf-muted)]'>{item.value}%</span>
      </div>
      <div className='h-2 rounded-full bg-slate-200/80 dark:bg-white/10'>
        <div className='h-2 rounded-full transition-all duration-500' style={{ width: `${item.value}%`, background: item.color }} />
      </div>
    </div>
  );
}

function PredictionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className='rounded-xl border border-[var(--pf-border)] bg-white px-3 py-2 text-xs shadow-xl dark:bg-[#07111f]'>
      <p className='font-semibold text-[var(--pf-text)]'>{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className='mt-1 text-[var(--pf-muted)]'>
          <span style={{ color: item.color }}>●</span> {item.name || item.dataKey}: {item.value}
        </p>
      ))}
    </div>
  );
}

export default function TpoPredictionPage() {
  const students = usePlacementStore((state) => state.students);
  const companies = usePlacementStore((state) => state.companies);
  const studentRows = usePlacementStore((state) => state.studentPlacementRows);
  const applications = usePlacementStore((state) => state.applicationViews);
  const migrationSource = usePlacementStore((state) => state.migrationSource);
  const [modelInfo, setModelInfo] = useState(null);
  const [predictionRows, setPredictionRows] = useState([]);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreStatus, setScoreStatus] = useState('Waiting for student data');
  const [selectedPredictionId, setSelectedPredictionId] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(`${BACKEND_BASE}/api/intelligence/prediction-summary`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active) setModelInfo(data);
      })
      .catch(() => {
        if (active) setModelInfo(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const fallbackRows = useMemo(() => {
    const sourceStudents = studentRows.length ? studentRows : students;
    const activeDrives = companies.filter((company) => !['closed', 'archived', 'draft'].includes(String(company.status || 'Open').toLowerCase()));

    return sourceStudents.map((student) => {
      const profile = inferStudentProfile(student);
      const matches = activeDrives
        .map((drive) => ({ drive, match: calculateJobMatch(profile, drive) }))
        .sort((a, b) => b.match.hiringProbability - a.match.hiringProbability);
      const best = matches[0];
      const probability = best?.match?.hiringProbability || Math.round(profile.resumeScore * 0.52 + profile.cgpa * 4.2);
      const category = scoreLabel(probability);
      const applicationsCount = applications.filter((application) => application.studentId === student.id).length;

      return {
        id: student.id || student.enrollment || student.email || student.name,
        name: student.name || 'Student',
        branch: student.branch || 'NA',
        cgpa: profile.cgpa,
        attendance: Number(student.attendance ?? profile.attendance ?? 0),
        atsScore: profile.atsScore,
        bestDrive: best?.drive?.name || best?.drive?.company || 'No active drive',
        role: best?.drive?.role || 'General placement',
        probability,
        shortlistProbability: best?.match?.shortlistedProbability || probability,
        category,
        positiveFactors: best?.match?.strengths?.length
          ? best.match.strengths.slice(0, 2)
          : [profile.cgpa >= 7.5 ? 'CGPA is in a healthy range.' : 'Profile has baseline placement data.'],
        negativeFactors: best?.match?.weakAreas?.length
          ? best.match.weakAreas.slice(0, 2)
          : [profile.activeBacklogs > 0 ? 'Active backlogs reduce eligibility.' : 'No company-specific role selected.'],
        suggestions: best?.match?.suggestedImprovements?.slice(0, 2) || ['Improve ATS keywords and add role-specific project proof.'],
        applicationsCount,
        modelUsed: modelInfo?.activeModel || 'rules-fallback-v1',
      };
    }).sort((a, b) => a.probability - b.probability);
  }, [applications, companies, modelInfo, studentRows, students]);

  useEffect(() => {
    const sourceStudents = studentRows.length ? studentRows : students;
    const activeDrives = companies.filter((company) => !['closed', 'archived', 'draft'].includes(String(company.status || 'Open').toLowerCase()));

    if (!sourceStudents.length) {
      setPredictionRows([]);
      setScoreStatus('Import student data to score predictions');
      return undefined;
    }

    let cancelled = false;
    setIsScoring(true);
    setScoreStatus('Scoring students through backend prediction API...');

    async function scoreStudents() {
      const rows = await Promise.all(sourceStudents.map(async (student) => {
        const fallback = fallbackRows.find((row) => row.id === (student.id || student.enrollment || student.email || student.name));
        const profile = inferStudentProfile(student);
        const matches = activeDrives
          .map((drive) => ({ drive, match: calculateJobMatch(profile, drive) }))
          .sort((a, b) => b.match.hiringProbability - a.match.hiringProbability);
        const best = matches[0]?.drive || {};
        const applicationsCount = applications.filter((application) => application.studentId === student.id).length;

        try {
          const response = await fetch(`${BACKEND_BASE}/api/match/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student: { ...student, applicationsCount },
              drive: best,
              datasetContext: { applicationsCount, source: migrationSource || 'local-demo' },
            }),
          });
          if (!response.ok) throw new Error('Prediction API failed');
          const result = await response.json();
          const probability = Math.round(Number(result.probability || fallback?.probability || 0));

          return {
            ...fallback,
            probability,
            shortlistProbability: Math.round(Number(result.shortlistProbability || fallback?.shortlistProbability || probability)),
            category: result.riskCategory || scoreLabel(probability),
            positiveFactors: result.positiveFactors?.length ? result.positiveFactors.slice(0, 2) : fallback?.positiveFactors || [],
            negativeFactors: result.negativeFactors?.length ? result.negativeFactors.slice(0, 2) : fallback?.negativeFactors || [],
            suggestions: result.suggestions?.length ? result.suggestions.slice(0, 2) : fallback?.suggestions || [],
            modelUsed: result.modelUsed || fallback?.modelUsed || 'rules-fallback-v1',
            catboostAvailable: Boolean(result.catboostAvailable),
          };
        } catch {
          return {
            ...fallback,
            modelUsed: fallback?.modelUsed || 'rules-fallback-v1',
            catboostAvailable: false,
          };
        }
      }));

      if (!cancelled) {
        const sorted = rows.filter(Boolean).sort((a, b) => a.probability - b.probability);
        setPredictionRows(sorted);
        const activeModel = sorted.find((row) => row.modelUsed === 'catboost-tabular-v1') ? 'catboost-tabular-v1' : 'rules-fallback-v1';
        setScoreStatus(activeModel === 'catboost-tabular-v1'
          ? 'CatBoost predictions are active in the frontend queue'
          : 'Using fallback predictions because ML API is unavailable');
        setIsScoring(false);
      }
    }

    void scoreStudents();

    return () => {
      cancelled = true;
    };
  }, [applications, companies, fallbackRows, migrationSource, studentRows, students]);

  const summary = useMemo(() => {
    const total = predictionRows.length;
    const average = total ? Math.round(predictionRows.reduce((sum, row) => sum + row.probability, 0) / total) : 0;
    const high = predictionRows.filter((row) => row.category === 'High Chance').length;
    const medium = predictionRows.filter((row) => row.category === 'Medium').length;
    const risk = predictionRows.filter((row) => row.category === 'At Risk').length;
    return { total, average, high, medium, risk };
  }, [predictionRows]);

  useEffect(() => {
    if (!predictionRows.length) {
      setSelectedPredictionId(null);
      return;
    }
    if (!selectedPredictionId || !predictionRows.some((row) => row.id === selectedPredictionId)) {
      setSelectedPredictionId(predictionRows[0].id);
    }
  }, [predictionRows, selectedPredictionId]);

  const pieData = [
    { name: 'High Chance', value: summary.high, color: '#34d399' },
    { name: 'Medium', value: summary.medium, color: '#f59e0b' },
    { name: 'At Risk', value: summary.risk, color: '#fb7185' },
  ];

  const selectedPrediction = predictionRows.find((row) => row.id === selectedPredictionId) || predictionRows[0];

  const tableRows = predictionRows.slice(0, 10).map((row) => ({
    ...row,
    probability: `${row.probability}%`,
    reason: row.negativeFactors[0] || row.positiveFactors[0],
  }));

  const tableColumns = [
    { key: 'name', label: 'Student' },
    { key: 'branch', label: 'Branch' },
    { key: 'bestDrive', label: 'Best Drive' },
    { key: 'probability', label: 'Probability' },
    {
      key: 'category',
      label: 'Risk',
      render: (value) => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${riskTone(value)}`}>{value}</span>,
    },
    { key: 'reason', label: 'Top Factor' },
  ];

  return (
    <PageContainer className='space-y-5'>
      <section className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-sm font-medium text-[var(--pf-muted)]'>Placement Predictor AI</p>
          <h1 className='mt-2 text-2xl font-semibold tracking-tight text-[var(--pf-text)] md:text-3xl'>
            Explainable placement prediction intelligence
          </h1>
          <p className='mt-1 max-w-3xl text-sm leading-6 text-[var(--pf-muted)]'>
            CatBoost is prepared for tabular placement data, while transparent rules keep the minor-project demo reliable when the ML service is not running.
          </p>
        </div>
        <Button variant='secondary' onClick={() => window.location.reload()}>
          <LineChart className='h-4 w-4' />
          Refresh Scores
        </Button>
      </section>

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MiniMetric label='Students Scored' value={isScoring ? '...' : summary.total} helper={migrationSource ? `From ${migrationSource}` : scoreStatus} icon={DatabaseZap} />
        <MiniMetric label='Avg Probability' value={`${summary.average}%`} helper='Mean placement probability' icon={BrainCircuit} />
        <MiniMetric label='High Chance' value={summary.high} helper='Profiles ready for active drives' icon={CheckCircle2} />
        <MiniMetric label='At Risk' value={summary.risk} helper='Needs intervention before drives' icon={AlertTriangle} />
      </section>

      <section className={`rounded-[26px] border p-4 shadow-[var(--pf-shadow)] ${
        modelInfo?.activeModel === 'catboost-tabular-v1'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100'
          : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100'
      }`}>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-sm font-semibold'>
              {modelInfo?.activeModel === 'catboost-tabular-v1' ? 'CatBoost is active end-to-end' : 'Fallback model is active'}
            </p>
            <p className='mt-1 text-xs opacity-80'>
              {scoreStatus}. Frontend requests go through Node `/api/match/predict`, which calls the Python ML API when available.
            </p>
          </div>
          <span className='rounded-full bg-white/60 px-3 py-1 text-xs font-semibold dark:bg-white/10'>
            {modelInfo?.activeModel || 'checking model'}
          </span>
        </div>
      </section>

      <section className='grid gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
        <Card className='p-5'>
          <SectionHeader
            title='CatBoost Feature Importance'
            subtitle='The strongest tabular signals used by the placement model.'
          />
          <div className='grid gap-4 lg:grid-cols-[0.9fr_1.1fr]'>
            <div className='space-y-4'>
              {CATBOOST_FEATURE_IMPORTANCE.map((item) => <FeatureImportanceRow key={item.name} item={item} />)}
            </div>
            <ResponsiveContainer width='100%' height={260}>
              <BarChart data={CATBOOST_FEATURE_IMPORTANCE}>
                <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,0.18)' />
                <XAxis dataKey='name' tick={{ fill: '#8da0b8', fontSize: 11 }} interval={0} angle={-18} textAnchor='end' height={62} />
                <YAxis tick={{ fill: '#8da0b8', fontSize: 12 }} />
                <Tooltip content={<PredictionTooltip />} />
                <Bar dataKey='value' name='Importance %' radius={[8, 8, 0, 0]}>
                  {CATBOOST_FEATURE_IMPORTANCE.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className='p-5'>
          <SectionHeader
            title='Risk Distribution'
            subtitle='Students grouped by explainable placement probability.'
          />
          <ResponsiveContainer width='100%' height={250}>
            <PieChart>
              <Pie data={pieData} dataKey='value' nameKey='name' innerRadius={62} outerRadius={94} paddingAngle={4}>
                {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<PredictionTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className='grid gap-2'>
            {pieData.map((item) => (
              <div key={item.name} className='flex items-center justify-between rounded-2xl border border-[var(--pf-border)] bg-white/60 px-3 py-2 text-sm dark:bg-white/[0.04]'>
                <span className='inline-flex items-center gap-2 text-[var(--pf-muted)]'>
                  <span className='h-2.5 w-2.5 rounded-full' style={{ background: item.color }} />
                  {item.name}
                </span>
                <span className='font-semibold text-[var(--pf-text)]'>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {selectedPrediction ? (
        <Card className='p-5'>
          <SectionHeader
            title='Prediction Explanation'
            subtitle='Click any student row below to inspect why the model produced that probability.'
          />
          <div className='grid gap-4 lg:grid-cols-[0.8fr_1.2fr]'>
            <div className='rounded-3xl border border-[var(--pf-border)] bg-white/60 p-5 dark:bg-white/[0.035]'>
              <p className='text-sm text-[var(--pf-muted)]'>{selectedPrediction.name}</p>
              <p className='mt-2 text-5xl font-semibold text-[var(--pf-text)]'>{selectedPrediction.probability}%</p>
              <p className='mt-2 text-sm font-semibold text-sky-600 dark:text-sky-200'>{selectedPrediction.category}</p>
              <p className='mt-4 text-sm leading-6 text-[var(--pf-muted)]'>
                Best matched role: <span className='font-semibold text-[var(--pf-text)]'>{selectedPrediction.bestDrive}</span>
              </p>
            </div>
            <div className='grid gap-3 md:grid-cols-2'>
              <div className='rounded-3xl border border-emerald-300/25 bg-emerald-50 p-4 dark:bg-emerald-400/10'>
                <p className='text-sm font-semibold text-emerald-700 dark:text-emerald-100'>Why score increased</p>
                <div className='mt-3 space-y-2'>
                  {(selectedPrediction.positiveFactors?.length ? selectedPrediction.positiveFactors : ['Profile has enough structured data for scoring.']).map((factor) => (
                    <p key={factor} className='text-sm leading-6 text-emerald-800 dark:text-emerald-100'>+ {factor}</p>
                  ))}
                </div>
              </div>
              <div className='rounded-3xl border border-rose-300/25 bg-rose-50 p-4 dark:bg-rose-400/10'>
                <p className='text-sm font-semibold text-rose-700 dark:text-rose-100'>What reduced confidence</p>
                <div className='mt-3 space-y-2'>
                  {(selectedPrediction.negativeFactors?.length ? selectedPrediction.negativeFactors : ['No major blocker found for this row.']).map((factor) => (
                    <p key={factor} className='text-sm leading-6 text-rose-800 dark:text-rose-100'>- {factor}</p>
                  ))}
                </div>
              </div>
              <div className='rounded-3xl border border-sky-300/25 bg-sky-50 p-4 dark:bg-sky-400/10 md:col-span-2'>
                <p className='text-sm font-semibold text-sky-700 dark:text-sky-100'>Recommended next actions</p>
                <div className='mt-3 grid gap-2 md:grid-cols-2'>
                  {(selectedPrediction.suggestions?.length ? selectedPrediction.suggestions : ['Improve ATS keywords and add role-specific project proof.']).map((suggestion) => (
                    <p key={suggestion} className='rounded-2xl bg-white/60 px-3 py-2 text-sm leading-6 text-[var(--pf-text)] dark:bg-white/[0.06]'>{suggestion}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <section className='grid gap-4 xl:grid-cols-3'>
        {[
          {
            icon: BrainCircuit,
            title: 'CatBoost tabular model',
            text: 'CatBoost, originally developed by Yandex, is suited for mixed placement data like branch, CGPA, attendance, backlogs, ATS score, and activity signals.',
          },
          {
            icon: ShieldCheck,
            title: 'Explainable fallback',
            text: 'If Python ML artifacts or the ML API are unavailable, Placify uses visible weighted scoring so the demo never fails during viva.',
          },
          {
            icon: Sparkles,
            title: 'Actionable output',
            text: 'Every prediction includes positive factors, blockers, missing skills, and next actions instead of a black-box score.',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className='p-5'>
              <span className='grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200'>
                <Icon className='h-5 w-5' />
              </span>
              <h2 className='mt-4 text-base font-semibold text-[var(--pf-text)]'>{item.title}</h2>
              <p className='mt-2 text-sm leading-6 text-[var(--pf-muted)]'>{item.text}</p>
            </Card>
          );
        })}
      </section>

      <Card className='p-5'>
        <SectionHeader
          title='Prediction Queue'
          subtitle={`Model used: ${modelInfo?.activeModel || 'rules-fallback-v1'} · CatBoost status: ${modelInfo?.catBoost?.status || 'optional'}`}
        />
        {summary.total ? (
          <DataTable columns={tableColumns} rows={tableRows} emptyText='No prediction rows available.' onRowClick={(row) => setSelectedPredictionId(row.id)} />
        ) : (
          <div className='rounded-3xl border border-dashed border-[var(--pf-border)] bg-white/55 p-8 text-center dark:bg-white/[0.03]'>
            <Info className='mx-auto h-8 w-8 text-sky-500' />
            <h2 className='mt-3 text-base font-semibold text-[var(--pf-text)]'>Import student data to score predictions</h2>
            <p className='mt-1 text-sm text-[var(--pf-muted)]'>Upload CSV/XLSX or paste a public Google Sheet, then return here for placement probability and risk analysis.</p>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
