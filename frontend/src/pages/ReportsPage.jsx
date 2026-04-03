import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileText, Sparkles, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AiReportModal from '../components/AiReportModal';
import Button from '../components/Button';
import Card from '../components/Card';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import { generateReportAiInsights } from '../services/engineService';
import { downloadTextReport, generateSummaryText } from '../services/reportService';
import { usePlacementStore } from '../store/usePlacementStore';

export default function ReportsPage() {
  const navigate = useNavigate();
  const engine = usePlacementStore((state) => state.engine);
  const simulation = usePlacementStore((state) => state.simulation);
  const hasData = usePlacementStore((state) => state.hasData);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const companyStats = engine.companyStats || engine.companyDistribution || [];
  const branchStats = engine.branchStats || engine.branchPerformance || [];
  const cgpaAnalysis = engine.cgpaAnalysis || engine.cgpaCorrelation || [];

  const summaryText = useMemo(() => generateSummaryText(engine, simulation), [engine, simulation]);
  const aiInsights = useMemo(() => generateReportAiInsights(engine, simulation), [engine, simulation]);

  const handleDownload = () => {
    const filename = `placement-intelligence-report-${new Date().toISOString().slice(0, 10)}.txt`;
    downloadTextReport(filename, summaryText);
  };

  if (!hasData) {
    return (
      <PageContainer className='space-y-5'>
        <Card className='border-dashed border-slate-300 bg-slate-50'>
          <SectionHeader
            title='No report data yet'
            subtitle='Import CSV or sheet rows first. Report output appears instantly after engine processing.'
          />
          <Button onClick={() => navigate('/migration')}>
            <UploadCloud className='h-4 w-4' />
            Go To Input Layer
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className='space-y-8'>
      <SectionHeader
        title='Output Layer - Intelligence Report'
        subtitle='Outcome narrative generated from offline placement analysis results.'
        action={
          <div className='flex flex-wrap gap-2'>
            <Button variant='secondary' onClick={() => setAiModalOpen(true)}>
              <Sparkles className='h-4 w-4' />
              Open AI Report Studio
            </Button>
            <Button onClick={handleDownload}>
              <Download className='h-4 w-4' />
              Download Summary
            </Button>
          </div>
        }
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <Card className='card-hover'>
          <p className='text-sm text-slate-500'>Total Students</p>
          <p className='mt-2 text-3xl font-bold text-slate-900'>{engine.kpis.totalStudents}</p>
        </Card>
        <Card className='card-hover'>
          <p className='text-sm text-slate-500'>Placed Students</p>
          <p className='mt-2 text-3xl font-bold text-emerald-700'>{engine.kpis.placedStudents}</p>
        </Card>
        <Card className='card-hover'>
          <p className='text-sm text-slate-500'>Placement Percentage</p>
          <p className='mt-2 text-3xl font-bold text-indigo-700'>{engine.kpis.placementRate}%</p>
        </Card>
      </div>

      <Card className='card-hover border-emerald-100 bg-emerald-50/60'>
        <SectionHeader title='Auto Company Intelligence' subtitle='Real-time detection of top tech companies from imported dataset' />
        <div className='grid gap-3 sm:grid-cols-4'>
          <div className='rounded-xl border border-emerald-100 bg-white p-3'>
            <p className='text-xs uppercase tracking-wide text-slate-500'>Catalog Size</p>
            <p className='mt-1 text-2xl font-bold text-emerald-700'>{engine.companyIntelligence.catalogSize}+</p>
          </div>
          <div className='rounded-xl border border-emerald-100 bg-white p-3'>
            <p className='text-xs uppercase tracking-wide text-slate-500'>Detected Top Tech</p>
            <p className='mt-1 text-2xl font-bold text-emerald-700'>{engine.companyIntelligence.detectedTopTechCompanies}</p>
          </div>
          <div className='rounded-xl border border-emerald-100 bg-white p-3'>
            <p className='text-xs uppercase tracking-wide text-slate-500'>Detection Rate</p>
            <p className='mt-1 text-2xl font-bold text-emerald-700'>{engine.companyIntelligence.detectionRate}%</p>
          </div>
          <div className='rounded-xl border border-emerald-100 bg-white p-3'>
            <p className='text-xs uppercase tracking-wide text-slate-500'>Tech Selection Share</p>
            <p className='mt-1 text-2xl font-bold text-emerald-700'>{engine.companyIntelligence.techSelectionRate}%</p>
          </div>
        </div>

        {engine.companyIntelligence.topDetectedCompanies.length ? (
          <div className='mt-3 flex flex-wrap gap-2'>
            {engine.companyIntelligence.topDetectedCompanies.slice(0, 8).map((company) => (
              <span key={company.normalizedName} className='rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs text-emerald-700'>
                {company.companyName}
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      <div className='grid gap-4 sm:grid-cols-3'>
        <Card className='card-hover'>
          <p className='text-sm text-slate-500'>Simulation Baseline</p>
          <p className='mt-2 text-3xl font-bold text-slate-900'>{simulation.baselineRate}%</p>
        </Card>
        <Card className='card-hover'>
          <p className='text-sm text-slate-500'>Simulation Projected</p>
          <p className='mt-2 text-3xl font-bold text-indigo-700'>{simulation.projectedPlacementRate}%</p>
        </Card>
        <Card className='card-hover'>
          <p className='text-sm text-slate-500'>Expected Improvement</p>
          <p className={`mt-2 text-3xl font-bold ${simulation.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {simulation.delta >= 0 ? '+' : ''}{simulation.delta}%
          </p>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='card-hover'>
          <SectionHeader title='Branch Performance Rate' subtitle='Placement percentage by branch' />
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={branchStats}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='branch' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='rate' fill='#0ea5e9' radius={[6, 6, 0, 0]} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className='card-hover'>
          <SectionHeader title='CGPA vs Placement Correlation' subtitle='Rate distribution by CGPA bucket' />
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={cgpaAnalysis}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='bucket' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='rate' fill='#6366f1' radius={[6, 6, 0, 0]} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className='card-hover'>
        <SectionHeader title='Insight Statements' subtitle='Auto-generated explanations from analytical engine outputs' />
        <div className='space-y-2'>
          {engine.insights.map((insight) => (
            <div key={insight} className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
              {insight}
            </div>
          ))}
        </div>
      </Card>

      <Card className='card-hover'>
        <SectionHeader title='Simulation Insights' subtitle='Latest scenario impact included in final report output' />
        <div className='space-y-2'>
          {simulation.insights.map((insight) => (
            <div key={insight} className='rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900'>
              {insight}
            </div>
          ))}
        </div>
      </Card>

      <Card className='card-hover'>
        <SectionHeader title='AI Copilot Insights' subtitle='Rule-based AI reasoning packaged for decision makers' />
        <div className='grid gap-3 md:grid-cols-3'>
          {aiInsights.map((item, index) => (
            <div key={`ai_${index}`} className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
              <p className='text-xs font-semibold uppercase tracking-wide text-indigo-600'>Insight</p>
              <p className='mt-1 text-sm text-slate-800'>{item.insight}</p>
              <p className='mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>Reason</p>
              <p className='mt-1 text-xs text-slate-600'>{item.reason}</p>
              <p className='mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>Suggestion</p>
              <p className='mt-1 text-xs text-slate-600'>{item.suggestion}</p>
            </div>
          ))}
        </div>
      </Card>

      {companyStats.length === 0 ? (
        <Card className='card-hover border-dashed border-slate-300 bg-slate-50'>
          <SectionHeader title='No Company Distribution Yet' subtitle='Import data with selected students to unlock company-level report insights.' />
        </Card>
      ) : null}

      <Card className='card-hover'>
        <SectionHeader
          title='Summary Preview'
          subtitle='This exact text is exported when you click Download Summary.'
          action={<FileText className='h-4 w-4 text-slate-500' />}
        />
        <pre className='max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700'>
          {summaryText}
        </pre>
      </Card>

      <AiReportModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        summary={summaryText}
      />
    </PageContainer>
  );
}
