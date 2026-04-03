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
import { ArrowRight, BadgeCheck, DatabaseBackup, Sparkles, SlidersHorizontal, TrendingUp } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';
import Button from '../components/Button';
import Card from '../components/Card';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import { usePlacementStore } from '../store/usePlacementStore';

const PIE_COLORS = ['#4f46e5', '#2563eb', '#0891b2', '#14b8a6', '#65a30d', '#d97706'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const loading = usePlacementStore((state) => state.loading);
  const hasData = usePlacementStore((state) => state.hasData);
  const engine = usePlacementStore((state) => state.engine);
  const simulation = usePlacementStore((state) => state.simulation);

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
            subtitle='Upload CSV or Google Sheet rows to compute instant placement intelligence offline.'
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
        title='Placify AI Intelligence Dashboard'
        subtitle='Insight-first placement analytics with predictive and simulation-driven decision support.'
        action={
          <div className='flex flex-wrap gap-2'>
            <Button variant='secondary' onClick={() => navigate('/migration')}>
              <DatabaseBackup className='h-4 w-4' />
              Upload New Data
            </Button>
            <Button variant='secondary' onClick={() => navigate('/simulator')}>
              <SlidersHorizontal className='h-4 w-4' />
              Open Simulator
            </Button>
            <Button onClick={() => navigate('/reports')}>
              <Sparkles className='h-4 w-4' />
              Generate Report
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

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2 border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 card-hover'>
          <SectionHeader title='Prediction Card' subtitle='Forward-looking estimate from readiness and trend dynamics' />
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
              <p className='text-xs uppercase tracking-wide text-slate-500'>Trend</p>
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
          <SectionHeader title='Simulation Impact Preview' subtitle='Latest simulator delta' />
          <p className={`text-3xl font-extrabold ${simulation.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {simulation.delta >= 0 ? '+' : ''}
            <AnimatedNumber value={Math.abs(simulation.delta)} decimals={1} suffix='%' />
          </p>
          <p className='mt-2 text-sm text-slate-600'>Projected Rate: {simulation.projectedPlacementRate}%</p>
          <p className='text-sm text-slate-600'>Affected Students: {simulation.studentsAffected}</p>
          <Button className='mt-3 w-full' variant='secondary' onClick={() => navigate('/simulator')}>
            Tune Scenario
          </Button>
        </Card>
      </div>

      <Card className='border-indigo-100 bg-indigo-50/80 card-hover'>
        <SectionHeader title='Top Insight Highlight' subtitle='Most important signal from current engine run' />
        <p className='text-base font-semibold text-indigo-900'>{engine.insights[0]}</p>
        {engine.companyIntelligence.topTechHiringCompany ? (
          <div className='mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs text-emerald-700'>
            <BadgeCheck className='h-3.5 w-3.5' />
            Top Tech Hiring Company: {engine.companyIntelligence.topTechHiringCompany.name}
          </div>
        ) : null}
      </Card>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='card-hover'>
          <SectionHeader title='Company Distribution' subtitle='Selection volume by company' />
          <div className='h-[280px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={engine.companyDistribution}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey='value' fill='#4f46e5' radius={[6, 6, 0, 0]} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className='card-hover'>
          <SectionHeader title='Branch Performance' subtitle='Placed students by branch' />
          <div className='h-[280px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={engine.branchPerformance}
                  dataKey='placed'
                  nameKey='branch'
                  outerRadius={100}
                  innerRadius={55}
                  animationDuration={700}
                >
                  {engine.branchPerformance.map((entry, index) => (
                    <Cell key={entry.branch} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='card-hover'>
          <SectionHeader title='Engine Insights' subtitle='Auto-generated from data model' />
          <div className='space-y-2'>
            {engine.insights.map((line) => (
              <p key={line} className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
                {line}
              </p>
            ))}
          </div>
        </Card>

        <Card className='card-hover'>
          <SectionHeader title='At-Risk Student Cards' subtitle='Priority intervention candidates' />
          <div className='space-y-2'>
            {engine.atRiskStudents.slice(0, 6).map((student) => (
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
    </PageContainer>
  );
}
