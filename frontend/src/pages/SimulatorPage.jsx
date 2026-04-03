import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Bot, Sparkles } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import { generateCopilotReply } from '../services/engineService';
import { usePlacementStore } from '../store/usePlacementStore';

export default function SimulatorPage() {
  const hasData = usePlacementStore((state) => state.hasData);
  const engine = usePlacementStore((state) => state.engine);
  const simulation = usePlacementStore((state) => state.simulation);
  const simulationControls = usePlacementStore((state) => state.simulationControls);
  const availableBranches = usePlacementStore((state) => state.availableBranches);
  const updateSimulationControl = usePlacementStore((state) => state.updateSimulationControl);
  const applySimulationPreset = usePlacementStore((state) => state.applySimulationPreset);

  const [activePreset, setActivePreset] = useState('Custom');
  const [question, setQuestion] = useState('');
  const defaultAnswer = useMemo(
    () => generateCopilotReply('How can we improve next cycle?', engine, simulation),
    [engine, simulation],
  );
  const [answer, setAnswer] = useState(defaultAnswer);
  const branchStats = useMemo(
    () => engine.branchStats || engine.branchPerformance || [],
    [engine.branchStats, engine.branchPerformance],
  );

  const weakestBranch = useMemo(
    () => branchStats[branchStats.length - 1]?.branch || 'All',
    [branchStats],
  );

  const presets = useMemo(() => {
    const topBranch = engine.topBranch?.branch || 'All';
    return [
      {
        name: 'Conservative',
        values: { cgpaThreshold: 8.1, branchFilter: topBranch },
        subtitle: 'High quality candidates, focused branch',
      },
      {
        name: 'Balanced',
        values: { cgpaThreshold: 7.2, branchFilter: 'All' },
        subtitle: 'Moderate threshold with broad intake',
      },
      {
        name: 'Aggressive',
        values: { cgpaThreshold: 6.4, branchFilter: weakestBranch },
        subtitle: 'Push opportunity expansion for weak branch',
      },
    ];
  }, [engine.topBranch?.branch, weakestBranch]);

  const askCopilot = () => {
    const prompt = question.trim();
    if (!prompt) {
      setAnswer(defaultAnswer);
      return;
    }

    setAnswer(generateCopilotReply(prompt, engine, simulation));
  };

  const visibleAnswer = question.trim() ? answer : defaultAnswer;

  const applyPreset = (preset) => {
    applySimulationPreset(preset.values);
    setActivePreset(preset.name);
  };

  if (!hasData) {
    return (
      <PageContainer>
        <Card className='border-dashed border-slate-300 bg-slate-50'>
          <SectionHeader
            title='Simulator needs data'
            subtitle='Import data from the migration page first, then return to run what-if scenarios.'
          />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className='space-y-8'>
      <SectionHeader
        title='Student Outcome Planner'
        subtitle='Tune support controls and review expected placement outcomes instantly.'
      />

      <div className='grid gap-5 lg:grid-cols-5'>
        <Card className='lg:col-span-2 card-hover'>
          <SectionHeader title='Planning Controls' subtitle='Set threshold and branch scope for this what-if run.' />

          <div className='mb-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-1'>
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                  activePreset === preset.name
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/60'
                }`}
              >
                <p className='font-semibold'>{preset.name}</p>
                <p className='text-xs text-slate-500'>{preset.subtitle}</p>
              </button>
            ))}
          </div>

          <div className='space-y-6'>
            <div>
              <div className='mb-2 flex items-center justify-between text-sm text-slate-600'>
                <span>CGPA Threshold</span>
                <span className='font-semibold text-slate-900'>{simulationControls.cgpaThreshold}</span>
              </div>
              <input
                type='range'
                min='5.5'
                max='9.5'
                step='0.1'
                value={simulationControls.cgpaThreshold}
                onChange={(event) => {
                  updateSimulationControl('cgpaThreshold', Number(event.target.value));
                  setActivePreset('Custom');
                }}
                className='w-full accent-indigo-600'
              />
            </div>

            <div>
              <label className='mb-2 block text-sm text-slate-600'>Branch</label>
              <select
                value={simulationControls.branchFilter}
                onChange={(event) => {
                  updateSimulationControl('branchFilter', event.target.value);
                  setActivePreset('Custom');
                }}
                className='h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
              >
                {availableBranches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card className='lg:col-span-3 bg-gradient-to-br from-white to-indigo-50/60 card-hover'>
          <SectionHeader title='Planner Output' subtitle='Projected outcomes recomputed on every control change.' />

          <div className='grid gap-3 sm:grid-cols-3'>
            <div className='rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Projected Placement Rate</p>
              <AnimatedNumber
                value={simulation.projectedPlacementRate}
                decimals={1}
                suffix='%'
                className='mt-2 block text-3xl font-bold text-indigo-700'
              />
            </div>
            <div className='rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Students Affected</p>
              <AnimatedNumber
                value={simulation.studentsAffected}
                className='mt-2 block text-3xl font-bold text-slate-900'
              />
            </div>
            <div
              className={`rounded-xl border p-4 transition-all hover:-translate-y-0.5 ${
                simulation.delta >= 0 ? 'border-emerald-200 bg-emerald-50/80' : 'border-rose-200 bg-rose-50/80'
              }`}
            >
              <p className='text-xs uppercase tracking-wide text-slate-500'>Expected Change vs Current Cycle</p>
              <p className={`mt-2 inline-flex items-center gap-1 text-3xl font-bold ${simulation.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {simulation.delta >= 0 ? <ArrowUpRight className='h-5 w-5' /> : <ArrowDownRight className='h-5 w-5' />}
                <AnimatedNumber
                  value={Math.abs(simulation.delta)}
                  decimals={1}
                  prefix={simulation.delta >= 0 ? '+' : '-'}
                  suffix='%'
                />
              </p>
            </div>
          </div>

          <div className='mt-4 rounded-xl border border-indigo-100 bg-white p-3 text-sm text-slate-600'>
            Baseline is {simulation.baselineRate}% for {simulation.controls.branchFilter} and overall campus baseline is {simulation.globalBaselineRate}%.
          </div>

          <div className='mt-4 space-y-2'>
            {simulation.insights.map((line) => (
              <p key={line} className='rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-sm text-indigo-900'>
                <ArrowUpRight className='mr-2 inline h-4 w-4' />
                {line}
              </p>
            ))}
          </div>
        </Card>
      </div>

      <Card className='card-hover'>
        <SectionHeader
          title='Offline Placement Copilot'
          subtitle='Rule-based copilot explains insight, reason, and next action clearly.'
          action={<Bot className='h-4 w-4 text-indigo-600' />}
        />

        <div className='flex flex-col gap-3 md:flex-row'>
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder='Type your question...'
          />
          <Button onClick={askCopilot}>
            <Sparkles className='h-4 w-4' />
            Ask Copilot
          </Button>
        </div>

        <div className='mt-5 grid gap-3 md:grid-cols-3'>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Insight</p>
            <p className='mt-2 text-sm text-slate-700'>{visibleAnswer.insight}</p>
          </div>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Reason</p>
            <p className='mt-2 text-sm text-slate-700'>{visibleAnswer.reason}</p>
          </div>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Suggestion</p>
            <p className='mt-2 text-sm text-slate-700'>{visibleAnswer.suggestion}</p>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
