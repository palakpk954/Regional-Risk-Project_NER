import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Bell, Bookmark, BrainCircuit, CalendarClock, Code2, Gauge, MapPin, MessagesSquare, Sparkles, Target, TrendingUp, Trophy, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import { STUDENT_TRACK_STAGES } from '../lib/utils';
import { buildUnifiedReadiness } from '../services/readinessIntelligenceService';
import { usePlacementStore } from '../store/usePlacementStore';

function toList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || '')
    .split(/[,;/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const currentStudentId = usePlacementStore((state) => state.currentStudentId);
  const students = usePlacementStore((state) => state.students);
  const companies = usePlacementStore((state) => state.companies);
  const applicationViews = usePlacementStore((state) => state.applicationViews);
  const applyToCompany = usePlacementStore((state) => state.applyToCompany);
  const [applyMessage, setApplyMessage] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [matchFilter, setMatchFilter] = useState('All');
  const [savedOpenings, setSavedOpenings] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('placify-saved-openings') || '[]'));
    } catch {
      return new Set();
    }
  });
  const messageTimerRef = useRef(null);

  const currentStudent = students.find((student) => student.id === currentStudentId);

  const myApplications = useMemo(
    () => applicationViews.filter((application) => application.studentId === currentStudentId),
    [applicationViews, currentStudentId],
  );

  const ongoingDrives = useMemo(() => {
    if (!currentStudent) return [];
    return companies
      .filter((company) => !['closed', 'archived', 'draft'].includes(String(company.status || 'Open').toLowerCase()))
      .map((company) => {
      const branches = company.eligibleBranches?.length ? company.eligibleBranches : toList(company.branch || 'All');
      const normalizedBranches = branches.map((value) => value.toLowerCase());
      const studentBranch = String(currentStudent.branch || '').toLowerCase();
      const branchMatch = normalizedBranches.includes('all') || normalizedBranches.includes(studentBranch);
      const cgpaMatch = currentStudent.cgpa >= Number(company.eligibility ?? company.minCgpa ?? 0);
      const attendanceMatch = Number(currentStudent.attendance ?? 100) >= Number(company.minAttendance ?? 0);
      const backlogMatch = Number(currentStudent.activeBacklogs ?? 0) <= Number(company.maxBacklogs ?? 99);
      const hasApplied = myApplications.some((application) => application.companyId === company.id);
      return {
        ...company,
        branch: branches.join(', ') || 'All',
        eligible: branchMatch && cgpaMatch && attendanceMatch && backlogMatch,
        hasApplied,
        applicantsCount: applicationViews.filter((application) => application.companyId === company.id).length,
        eligibilityBlockers: [
          branchMatch ? null : 'Branch not eligible',
          cgpaMatch ? null : `CGPA below ${company.eligibility ?? company.minCgpa}`,
          attendanceMatch ? null : `Attendance below ${company.minAttendance}%`,
          backlogMatch ? null : `Backlogs above ${company.maxBacklogs}`,
        ].filter(Boolean),
      };
    });
  }, [applicationViews, companies, currentStudent, myApplications]);

  const highlightedApplication = myApplications[0];
  const statusToStepIndex = {
    Applied: 0,
    Shortlisted: 1,
    Interview: 1,
    Selected: 3,
    Rejected: 0,
  };
  const currentStepIndex = statusToStepIndex[highlightedApplication?.status] ?? 0;

  const intelligence = useMemo(
    () => currentStudent
      ? buildUnifiedReadiness({
        student: currentStudent,
        drives: ongoingDrives,
        applications: myApplications,
        peers: students,
      })
      : null,
    [currentStudent, myApplications, ongoingDrives, students],
  );
  const eligibleCompanies = ongoingDrives.filter((drive) => drive.eligible);
  const ineligibleCompanies = ongoingDrives.filter((drive) => !drive.eligible);
  const risk = intelligence?.risk || { level: 'Low Risk', factors: [], bestMatch: 0, bestReadiness: 0 };
  const matchedDrives = intelligence?.matches || [];
  const visibleMatchedDrives = matchedDrives.filter((drive) => {
    const haystack = `${drive.name} ${drive.role} ${drive.location} ${(drive.requiredSkills || []).join(' ')}`.toLowerCase();
    const queryMatch = !query || haystack.includes(query.toLowerCase());
    const typeMatch = typeFilter === 'All' || (drive.driveType || 'Placement') === typeFilter;
    const matchOk = matchFilter === 'All' ||
      (matchFilter === 'Strong' && drive.match.matchScore >= 75) ||
      (matchFilter === 'Eligible' && drive.eligible) ||
      (matchFilter === 'Saved' && savedOpenings.has(drive.id));
    return queryMatch && typeMatch && matchOk;
  });
  const bestMatch = matchedDrives[0]?.match;
  const readinessScore = intelligence?.readinessScore || bestMatch?.readinessScore || 0;
  const topSuggestions = intelligence?.recommendations?.slice(0, 4) || [];
  const radarMetrics = useMemo(() => {
    const profileSignals = intelligence?.profileSignals || {};
    return [
      { label: 'Coding', value: profileSignals.coding?.score || currentStudent?.dsaScore || 48 },
      { label: 'ATS', value: currentStudent?.atsScore || intelligence?.resumeStrength || 0 },
      { label: 'Projects', value: Math.min(96, 42 + Number(currentStudent?.projects || currentStudent?.no_of_projects || 0) * 14) },
      { label: 'Interview', value: currentStudent?.communicationScore || bestMatch?.confidence || 62 },
      { label: 'Visibility', value: Math.round(((profileSignals.github?.score || 0) + (profileSignals.linkedin?.score || 0)) / 2) || 45 },
      { label: 'Role Fit', value: bestMatch?.matchScore || 0 },
    ];
  }, [bestMatch, currentStudent, intelligence]);
  const careerMomentum = useMemo(() => {
    const activity = Math.min(100, myApplications.length * 18 + savedOpenings.size * 8 + Number(currentStudent?.profileCompletion || 0) * 0.28);
    const proof = Math.round(((intelligence?.profileSignals?.github?.score || 0) + (intelligence?.profileSignals?.coding?.score || 0) + (currentStudent?.atsScore || 0)) / 3);
    const practice = Math.max(currentStudent?.communicationScore || 0, bestMatch?.confidence || 0);
    const score = Math.max(0, Math.min(100, Math.round(activity * 0.34 + proof * 0.42 + practice * 0.24)));
    return {
      score,
      direction: score >= 72 ? 'Accelerating' : score >= 52 ? 'Building' : 'Needs movement',
      signals: [
        score >= 72 ? 'You are becoming more recruiter-visible this month.' : 'One visible project update can lift recruiter visibility.',
        proof >= 68 ? 'Your proof layer is improving through resume and coding signals.' : 'GitHub, ATS, and coding proof are still underpowered.',
        practice >= 70 ? 'Interview confidence is trending in a healthy range.' : 'A mock interview session would improve confidence signals.',
      ],
    };
  }, [bestMatch, currentStudent, intelligence, myApplications.length, savedOpenings.size]);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  const handleApply = (companyId) => {
    const result = applyToCompany(companyId);
    setApplyMessage(result?.ok ? 'Application submitted successfully.' : result?.error || 'Unable to apply.');
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setApplyMessage(''), 2200);
  };

  const toggleSaved = (companyId) => {
    setSavedOpenings((current) => {
      const next = new Set(current);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      localStorage.setItem('placify-saved-openings', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  if (!currentStudent) {
    return (
      <PageContainer>
        <Card>
          <SectionHeader title='Student Workspace' subtitle='No active student session was found.' />
          <p className='text-sm text-slate-600'>Sign in again as a student to access personalized company and application data.</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className='space-y-6'>
      <section className='overflow-hidden rounded-[32px] border border-[var(--pf-border)] bg-[var(--pf-surface)] shadow-[var(--pf-shadow)] backdrop-blur-xl'>
        <div className='grid gap-6 p-5 lg:grid-cols-[1.15fr_0.85fr] lg:p-7'>
          <div>
            <span className='inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-teal-300/20 dark:bg-teal-300/10 dark:text-teal-100'>
              <Sparkles className='h-3.5 w-3.5' />
              Your AI placement coach
            </span>
            <h1 className='mt-4 text-3xl font-semibold tracking-tight text-[var(--pf-text)] md:text-5xl'>
              Hi {currentStudent?.name || 'Student'}, let’s improve your next shortlist.
            </h1>
            <p className='mt-3 max-w-2xl text-sm leading-6 text-[var(--pf-muted)]'>
              Placify AI compares your profile with active roles, explains why scores change, and turns weak signals into weekly actions.
            </p>
            <div className='mt-5 flex flex-wrap gap-2'>
              <Button onClick={() => navigate('/student/profile')}>
                <User className='h-4 w-4' />
                Update Profile
              </Button>
              <Button variant='secondary' onClick={() => navigate('/student/mock-interview')}>
                <MessagesSquare className='h-4 w-4' />
                Practice Interview
              </Button>
              <Button variant='secondary' onClick={() => navigate('/student/opportunities')}>
                <Target className='h-4 w-4' />
                View Opportunities
              </Button>
            </div>
          </div>

          <div className='rounded-3xl border border-[var(--pf-border)] bg-white/65 p-5 dark:bg-white/[0.045]'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]'>Placement readiness</p>
                <p className='mt-2 text-5xl font-bold text-[var(--pf-text)]'>{readinessScore}%</p>
              </div>
              <div className='relative grid h-28 w-28 place-items-center rounded-full border border-sky-200 bg-sky-50 dark:border-teal-300/30 dark:bg-teal-300/10'>
                <Gauge className='h-10 w-10 text-sky-600 dark:text-teal-100' />
              </div>
            </div>
            <div className='mt-5 grid grid-cols-3 gap-2'>
              <PulseMetric label='Shortlist' value={`${bestMatch?.shortlistedProbability || 0}%`} />
              <PulseMetric label='Placement' value={`${bestMatch?.placementProbability || 0}%`} />
              <PulseMetric label='Confidence' value={`${bestMatch?.confidence || 0}%`} />
            </div>
          </div>
        </div>
      </section>

      <div className='pf-stagger grid gap-4 md:grid-cols-4'>
        <StatCard label='Applications' value={myApplications.length} helper='Total submitted forms' icon={<Activity className='h-4 w-4' />} />
        <StatCard label='Active Roles' value={ongoingDrives.length} helper='Open opportunities this cycle' icon={<Target className='h-4 w-4' />} />
        <StatCard label='Best Match' value={`${bestMatch?.matchScore || risk.bestMatch}%`} helper={bestMatch?.job?.companyName || 'No active role'} icon={<TrendingUp className='h-4 w-4' />} />
        <StatCard label='Risk Level' value={risk.level} helper={risk.factors.slice(0, 2).join(', ')} icon={<Gauge className='h-4 w-4' />} />
      </div>

      <section className='grid gap-4 xl:grid-cols-[0.95fr_1.05fr]'>
        <Card className='pf-live-card pf-market-grid'>
          <SectionHeader title='Placement Radar' subtitle='A live profile map across coding, ATS, projects, interview, visibility, and role fit.' />
          <PlacementRadar metrics={radarMetrics} />
        </Card>

        <Card className='pf-live-card'>
          <SectionHeader title='Career Momentum' subtitle='Signals that show whether your profile is improving or stagnating.' />
          <div className='grid gap-4 md:grid-cols-[190px_1fr]'>
            <div className='rounded-3xl border border-[var(--pf-border)] bg-white/50 p-4 dark:bg-white/[0.035]'>
              <p className='text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]'>Momentum</p>
              <p className='mt-2 text-5xl font-semibold text-[var(--pf-text)]'>{careerMomentum.score}%</p>
              <p className='mt-1 text-sm font-semibold text-teal-600 dark:text-teal-200'>{careerMomentum.direction}</p>
              <div className='mt-4 h-2 rounded-full bg-slate-200 dark:bg-white/10'>
                <div className='h-2 rounded-full bg-gradient-to-r from-violet-400 via-sky-400 to-teal-300 shadow-[0_0_18px_rgba(94,234,212,0.35)]' style={{ width: `${careerMomentum.score}%` }} />
              </div>
            </div>
            <div className='space-y-3'>
              {careerMomentum.signals.map((item, index) => (
                <div key={item} className='flex gap-3 rounded-2xl border border-[var(--pf-border)] bg-white/55 p-3 dark:bg-white/[0.035]'>
                  <span className='grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-300/10 text-sm font-semibold text-teal-600 dark:text-teal-200'>
                    {index + 1}
                  </span>
                  <p className='text-sm leading-6 text-[var(--pf-muted)]'>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className='grid gap-4 xl:grid-cols-[1.05fr_0.95fr]'>
        <Card>
          <SectionHeader
            title='Readiness Intelligence'
            subtitle='Resume, skills, profile proof, and company fit in one place.'
          />
          <div className='grid gap-3 md:grid-cols-4'>
            <PulseMetric label='Eligibility' value={`${intelligence?.eligibilityScore || 0}%`} />
            <PulseMetric label='Selection' value={`${intelligence?.selectionProbability || 0}%`} />
            <PulseMetric label='Resume' value={`${intelligence?.resumeStrength || 0}%`} />
            <PulseMetric label='Batch Rank' value={`${intelligence?.rank?.rank || 1}/${intelligence?.rank?.total || 1}`} />
          </div>

          <div className='mt-4 grid gap-3 md:grid-cols-3'>
            <ProfileSignalCard icon={<Code2 className='h-4 w-4' />} title='GitHub' signal={intelligence?.profileSignals?.github} />
            <ProfileSignalCard icon={<Activity className='h-4 w-4' />} title='LinkedIn' signal={intelligence?.profileSignals?.linkedin} />
            <ProfileSignalCard icon={<Code2 className='h-4 w-4' />} title='Coding Profiles' signal={intelligence?.profileSignals?.coding} />
          </div>
        </Card>

        <Card>
          <SectionHeader title='Smart Insights' subtitle='Generated from your resume, applications, and active roles.' />
          <div className='space-y-2'>
            {(intelligence?.insights || []).slice(0, 5).map((item) => (
              <div key={item} className='flex gap-3 rounded-2xl border border-[var(--pf-border)] bg-white/70 p-3 dark:bg-white/[0.04]'>
                <Bell className='mt-0.5 h-4 w-4 shrink-0 text-sky-500' />
                <p className='text-sm leading-6 text-[var(--pf-muted)]'>{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className='grid gap-4 xl:grid-cols-[0.9fr_1.1fr]'>
        <Card>
          <SectionHeader title='Skill Heatmap' subtitle='Shows the strongest and weakest profile areas.' />
          <div className='space-y-3'>
            {(intelligence?.skillHeatmap || []).map((group) => (
              <HeatmapRow key={group.name} group={group} />
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title='Action Feed' subtitle='A compact plan instead of scattered feature pages.' />
          <div className='grid gap-3 md:grid-cols-2'>
            {(intelligence?.recommendations || []).slice(0, 4).map((item, index) => (
              <div key={item} className='rounded-2xl border border-[var(--pf-border)] bg-white/70 p-4 dark:bg-white/[0.04]'>
                <div className='flex items-center gap-2'>
                  <Trophy className='h-4 w-4 text-amber-500' />
                  <p className='text-xs font-semibold uppercase tracking-[0.14em] text-[var(--pf-muted)]'>Action {index + 1}</p>
                </div>
                <p className='mt-2 text-sm leading-6 text-[var(--pf-text)]'>{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {bestMatch ? (
        <section className='grid gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
          <Card>
            <SectionHeader
              title={`${bestMatch.job.companyName} Match Breakdown`}
              subtitle={`${bestMatch.job.roleName} | Model: ${bestMatch.modelUsed} | Confidence ${bestMatch.confidence}%`}
            />
            <div className='space-y-3'>
              {Object.entries(bestMatch.breakdown).map(([key, item]) => (
                <BreakdownBar key={key} label={item.label} value={item.score} note={item.score >= 78 ? item.positive : item.reason} />
              ))}
            </div>
          </Card>

          <Card className='border-teal-300/20 bg-gradient-to-br from-teal-300/10 to-sky-400/10'>
            <SectionHeader title='Why This Prediction?' subtitle='Transparent factors behind your score.' />
            <div className='space-y-3'>
              {(bestMatch.strengths.length ? bestMatch.strengths : ['Your profile has enough baseline data for prediction.']).slice(0, 3).map((item) => (
                <InsightLine key={item} tone='good' text={item} />
              ))}
              {(bestMatch.weakAreas.length ? bestMatch.weakAreas : ['No major weakness detected for this role.']).slice(0, 3).map((item) => (
                <InsightLine key={item} tone='weak' text={item} />
              ))}
            </div>
          </Card>
        </section>
      ) : null}

      <Card>
        <SectionHeader title='Improvement Suggestions' subtitle='Prioritized actions to raise shortlist and selection probability.' />
        <div className='grid gap-3 lg:grid-cols-4'>
          {(topSuggestions.length ? topSuggestions : [
            'Upload or improve your resume to unlock stronger ATS signals.',
            'Add role-specific projects with measurable outcomes.',
            'Practice mock interviews to improve communication and confidence.',
            'Apply to roles where your branch, CGPA, and skills are aligned.',
          ]).map((item, index) => (
            <div key={item} className='rounded-2xl border border-[var(--pf-border)] bg-white/60 p-4 dark:bg-slate-950/50'>
              <p className='text-xs font-semibold text-sky-600 dark:text-teal-200'>0{index + 1}</p>
              <p className='mt-2 text-sm leading-6 text-[var(--pf-muted)]'>{item}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title='Role Match Cards' subtitle='Each card shows match score, hiring probability, missing skills, and the reason behind the prediction.' />
        <div className='mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]'>
          <Input placeholder='Search company, role, location, skill' value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className='h-11 rounded-2xl border border-[var(--pf-border)] bg-white/75 px-4 text-sm text-[var(--pf-text)] outline-none dark:bg-white/5' value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option>All</option>
            <option>Placement</option>
            <option>Internship</option>
          </select>
          <select className='h-11 rounded-2xl border border-[var(--pf-border)] bg-white/75 px-4 text-sm text-[var(--pf-text)] outline-none dark:bg-white/5' value={matchFilter} onChange={(event) => setMatchFilter(event.target.value)}>
            <option>All</option>
            <option>Strong</option>
            <option>Eligible</option>
            <option>Saved</option>
          </select>
        </div>

        <div className='grid gap-3 lg:grid-cols-3'>
          {visibleMatchedDrives.slice(0, 9).map((drive) => (
            <div key={drive.id} className='group rounded-3xl border border-[var(--pf-border)] bg-white/70 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-950/50'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex min-w-0 items-start gap-3'>
                  <CompanyMark name={drive.name} logoUrl={drive.logoUrl} />
                  <div className='min-w-0'>
                    <p className='truncate font-semibold text-[var(--pf-text)]'>{drive.name}</p>
                    <p className='truncate text-xs text-[var(--pf-muted)]'>{drive.role} · {drive.driveType || 'Placement'}</p>
                    <p className='mt-1 flex items-center gap-1 text-xs text-[var(--pf-muted)]'>
                      <MapPin className='h-3.5 w-3.5' />
                      {drive.location || 'Campus'} · {drive.workType || 'Onsite'}
                    </p>
                  </div>
                </div>
                <span className='rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 dark:border-teal-300/20 dark:bg-teal-300/10 dark:text-teal-100'>
                  {drive.match.matchScore}%
                </span>
              </div>
              <div className='mt-4 h-2 rounded-full bg-slate-200 dark:bg-white/10'>
                <div className='h-2 rounded-full bg-gradient-to-r from-sky-400 to-teal-300' style={{ width: `${drive.match.matchScore}%` }} />
              </div>
              <div className='mt-4 flex flex-wrap gap-1.5'>
                {(drive.requiredSkills || []).slice(0, 4).map((skill) => (
                  <span key={skill} className='rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300'>{skill}</span>
                ))}
              </div>
              <div className='mt-4 space-y-2 text-xs text-[var(--pf-muted)]'>
                <p className='flex items-center gap-2'><Gauge className='h-3.5 w-3.5 text-teal-500' />Hiring probability {drive.match.hiringProbability}%</p>
                <p className='flex items-center gap-2'><BrainCircuit className='h-3.5 w-3.5 text-sky-500' />Shortlist probability {drive.match.shortlistedProbability}%</p>
                <p className='flex items-center gap-2'><CalendarClock className='h-3.5 w-3.5 text-violet-500' />Deadline {drive.deadline || 'Not set'}</p>
                <p className='flex items-center gap-2'><Activity className='h-3.5 w-3.5 text-teal-500' />{drive.applicantsCount || 0} applicant{drive.applicantsCount === 1 ? '' : 's'} from campus</p>
                <p className='flex items-center gap-2'><Target className='h-3.5 w-3.5 text-amber-500' />{drive.match.missingSkills.slice(0, 2).join(', ') || 'No critical missing skills'}</p>
              </div>
              <div className='mt-4 grid grid-cols-[1fr_auto] gap-2'>
                <Button
                  size='sm'
                  className='w-full'
                  onClick={() => handleApply(drive.id)}
                  disabled={!drive.eligible || drive.hasApplied}
                >
                  {drive.hasApplied ? 'Applied' : drive.eligible ? 'Quick Apply' : 'Not Eligible'}
                </Button>
                <button
                  className={`grid h-10 w-10 place-items-center rounded-2xl border transition hover:text-[var(--pf-text)] ${
                    savedOpenings.has(drive.id)
                      ? 'border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200'
                      : 'border-[var(--pf-border)] bg-white/70 text-[var(--pf-muted)] dark:bg-white/5'
                  }`}
                  type='button'
                  title='Save opening'
                  onClick={() => toggleSaved(drive.id)}
                >
                  <Bookmark className='h-4 w-4' fill={savedOpenings.has(drive.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {!visibleMatchedDrives.length ? (
          <div className='rounded-3xl border border-dashed border-[var(--pf-border)] bg-white/55 p-8 text-center text-sm text-[var(--pf-muted)] dark:bg-white/[0.03]'>
            No openings match your current filters.
          </div>
        ) : null}
      </Card>

      <section className='grid gap-4 xl:grid-cols-[0.95fr_1.05fr]'>
        <Card>
          <SectionHeader title='Upcoming Deadlines' subtitle='Applications that need attention soon.' />
          <div className='space-y-3'>
            {matchedDrives
              .filter((drive) => drive.deadline)
              .slice(0, 5)
              .map((drive) => (
                <div key={drive.id} className='flex items-center justify-between gap-3 rounded-2xl border border-[var(--pf-border)] bg-white/60 p-3 dark:bg-white/[0.03]'>
                  <div>
                    <p className='text-sm font-semibold text-[var(--pf-text)]'>{drive.name}</p>
                    <p className='text-xs text-[var(--pf-muted)]'>{drive.role}</p>
                  </div>
                  <span className='rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-400/10 dark:text-sky-200'>{drive.deadline}</span>
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title='Activity Timeline' subtitle='Recent actions and next recommended steps.' />
          <div className='space-y-3'>
            {[
              `${myApplications.length} applications submitted this cycle.`,
              savedOpenings.size ? `${savedOpenings.size} openings saved for review.` : 'Save interesting roles to build your shortlist.',
              bestMatch ? `${bestMatch.job.companyName} is your strongest current match at ${bestMatch.matchScore}%.` : 'Upload more profile data to improve match quality.',
              topSuggestions[0] || 'Practice a mock interview to improve confidence signals.',
            ].map((item, index) => (
              <div key={item} className='flex gap-3 rounded-2xl border border-[var(--pf-border)] bg-white/60 p-3 dark:bg-white/[0.03]'>
                <span className='mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-sky-400 to-teal-300' />
                <p className='text-sm leading-6 text-[var(--pf-muted)]'><span className='font-semibold text-[var(--pf-text)]'>Step {index + 1}.</span> {item}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <SectionHeader title='Active Opportunities' subtitle='Quick application list filtered by branch and CGPA eligibility.' />
        {applyMessage ? <p className='mb-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700 dark:border-teal-300/20 dark:bg-teal-300/10 dark:text-teal-100'>{applyMessage}</p> : null}
        <div className='grid gap-3 md:grid-cols-2'>
          {eligibleCompanies.map((drive) => (
            <div key={drive.id} className='rounded-2xl border border-[var(--pf-border)] bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-teal-200 dark:bg-white/[0.04]'>
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <p className='text-sm font-semibold text-[var(--pf-text)]'>{drive.name}</p>
                  <p className='text-xs text-[var(--pf-muted)]'>{drive.role}</p>
                </div>
                <span className='rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-400/10 dark:text-sky-200'>{drive.package} LPA</span>
              </div>

              <p className='mt-2 text-xs text-[var(--pf-muted)]'>
                CGPA {drive.eligibility}+ · Branch: {drive.branch} · {drive.applicantsCount || 0} applicant{drive.applicantsCount === 1 ? '' : 's'}
              </p>

              <div className='mt-3'>
                <Button
                  size='sm'
                  onClick={() => handleApply(drive.id)}
                  disabled={!drive.eligible || drive.hasApplied}
                >
                  {drive.hasApplied ? 'Applied' : drive.eligible ? 'Apply' : 'Not Eligible'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {ineligibleCompanies.length > 0 ? (
          <div className='mt-4 rounded-xl border border-slate-200 bg-slate-50/90 p-3'>
            <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>Not eligible now</p>
            <div className='flex flex-wrap gap-2'>
              {ineligibleCompanies.map((company) => (
                <span key={company.id} className='rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-500'>
                  {company.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <Card>
        <SectionHeader title='My Applications' subtitle='Live statuses across each company pipeline' />
        {myApplications.length > 0 ? (
          <div className='space-y-2'>
            {myApplications.map((application) => (
              <div key={application.id} className='flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2'>
                <div>
                  <p className='text-sm font-medium text-slate-900'>{application.companyName}</p>
                  <p className='text-xs text-slate-500'>{application.role}</p>
                </div>
                <span className='rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700'>{application.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-slate-500'>No applications yet. Start with an ongoing drive.</p>
        )}
      </Card>

      <Card>
        <SectionHeader title='Status Tracker' subtitle='Applied -> Interview -> HR -> Selected' />
        <div className='flex flex-wrap items-center gap-2 md:gap-4'>
          {STUDENT_TRACK_STAGES.map((stage, index) => (
            <div key={stage} className='flex items-center gap-2'>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  index <= currentStepIndex ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {stage}
              </div>
              {index < STUDENT_TRACK_STAGES.length - 1 ? <div className='h-px w-6 bg-slate-300' /> : null}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title='Interview Preparation' subtitle='Practice with an AI interviewer before company rounds.' />
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='max-w-2xl text-sm leading-6 text-[var(--pf-muted)]'>
            Generate role-specific HR, technical, resume, behavioral, and project questions from your profile and target role.
          </p>
          <Button onClick={() => navigate('/student/mock-interview')}>
            <BrainCircuit className='h-4 w-4' />
            Start Mock Interview
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}

function PlacementRadar({ metrics }) {
  const size = 240;
  const center = size / 2;
  const maxRadius = 88;
  const angleStep = (Math.PI * 2) / metrics.length;
  const points = metrics.map((metric, index) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const radius = (Math.max(0, Math.min(100, metric.value)) / 100) * maxRadius;
    return {
      ...metric,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * (maxRadius + 24),
      labelY: center + Math.sin(angle) * (maxRadius + 24),
      axisX: center + Math.cos(angle) * maxRadius,
      axisY: center + Math.sin(angle) * maxRadius,
    };
  });
  const polygon = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className='grid gap-5 lg:grid-cols-[280px_1fr]'>
      <div className='relative mx-auto grid h-[280px] w-[280px] place-items-center'>
        <svg viewBox={`0 0 ${size} ${size}`} className='h-full w-full overflow-visible'>
          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <polygon
              key={scale}
              points={metrics.map((_, index) => {
                const angle = -Math.PI / 2 + index * angleStep;
                return `${center + Math.cos(angle) * maxRadius * scale},${center + Math.sin(angle) * maxRadius * scale}`;
              }).join(' ')}
              fill='none'
              stroke='rgba(148,163,184,0.18)'
              strokeWidth='1'
            />
          ))}
          {points.map((point) => (
            <line key={point.label} x1={center} y1={center} x2={point.axisX} y2={point.axisY} stroke='rgba(148,163,184,0.16)' strokeWidth='1' />
          ))}
          <polygon points={polygon} fill='rgba(94,234,212,0.20)' stroke='#5eead4' strokeWidth='2.5' className='pf-glow-line' />
          {points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r='4' fill='#5eead4' />
              <text x={point.labelX} y={point.labelY} textAnchor='middle' dominantBaseline='middle' className='fill-[var(--pf-muted)] text-[10px] font-semibold'>
                {point.label}
              </text>
            </g>
          ))}
        </svg>
        <div className='absolute grid h-20 w-20 place-items-center rounded-full border border-teal-300/30 bg-white/70 text-center shadow-lg dark:bg-slate-950/80'>
          <div>
            <p className='text-2xl font-semibold text-[var(--pf-text)]'>{Math.round(metrics.reduce((sum, item) => sum + item.value, 0) / metrics.length)}%</p>
            <p className='text-[10px] uppercase tracking-[0.18em] text-[var(--pf-muted)]'>Profile</p>
          </div>
        </div>
      </div>
      <div className='grid content-center gap-3 sm:grid-cols-2'>
        {metrics.map((metric) => (
          <div key={metric.label} className='rounded-2xl border border-[var(--pf-border)] bg-white/55 p-3 dark:bg-white/[0.035]'>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-sm font-semibold text-[var(--pf-text)]'>{metric.label}</p>
              <span className='text-sm font-semibold text-[var(--pf-muted)]'>{metric.value}%</span>
            </div>
            <div className='mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-white/10'>
              <div className='h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-teal-300' style={{ width: `${metric.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PulseMetric({ label, value }) {
  return (
    <div className='rounded-2xl border border-[var(--pf-border)] bg-white/70 p-3 dark:bg-slate-950/60'>
      <p className='text-xs text-[var(--pf-muted)]'>{label}</p>
      <p className='mt-1 text-xl font-semibold text-[var(--pf-text)]'>{value}</p>
    </div>
  );
}

function ProfileSignalCard({ icon, title, signal }) {
  const active = Boolean(signal?.active);
  return (
    <div className='rounded-2xl border border-[var(--pf-border)] bg-white/70 p-4 dark:bg-slate-950/50'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'}`}>
            {icon}
          </span>
          <div>
            <p className='text-sm font-semibold text-[var(--pf-text)]'>{title}</p>
            <p className='text-xs text-[var(--pf-muted)]'>{signal?.label || 'Not connected'}</p>
          </div>
        </div>
        <span className='text-sm font-bold text-[var(--pf-text)]'>{signal?.score || 0}%</span>
      </div>
      <p className='mt-3 text-xs leading-5 text-[var(--pf-muted)]'>{signal?.detail || 'Add this profile signal to improve prediction confidence.'}</p>
    </div>
  );
}

function HeatmapRow({ group }) {
  const tone = group.score >= 70 ? 'from-emerald-400 to-teal-300' : group.score >= 45 ? 'from-amber-400 to-orange-300' : 'from-rose-400 to-pink-300';
  return (
    <div className='rounded-2xl border border-[var(--pf-border)] bg-white/70 p-3 dark:bg-white/[0.04]'>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-sm font-semibold text-[var(--pf-text)]'>{group.name}</p>
        <span className='text-sm font-semibold text-[var(--pf-muted)]'>{group.score}%</span>
      </div>
      <div className='mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10'>
        <div className={`h-2 rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${group.score}%` }} />
      </div>
      <p className='mt-2 text-xs leading-5 text-[var(--pf-muted)]'>
        {group.missing.length ? `Next: ${group.missing.join(', ')}` : 'Strong coverage for this area.'}
      </p>
    </div>
  );
}

function BreakdownBar({ label, value, note }) {
  const tone = value >= 78 ? 'bg-emerald-300' : value >= 62 ? 'bg-amber-300' : 'bg-rose-300';
  return (
    <div className='rounded-2xl border border-[var(--pf-border)] bg-white/65 p-3 dark:bg-slate-950/50'>
      <div className='mb-2 flex items-center justify-between gap-3'>
        <p className='text-sm font-semibold text-[var(--pf-text)]'>{label}</p>
        <span className='text-sm font-semibold text-[var(--pf-muted)]'>{value}%</span>
      </div>
      <div className='h-2 rounded-full bg-white/10'>
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <p className='mt-2 text-xs leading-5 text-[var(--pf-muted)]'>{note}</p>
    </div>
  );
}

function InsightLine({ tone, text }) {
  const classes = tone === 'good'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100'
    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100';
  return <p className={`rounded-2xl border px-3 py-2 text-sm leading-6 ${classes}`}>{text}</p>;
}

function CompanyMark({ name, logoUrl }) {
  if (logoUrl) return <img src={logoUrl} alt='' className='h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-[var(--pf-border)]' />;
  return (
    <span className='grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-teal-300 text-base font-bold text-white shadow-lg shadow-sky-400/20'>
      {(name || 'P').slice(0, 1).toUpperCase()}
    </span>
  );
}
