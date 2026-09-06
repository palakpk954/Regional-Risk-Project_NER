import { createElement, useMemo, useRef, useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bookmark,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Gauge,
  MapPin,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import { buildUnifiedReadiness } from '../services/readinessIntelligenceService';
import { usePlacementStore } from '../store/usePlacementStore';

function toList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || '')
    .split(/[,;/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getBranchLabel(company) {
  const branches = company.eligibleBranches?.length ? company.eligibleBranches : toList(company.branch || 'All');
  return branches.length ? branches.join(', ') : 'All';
}

function enrichDrive(company, student, applications, allApplications) {
  const branches = company.eligibleBranches?.length ? company.eligibleBranches : toList(company.branch || 'All');
  const normalizedBranches = branches.map((branch) => branch.toLowerCase());
  const studentBranch = String(student.branch || '').toLowerCase();
  const minCgpa = Number(company.minCgpa ?? company.eligibility ?? 0);
  const minAttendance = Number(company.minAttendance ?? 0);
  const maxBacklogs = Number(company.maxBacklogs ?? 99);
  const branchMatch = normalizedBranches.includes('all') || normalizedBranches.includes(studentBranch);
  const cgpaMatch = Number(student.cgpa || 0) >= minCgpa;
  const attendanceMatch = Number(student.attendance ?? 100) >= minAttendance;
  const backlogMatch = Number(student.activeBacklogs ?? 0) <= maxBacklogs;

  return {
    ...company,
    eligibleBranches: branches,
    branch: getBranchLabel(company),
    eligible: branchMatch && cgpaMatch && attendanceMatch && backlogMatch,
    hasApplied: applications.some((application) => application.companyId === company.id),
    applicantsCount: allApplications.filter((application) => application.companyId === company.id).length,
    eligibilityBlockers: [
      branchMatch ? null : 'Branch is not eligible',
      cgpaMatch ? null : `Needs CGPA ${minCgpa}+`,
      attendanceMatch ? null : `Needs attendance ${minAttendance}%+`,
      backlogMatch ? null : `Allows max ${maxBacklogs} backlog${maxBacklogs === 1 ? '' : 's'}`,
    ].filter(Boolean),
  };
}

export default function StudentOpportunitiesPage() {
  const currentStudentId = usePlacementStore((state) => state.currentStudentId);
  const students = usePlacementStore((state) => state.students);
  const companies = usePlacementStore((state) => state.companies);
  const applicationViews = usePlacementStore((state) => state.applicationViews);
  const applyToCompany = usePlacementStore((state) => state.applyToCompany);
  const [query, setQuery] = useState('');
  const [fitFilter, setFitFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [message, setMessage] = useState('');
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

  const openDrives = useMemo(() => {
    if (!currentStudent) return [];
    return companies
      .filter((company) => !['closed', 'archived', 'draft'].includes(String(company.status || 'Open').toLowerCase()))
      .map((company) => enrichDrive(company, currentStudent, myApplications, applicationViews));
  }, [applicationViews, companies, currentStudent, myApplications]);

  const intelligence = useMemo(
    () => currentStudent
      ? buildUnifiedReadiness({
        student: currentStudent,
        drives: openDrives,
        applications: myApplications,
        peers: students,
      })
      : null,
    [currentStudent, myApplications, openDrives, students],
  );

  const matchedDrives = intelligence?.matches || [];
  const visibleDrives = matchedDrives.filter((drive) => {
    const haystack = `${drive.name} ${drive.role} ${drive.location} ${getBranchLabel(drive)} ${(drive.requiredSkills || []).join(' ')}`.toLowerCase();
    const queryMatch = !query || haystack.includes(query.toLowerCase());
    const typeMatch = typeFilter === 'All' || String(drive.driveType || 'Placement') === typeFilter;
    const fitMatch =
      fitFilter === 'All' ||
      (fitFilter === 'Strong Match' && drive.match.matchScore >= 75) ||
      (fitFilter === 'Eligible' && drive.eligible) ||
      (fitFilter === 'Saved' && savedOpenings.has(drive.id));
    return queryMatch && typeMatch && fitMatch;
  });

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  const showMessage = (nextMessage) => {
    setMessage(nextMessage);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(''), 2400);
  };

  const handleApply = (companyId) => {
    const result = applyToCompany(companyId);
    showMessage(result?.ok ? 'Application submitted. It is now visible in your dashboard.' : result?.error || 'Unable to apply right now.');
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
          <SectionHeader title='Opportunities' subtitle='Sign in as a student to see company listings.' />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className='space-y-6'>
      <section className='overflow-hidden rounded-[32px] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-5 shadow-[var(--pf-shadow)] backdrop-blur-xl lg:p-7'>
        <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <span className='inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-teal-300/20 dark:bg-teal-300/10 dark:text-teal-100'>
              <Sparkles className='h-3.5 w-3.5' />
              Opportunity Hub
            </span>
            <h1 className='mt-4 text-3xl font-semibold tracking-tight text-[var(--pf-text)] md:text-5xl'>
              Find roles that fit your profile.
            </h1>
            <p className='mt-3 max-w-2xl text-sm leading-6 text-[var(--pf-muted)]'>
              Every listing comes from the TPO workspace. Placify checks eligibility, predicts role fit, and explains what to improve before you apply.
            </p>
          </div>
          <div className='grid gap-2 sm:grid-cols-3 lg:w-[430px]'>
            <MiniMetric label='Open roles' value={openDrives.length} />
            <MiniMetric label='Eligible' value={openDrives.filter((drive) => drive.eligible).length} />
            <MiniMetric label='Applied' value={myApplications.length} />
          </div>
        </div>
      </section>

      <Card>
        <div className='grid gap-3 lg:grid-cols-[1fr_180px_180px]'>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pf-muted)]' />
            <Input
              className='pl-11'
              placeholder='Search company, role, branch, or skill'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            className='h-11 rounded-2xl border border-[var(--pf-border)] bg-white/75 px-4 text-sm text-[var(--pf-text)] outline-none dark:bg-white/5'
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option>All</option>
            <option>Placement</option>
            <option>Internship</option>
          </select>
          <select
            className='h-11 rounded-2xl border border-[var(--pf-border)] bg-white/75 px-4 text-sm text-[var(--pf-text)] outline-none dark:bg-white/5'
            value={fitFilter}
            onChange={(event) => setFitFilter(event.target.value)}
          >
            <option>All</option>
            <option>Strong Match</option>
            <option>Eligible</option>
            <option>Saved</option>
          </select>
        </div>
        {message ? (
          <p className='mt-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 dark:border-teal-300/20 dark:bg-teal-300/10 dark:text-teal-100'>
            {message}
          </p>
        ) : null}
      </Card>

      <div className='grid gap-4 xl:grid-cols-[1fr_320px]'>
        <div className='grid gap-4 lg:grid-cols-2'>
          {visibleDrives.map((drive) => (
            <article key={drive.id} className='group rounded-[28px] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[var(--pf-shadow)]'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex min-w-0 items-start gap-3'>
                  <CompanyMark name={drive.name} logoUrl={drive.logoUrl} />
                  <div className='min-w-0'>
                    <p className='truncate text-lg font-semibold text-[var(--pf-text)]'>{drive.name}</p>
                    <p className='truncate text-sm text-[var(--pf-muted)]'>{drive.role || 'Placement Role'}</p>
                    <p className='mt-2 flex items-center gap-1.5 text-xs text-[var(--pf-muted)]'>
                      <MapPin className='h-3.5 w-3.5' />
                      {drive.location || 'Campus'} · {drive.workType || 'Onsite'}
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  title='Save opening'
                  onClick={() => toggleSaved(drive.id)}
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border transition ${
                    savedOpenings.has(drive.id)
                      ? 'border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200'
                      : 'border-[var(--pf-border)] bg-white/70 text-[var(--pf-muted)] hover:text-[var(--pf-text)] dark:bg-white/5'
                  }`}
                >
                  <Bookmark className='h-4 w-4' fill={savedOpenings.has(drive.id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className='mt-5 grid gap-3 sm:grid-cols-3'>
                <ScorePill label='Match' value={`${drive.match.matchScore}%`} icon={Gauge} />
                <ScorePill label='Hiring' value={`${drive.match.hiringProbability}%`} icon={Target} />
                <ScorePill label='CTC' value={`${drive.package || drive.packageLpa || 0} LPA`} icon={BriefcaseBusiness} />
              </div>

              <div className='mt-5 h-2 rounded-full bg-slate-200 dark:bg-white/10'>
                <div className='h-2 rounded-full bg-gradient-to-r from-sky-400 to-teal-300' style={{ width: `${drive.match.matchScore}%` }} />
              </div>

              <div className='mt-4 flex flex-wrap gap-1.5'>
                {(drive.requiredSkills || []).slice(0, 5).map((skill) => (
                  <span key={skill} className='rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300'>
                    {skill}
                  </span>
                ))}
              </div>

              <div className='mt-5 space-y-2 rounded-2xl border border-[var(--pf-border)] bg-white/55 p-3 dark:bg-white/[0.035]'>
                <p className='flex items-center gap-2 text-sm font-semibold text-[var(--pf-text)]'>
                  {drive.eligible ? <CheckCircle2 className='h-4 w-4 text-teal-500' /> : <AlertTriangle className='h-4 w-4 text-amber-500' />}
                  {drive.eligible ? 'Eligible to apply' : 'Needs attention before applying'}
                </p>
                <p className='text-xs leading-5 text-[var(--pf-muted)]'>
                  Branch: {getBranchLabel(drive)} · CGPA {drive.minCgpa ?? drive.eligibility ?? 0}+ · {drive.applicantsCount} applicant{drive.applicantsCount === 1 ? '' : 's'} · Deadline {drive.deadline || 'Not set'}
                </p>
                <p className='text-xs leading-5 text-[var(--pf-muted)]'>
                  {drive.eligibilityBlockers.length ? drive.eligibilityBlockers.join(' · ') : drive.match.suggestedImprovements?.[0] || 'Your profile satisfies the main screening rules.'}
                </p>
              </div>

              <div className='mt-5 flex flex-col gap-2 sm:flex-row sm:items-center'>
                <Button
                  size='sm'
                  className='w-full sm:w-auto'
                  onClick={() => handleApply(drive.id)}
                  disabled={!drive.eligible || drive.hasApplied}
                >
                  {drive.hasApplied ? 'Applied' : drive.eligible ? 'Quick Apply' : 'Not Eligible'}
                </Button>
                <p className='text-xs text-[var(--pf-muted)]'>
                  {drive.match.missingSkills?.length ? `Missing: ${drive.match.missingSkills.slice(0, 3).join(', ')}` : 'No critical missing skills.'}
                </p>
              </div>
            </article>
          ))}
        </div>

        <aside className='space-y-4'>
          <Card>
            <SectionHeader title='Best next step' subtitle='Small actions that improve fit.' />
            <div className='space-y-3'>
              {(intelligence?.recommendations || []).slice(0, 4).map((item, index) => (
                <div key={item} className='rounded-2xl border border-[var(--pf-border)] bg-white/55 p-3 dark:bg-white/[0.035]'>
                  <p className='text-xs font-semibold text-sky-600 dark:text-teal-200'>Step {index + 1}</p>
                  <p className='mt-1 text-sm leading-6 text-[var(--pf-muted)]'>{item}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title='Upcoming deadlines' subtitle='Plan applications early.' />
            <div className='space-y-3'>
              {matchedDrives.filter((drive) => drive.deadline).slice(0, 5).map((drive) => (
                <div key={drive.id} className='flex items-center justify-between gap-3 rounded-2xl border border-[var(--pf-border)] bg-white/55 p-3 dark:bg-white/[0.035]'>
                  <div>
                    <p className='text-sm font-semibold text-[var(--pf-text)]'>{drive.name}</p>
                    <p className='text-xs text-[var(--pf-muted)]'>{drive.role}</p>
                  </div>
                  <span className='flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-400/10 dark:text-sky-200'>
                    <CalendarClock className='h-3.5 w-3.5' />
                    {drive.deadline}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      {!visibleDrives.length ? (
        <Card className='border-dashed text-center'>
          <SectionHeader title='No matching roles found' subtitle='Try clearing filters or ask the TPO to publish active drives.' />
        </Card>
      ) : null}
    </PageContainer>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className='rounded-2xl border border-[var(--pf-border)] bg-white/65 p-3 dark:bg-white/[0.04]'>
      <p className='text-xs text-[var(--pf-muted)]'>{label}</p>
      <p className='mt-1 text-2xl font-semibold text-[var(--pf-text)]'>{value}</p>
    </div>
  );
}

function CompanyMark({ name, logoUrl }) {
  if (logoUrl) {
    return <img src={logoUrl} alt='' className='h-12 w-12 rounded-2xl border border-[var(--pf-border)] object-cover' />;
  }

  return (
    <span className='grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-teal-300 text-lg font-bold text-white shadow-lg shadow-sky-400/20'>
      {String(name || 'P').slice(0, 1).toUpperCase()}
    </span>
  );
}

function ScorePill({ label, value, icon: Icon }) {
  return (
    <div className='rounded-2xl border border-[var(--pf-border)] bg-white/60 p-3 dark:bg-white/[0.035]'>
      <div className='flex items-center gap-2 text-xs text-[var(--pf-muted)]'>
        {createElement(Icon, { className: 'h-3.5 w-3.5' })}
        {label}
      </div>
      <p className='mt-1 text-base font-semibold text-[var(--pf-text)]'>{value}</p>
    </div>
  );
}
