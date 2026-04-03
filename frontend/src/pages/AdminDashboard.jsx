import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowRight, BadgeCheck, DatabaseBackup, Download, Sparkles, SlidersHorizontal, TrendingUp } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';
import Button from '../components/Button';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import { summarizePlacementRecords } from '../services/engineService';
import { usePlacementStore } from '../store/usePlacementStore';

const PIE_COLORS = ['#4f46e5', '#2563eb', '#0891b2', '#14b8a6', '#65a30d', '#d97706'];
const STATUS_OPTIONS = ['All', 'Applied', 'Interview', 'Selected'];
function buildAutoInsights(summary) {
  const topCompany = summary.topCompany;
  const bestBranch = summary.topBranch;
  const weakCgpa = [...(summary.cgpaAnalysis || [])]
    .filter((item) => item.total > 0)
    .sort((a, b) => a.rate - b.rate)[0];
  const riskCount = summary.atRiskStudents?.length || 0;

  return [
    topCompany
      ? `${topCompany.name} has the highest student placements in current scope (${topCompany.value} selected).`
      : 'No selected-company trend available in current scope.',
    bestBranch
      ? `${bestBranch.branch} has the highest placement rate in current scope (${bestBranch.rate}%).`
      : 'No branch trend available in current scope.',
    weakCgpa
      ? `Students in CGPA bucket ${weakCgpa.bucket} have the weakest conversion (${weakCgpa.rate}%), so this group needs focused support.`
      : 'No CGPA trend available in current scope.',
    `Students below 7 CGPA currently marked at-risk in active scope: ${riskCount}.`,
  ];
}

