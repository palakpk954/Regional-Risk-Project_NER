import { useMemo, useState } from 'react';
import { AlertTriangle, Sparkles, UserCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import { usePlacementStore } from '../store/usePlacementStore';

function toneClasses(tone) {
  if (tone === 'success') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (tone === 'warning') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (tone === 'info') return 'bg-sky-50 text-sky-700 border-sky-200';
  if (tone === 'danger') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function toFixedOne(value) {
  return Number(value || 0).toFixed(1);
}

function getStatusTone(status) {
  if (status === 'Selected') return 'success';
  if (status === 'Interview') return 'info';
  return 'warning';
}

function getReadinessBand(student) {
  if (student.status === 'Selected') {
    return {
      label: 'Placed',
      tone: 'success',
      action: 'Keep connected for alumni mentorship and referrals.',
    };
  }

  if (student.status === 'Interview') {
    return {
      label: 'Interview Pipeline',
      tone: 'info',
      action: 'Run mock interviews and confidence coaching this week.',
    };
  }

  if (student.cgpa >= 7.5) {
    return {
      label: 'Interview Ready',
      tone: 'info',
      action: 'Push resume mapping and fast-track to active drives.',
    };
  }

  if (student.cgpa >= 6.5) {
    return {
      label: 'Needs Skill Boost',
      tone: 'warning',
      action: 'Assign aptitude + coding practice sprint for 2 weeks.',
    };
  }

  return {
    label: 'Priority Support',
    tone: 'danger',
    action: 'Create personalized mentor plan and weekly progress check.',
  };
}

function getEligibilityBand(student, controls) {
  const branchInScope = controls.branchFilter === 'All' || controls.branchFilter === student.branch;

  if (!branchInScope) {
    return {
      label: 'Out of planner branch scope',
      tone: 'muted',
    };
  }

  const cgpaGap = Number((controls.cgpaThreshold - student.cgpa).toFixed(1));
  if (cgpaGap <= 0) {
    return {
      label: 'Eligible now',
      tone: 'success',
    };
  }

  return {
    label: `Needs +${cgpaGap} CGPA`,
    tone: 'warning',
  };
}

export default function StudentsPage() {
  const navigate = useNavigate();
  const hasData = usePlacementStore((state) => state.hasData);
  const engine = usePlacementStore((state) => state.engine);
  const simulationControls = usePlacementStore((state) => state.simulationControls);

  const [query, setQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [readinessFilter, setReadinessFilter] = useState('all');

  const branchOptions = useMemo(() => {
    return ['All', ...new Set(engine.records.map((student) => student.branch))];
  }, [engine.records]);

  const studentRows = useMemo(() => {
    return engine.records.map((student) => {
      const readiness = getReadinessBand(student);
      const eligibility = getEligibilityBand(student, simulationControls);
      return {
        ...student,
        readiness,
        eligibility,
      };
    });
  }, [engine.records, simulationControls]);

  const summary = useMemo(() => {
    const readyNow = studentRows.filter((student) => student.eligibility.label === 'Eligible now').length;
    const placed = studentRows.filter((student) => student.status === 'Selected').length;
    const prioritySupport = studentRows.filter((student) => student.readiness.label === 'Priority Support').length;
    const inPipeline = studentRows.filter((student) => student.status === 'Interview').length;

    return {
      total: studentRows.length,
      readyNow,
      placed,
      prioritySupport,
      inPipeline,
    };
  }, [studentRows]);

  const filteredRows = useMemo(() => {
    return studentRows.filter((student) => {
      const text = query.trim().toLowerCase();
      const queryMatch = !text
        || student.name.toLowerCase().includes(text)
        || student.email.toLowerCase().includes(text)
        || student.company.toLowerCase().includes(text);

      const branchMatch = branchFilter === 'All' || student.branch === branchFilter;

      const readinessMatch = readinessFilter === 'all'
        || (readinessFilter === 'placed' && student.readiness.label === 'Placed')
        || (readinessFilter === 'ready' && student.readiness.label === 'Interview Ready')
        || (readinessFilter === 'pipeline' && student.readiness.label === 'Interview Pipeline')
        || (readinessFilter === 'boost' && student.readiness.label === 'Needs Skill Boost')
        || (readinessFilter === 'priority' && student.readiness.label === 'Priority Support');

      return queryMatch && branchMatch && readinessMatch;
    });
  }, [studentRows, query, branchFilter, readinessFilter]);

  const interventionQueue = useMemo(() => engine.atRiskStudents.slice(0, 8), [engine.atRiskStudents]);

  const columns = [
    {
      key: 'name',
      label: 'Student',
      render: (_value, row) => (
        <div>
          <p className='font-semibold text-slate-900'>{row.name}</p>
          <p className='text-xs text-slate-500'>{row.email}</p>
        </div>
      ),
    },
    { key: 'branch', label: 'Branch' },
    {
      key: 'cgpa',
      label: 'CGPA',
      render: (value) => toFixedOne(value),
    },
    {
      key: 'status',
      label: 'Current Status',
      render: (value) => (
        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${toneClasses(getStatusTone(value))}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'readiness',
      label: 'Readiness Band',
      render: (value) => (
        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${toneClasses(value.tone)}`}>
          {value.label}
        </span>
      ),
    },
    {
      key: 'eligibility',
      label: 'Planner Eligibility',
      render: (value) => (
        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${toneClasses(value.tone)}`}>
          {value.label}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Recommended Action',
      render: (_value, row) => row.readiness.action,
    },
  ];

  if (!hasData) {
    return (
      <PageContainer className='space-y-5'>
        <Card className='border-dashed border-slate-300 bg-slate-50'>
          <SectionHeader
            title='No student records available'
            subtitle='Import placement rows from Migration to unlock student workflow and eligibility planning.'
          />
          <Button onClick={() => navigate('/migration')}>Open Migration</Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className='space-y-6'>
      <SectionHeader
        title='Student Success Workflow'
        subtitle='Track readiness, eligibility, and intervention priorities student by student.'
        action={
          <Button variant='secondary' onClick={() => navigate('/simulator')}>
            <Sparkles className='h-4 w-4' />
            Open Outcome Planner
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-5'>
        <Card className='card-hover xl:col-span-1'>
          <p className='text-sm text-slate-500'>Total Students</p>
          <p className='mt-2 text-3xl font-bold text-slate-900'>{summary.total}</p>
        </Card>
        <Card className='card-hover border-emerald-100 bg-emerald-50/70 xl:col-span-1'>
          <p className='text-sm text-emerald-800'>Eligible Now</p>
          <p className='mt-2 text-3xl font-bold text-emerald-700'>{summary.readyNow}</p>
        </Card>
        <Card className='card-hover xl:col-span-1'>
          <p className='text-sm text-slate-500'>In Interview Pipeline</p>
          <p className='mt-2 text-3xl font-bold text-sky-700'>{summary.inPipeline}</p>
        </Card>
        <Card className='card-hover xl:col-span-1'>
          <p className='text-sm text-slate-500'>Placed</p>
          <p className='mt-2 text-3xl font-bold text-indigo-700'>{summary.placed}</p>
        </Card>
        <Card className='card-hover border-rose-100 bg-rose-50/70 xl:col-span-1'>
          <p className='text-sm text-rose-800'>Priority Support</p>
          <p className='mt-2 text-3xl font-bold text-rose-700'>{summary.prioritySupport}</p>
        </Card>
      </div>

      <div className='grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-3'>
        <Input
          placeholder='Search by student, email, or company'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select
          value={branchFilter}
          onChange={(event) => setBranchFilter(event.target.value)}
          className='h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
        >
          {branchOptions.map((branch) => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>

        <select
          value={readinessFilter}
          onChange={(event) => setReadinessFilter(event.target.value)}
          className='h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
        >
          <option value='all'>All Readiness Bands</option>
          <option value='placed'>Placed</option>
          <option value='pipeline'>Interview Pipeline</option>
          <option value='ready'>Interview Ready</option>
          <option value='boost'>Needs Skill Boost</option>
          <option value='priority'>Priority Support</option>
        </select>
      </div>

      <DataTable columns={columns} rows={filteredRows} emptyText='No students match current filters.' />

      <Card className='card-hover border-amber-100 bg-amber-50/60'>
        <SectionHeader
          title='Intervention Queue'
          subtitle='Highest-risk students who should receive mentoring support first.'
        />
        {interventionQueue.length ? (
          <div className='grid gap-2 md:grid-cols-2'>
            {interventionQueue.map((student) => (
              <div key={student.id} className='rounded-xl border border-amber-200 bg-white p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-sm font-semibold text-slate-900'>{student.name}</p>
                  <span className='rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700'>
                    {student.riskScore}% risk
                  </span>
                </div>
                <p className='mt-1 text-xs text-slate-500'>
                  {student.branch} • CGPA {toFixedOne(student.cgpa)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className='rounded-xl border border-emerald-200 bg-white p-3 text-sm text-emerald-700'>
            No high-priority intervention students in current dataset.
          </div>
        )}

        <div className='mt-4 grid gap-2 sm:grid-cols-3'>
          <div className='rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700'>
            <Users className='mb-2 h-4 w-4 text-slate-500' />
            Group students by branch mentors and run weekly check-ins.
          </div>
          <div className='rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700'>
            <UserCheck className='mb-2 h-4 w-4 text-slate-500' />
            Create separate tracks for interview pipeline and skill-boost cohorts.
          </div>
          <div className='rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700'>
            <AlertTriangle className='mb-2 h-4 w-4 text-slate-500' />
            Review planner threshold monthly to avoid excluding improving students.
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