function getStatusBadgeClass(status) {
  if (status === 'Selected') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Interview') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function escapeCsvCell(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const loading = usePlacementStore((state) => state.loading);
  const hasData = usePlacementStore((state) => state.hasData);
  const engine = usePlacementStore((state) => state.engine);
  const simulation = usePlacementStore((state) => state.simulation);
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const branchOptions = useMemo(
    () => ['All', ...new Set(engine.records.map((record) => record.branch || 'Unknown'))],
    [engine.records],
  );

  const baseFilteredRecords = useMemo(() => {
    return engine.records.filter((record) => {
      const statusMatch = statusFilter === 'All' || record.status === statusFilter;
      const branchMatch = branchFilter === 'All' || record.branch === branchFilter;
      return statusMatch && branchMatch;
    });
  }, [engine.records, statusFilter, branchFilter]);

  const baseSummary = useMemo(() => summarizePlacementRecords(baseFilteredRecords), [baseFilteredRecords]);
  const companyPieData = baseSummary.companyStats;

  const activeCompanyFilter = useMemo(() => {
    if (selectedCompany === 'All') return 'All';
    return companyPieData.some((item) => item.name === selectedCompany) ? selectedCompany : 'All';
  }, [selectedCompany, companyPieData]);

  const scopedRecords = useMemo(() => {
    if (activeCompanyFilter === 'All') return baseSummary.records;
    return baseSummary.records.filter((record) => record.company === activeCompanyFilter);
  }, [baseSummary.records, activeCompanyFilter]);

  const scopedSummary = useMemo(() => summarizePlacementRecords(scopedRecords), [scopedRecords]);
  const branchBarData = scopedSummary.branchStats;
  const cgpaAnalysisData = scopedSummary.cgpaAnalysis;
  const autoInsights = useMemo(() => buildAutoInsights(scopedSummary), [scopedSummary]);
  const scopedKpis = scopedSummary.kpis;

  const tableRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return scopedSummary.records
      .filter((record) => {
        if (!query) return true;
        return (
          record.name.toLowerCase().includes(query)
          || record.email.toLowerCase().includes(query)
          || record.company.toLowerCase().includes(query)
          || record.branch.toLowerCase().includes(query)
        );
      })
      .map((record, index) => ({
        ...record,
        id: `${record.id}_${index}`,
      }));
  }, [scopedSummary.records, searchQuery]);

  const tableColumns = useMemo(
    () => [
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
        render: (value) => Number(value || 0).toFixed(1),
      },
      { key: 'company', label: 'Company' },
      {
        key: 'status',
        label: 'Status',
        render: (value) => (
          <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(value)}`}>
            {value}
          </span>
        ),
      },
    ],
    [],
  );

  const hasCompanyChartData = companyPieData.length > 0;
  const hasBranchChartData = branchBarData.length > 0;
  const hasCgpaChartData = cgpaAnalysisData.some((item) => item.total > 0);

  const exportFilteredRows = () => {
    if (!tableRows.length) return;

    const headers = ['Name', 'Email', 'Branch', 'CGPA', 'Company', 'Status'];
    const lines = [headers.join(',')];

    tableRows.forEach((row) => {
      lines.push([
        escapeCsvCell(row.name),
        escapeCsvCell(row.email),
        escapeCsvCell(row.branch),
        escapeCsvCell(Number(row.cgpa || 0).toFixed(1)),
        escapeCsvCell(row.company),
        escapeCsvCell(row.status),
      ].join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `placify-filtered-students-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PageContainer className='space-y-5'>
        <Skeleton className='h-20 w-full' />
        <div className='grid gap-4 sm:grid-cols-3'>
          <Skeleton className='h-28 w-full' />
          <Skeleton className='h-28 w-full' />
          <Skeleton className='h-28 w-full' />
        </div>
        <Skeleton className='h-[320px] w-full' />
      </PageContainer>
    );
  }

  if (!hasData) {
    return (
      <PageContainer className='space-y-5'>
        <Card className='border-dashed border-slate-300 bg-gradient-to-br from-indigo-50 via-white to-cyan-50'>
          <SectionHeader
            title='Placify AI is ready'
            subtitle='Upload CSV, Excel, or Google Sheet rows to compute instant placement intelligence offline.'
          />
          <div className='flex flex-wrap items-center gap-3'>
            <Button onClick={() => navigate('/migration')}>
              <DatabaseBackup className='h-4 w-4' />
              Start With Migration
            </Button>
            <Button variant='secondary' onClick={() => navigate('/reports')}>
              <ArrowRight className='h-4 w-4' />
              Open Reports View
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className='space-y-8'>
      <SectionHeader
        title='Placement Success Dashboard'
        subtitle='Student-first placement analytics for faculty and training teams.'
        action={
          <div className='flex flex-wrap gap-2'>
            <Button variant='secondary' onClick={() => navigate('/students')}>
              <ArrowRight className='h-4 w-4' />
              Open Student Workflow
            </Button>
            <Button variant='secondary' onClick={() => navigate('/migration')}>
              <DatabaseBackup className='h-4 w-4' />
              Upload New Data
            </Button>
            <Button variant='secondary' onClick={() => navigate('/simulator')}>
              <SlidersHorizontal className='h-4 w-4' />
              Open Outcome Planner
            </Button>
            <Button onClick={() => navigate('/reports')}>
              <Sparkles className='h-4 w-4' />
              Generate Summary Report
            </Button>
          </div>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md card-hover'>
          <p className='text-sm text-indigo-100'>Total Students</p>
          <AnimatedNumber value={engine.kpis.totalStudents} className='mt-2 block text-4xl font-extrabold' />
        </Card>
        <Card className='card-hover'>
          <p className='text-sm text-slate-500'>Placed Students</p>
          <AnimatedNumber value={engine.kpis.placedStudents} className='mt-2 block text-4xl font-extrabold text-emerald-700' />
        </Card>
        <Card className='card-hover'>
          <p className='text-sm text-slate-500'>Placement Rate</p>
          <AnimatedNumber value={engine.kpis.placementRate} decimals={1} suffix='%' className='mt-2 block text-4xl font-extrabold text-slate-900' />
        </Card>
        <Card className='card-hover border-emerald-100 bg-emerald-50/70'>
          <p className='text-sm text-emerald-800'>Top Tech Companies Auto-Detected</p>
          <AnimatedNumber
            value={engine.companyIntelligence.detectedTopTechCompanies}
            className='mt-2 block text-4xl font-extrabold text-emerald-700'
          />
          <p className='mt-1 text-xs text-emerald-800'>
            {engine.companyIntelligence.totalDistinctCompanies} imported • {engine.companyIntelligence.catalogSize}+ indexed
          </p>
        </Card>
      </div>

      <Card className='card-hover border-indigo-100 bg-indigo-50/60'>
        <SectionHeader
          title='Interactive Filters'
          subtitle='Company click, status, and branch filters update charts and student table instantly.'
        />

        <div className='grid gap-3 lg:grid-cols-4'>
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder='Search student, email, company, branch'
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className='h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
            className='h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
          >
            {branchOptions.map((branch) => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>

          <div className='flex items-center gap-2'>
            <div className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700'>
              Company: <span className='font-semibold'>{activeCompanyFilter}</span>
            </div>
            <Button size='sm' variant='secondary' onClick={() => setSelectedCompany('All')}>
              Clear
            </Button>
          </div>
        </div>

        <div className='mt-3 grid gap-3 sm:grid-cols-3'>
          <div className='rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700'>
            Active Students: <span className='font-semibold'>{scopedKpis.totalStudents}</span>
          </div>
          <div className='rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700'>
            Active Placed: <span className='font-semibold'>{scopedKpis.placedStudents}</span>
          </div>
          <div className='rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700'>
            Active Placement Rate: <span className='font-semibold'>{scopedKpis.placementRate}%</span>
          </div>
        </div>
      </Card>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2 border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 card-hover'>
          <SectionHeader title='Student Readiness Snapshot' subtitle='Forward-looking estimate for next placement cycle' />
          <div className='grid gap-3 sm:grid-cols-3'>
            <div className='rounded-xl border border-indigo-100 bg-white p-4'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Forecasted Rate</p>
              <AnimatedNumber value={engine.prediction.predictedPlacementRate} decimals={1} suffix='%' className='mt-2 block text-2xl font-bold text-indigo-700' />
            </div>
            <div className='rounded-xl border border-indigo-100 bg-white p-4'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Readiness Score</p>
              <AnimatedNumber value={engine.prediction.readinessScore} decimals={1} className='mt-2 block text-2xl font-bold text-slate-900' />
            </div>
            <div className='rounded-xl border border-indigo-100 bg-white p-4'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Cycle Momentum</p>
              <p className='mt-2 inline-flex items-center gap-1 text-lg font-semibold text-emerald-700'>
                <TrendingUp className='h-4 w-4' />
                {engine.prediction.trend}
              </p>
            </div>
          </div>

          <div className='mt-3 rounded-xl border border-indigo-100 bg-white p-3 text-sm text-slate-700'>
            Auto-detected tech hiring share: {engine.companyIntelligence.techSelectionRate}% ({engine.companyIntelligence.techSelections} of {engine.kpis.placedStudents} selected students)
          </div>
        </Card>

        <Card className='card-hover'>
          <SectionHeader title='Scenario Support Preview' subtitle='Latest what-if impact on student outcomes' />
          <p className={`text-3xl font-extrabold ${simulation.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {simulation.delta >= 0 ? '+' : ''}
            <AnimatedNumber value={Math.abs(simulation.delta)} decimals={1} suffix='%' />
          </p>
          <p className='mt-2 text-sm text-slate-600'>Projected Rate: {simulation.projectedPlacementRate}%</p>
          <p className='text-sm text-slate-600'>Affected Students: {simulation.studentsAffected}</p>
          <Button className='mt-3 w-full' variant='secondary' onClick={() => navigate('/simulator')}>
            Adjust Plan
          </Button>
        </Card>
      </div>

      <Card className='border-indigo-100 bg-indigo-50/80 card-hover'>
        <SectionHeader title='Key Student Outcome Highlight' subtitle='Most important pattern from current analysis' />
        <p className='text-base font-semibold text-indigo-900'>{autoInsights[0]}</p>
        {engine.companyIntelligence.topTechHiringCompany ? (
          <div className='mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs text-emerald-700'>
            <BadgeCheck className='h-3.5 w-3.5' />
            Top Tech Hiring Company: {engine.companyIntelligence.topTechHiringCompany.name}
          </div>
        ) : null}
      </Card>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='card-hover'>
          <SectionHeader title='Company Pie Chart' subtitle='Click a slice to filter table and charts' />
          <div className='h-[280px]'>
            {hasCompanyChartData ? (
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={companyPieData}
                    dataKey='value'
                    nameKey='name'
                    outerRadius={100}
                    innerRadius={55}
                    animationDuration={700}
                    onClick={(entry) => {
                      const name = entry?.name || entry?.payload?.name;
                      if (name) setSelectedCompany(name);
                    }}
                  >
                    {companyPieData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        opacity={activeCompanyFilter === 'All' || activeCompanyFilter === entry.name ? 1 : 0.3}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} selected`, 'Students']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500'>
                No company chart data for current filters.
              </div>
            )}
          </div>
        </Card>

        <Card className='card-hover'>
          <SectionHeader title='Branch Bar Chart' subtitle='Placement rate by branch (active scope)' />
          <div className='h-[280px]'>
            {hasBranchChartData ? (
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={branchBarData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='branch' />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='rate' fill='#2563eb' radius={[6, 6, 0, 0]} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500'>
                No branch chart data for current filters.
              </div>
            )}
          </div>
        </Card>

        <Card className='card-hover'>
          <SectionHeader title='CGPA Analysis' subtitle='Placement conversion by CGPA group' />
          <div className='h-[280px]'>
            {hasCgpaChartData ? (
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={cgpaAnalysisData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='bucket' />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='rate' fill='#0ea5e9' radius={[6, 6, 0, 0]} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500'>
                No CGPA analysis data for current filters.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='card-hover'>
          <SectionHeader title='Automatic Insights' subtitle='Top company, best branch, and weak CGPA group' />
          <div className='space-y-2'>
            {autoInsights.map((line) => (
              <p key={line} className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
                {line}
              </p>
            ))}
          </div>
        </Card>

        <Card className='card-hover'>
          <SectionHeader title='At-Risk Student Cards' subtitle='Priority intervention candidates' />
          <div className='space-y-2'>
            {scopedSummary.atRiskStudents.slice(0, 6).map((student) => (
              <div key={student.id} className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-semibold text-slate-900'>{student.name}</p>
                  <p className={`text-xs font-semibold ${student.riskScore >= 60 ? 'text-rose-700' : 'text-amber-700'}`}>
                    {student.riskScore}% risk
                  </p>
                </div>
                <p className='mt-1 text-xs text-slate-500'>{student.branch} • CGPA {student.cgpa}</p>
                <div className='mt-2 h-2 overflow-hidden rounded-full bg-slate-200'>
                  <div
                    style={{ width: `${student.riskScore}%` }}
                    className={`h-full rounded-full ${student.riskScore >= 60 ? 'bg-rose-500' : 'bg-amber-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className='card-hover'>
        <SectionHeader
          title='Student Placement Table'
          subtitle='Filterable student list aligned with active chart filters'
          action={
            <Button size='sm' variant='secondary' onClick={exportFilteredRows} disabled={!tableRows.length}>
              <Download className='h-4 w-4' />
              Export Filtered CSV
            </Button>
          }
        />
        <p className='mb-3 text-xs text-slate-500'>Showing {Math.min(tableRows.length, 250)} of {tableRows.length} students in active scope.</p>
        <DataTable columns={tableColumns} rows={tableRows.slice(0, 250)} emptyText='No students match current filters.' />
      </Card>
    </PageContainer>
  );
}
