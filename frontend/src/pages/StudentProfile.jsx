import { createElement, useMemo, useState } from 'react';
import {
  Bell,
  BrainCircuit,
  Code2,
  LockKeyhole,
  Medal,
  Radar,
  Sparkles,
  Trophy,
  User,
} from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import {
  buildAchievements,
  buildAlumniResumeVault,
  buildCodingAnalytics,
  buildStudentNotifications,
  inferCareerDomain,
  syncGithubPublicProfile,
} from '../services/careerIntelligenceService';
import { buildUnifiedReadiness } from '../services/readinessIntelligenceService';
import { usePlacementStore } from '../store/usePlacementStore';

function asList(value) {
  if (Array.isArray(value)) return value;
  return String(value || '').split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
}

function listText(value) {
  return asList(value).join(', ');
}

export default function StudentProfile() {
  const currentStudentId = usePlacementStore((state) => state.currentStudentId);
  const students = usePlacementStore((state) => state.students);
  const companies = usePlacementStore((state) => state.companies);
  const applicationViews = usePlacementStore((state) => state.applicationViews);
  const updateCurrentStudentProfile = usePlacementStore((state) => state.updateCurrentStudentProfile);

  const currentStudent = students.find((student) => student.id === currentStudentId);
  const myApplications = applicationViews.filter((item) => item.studentId === currentStudentId);
  const readiness = useMemo(
    () => currentStudent ? buildUnifiedReadiness({ student: currentStudent, drives: companies, applications: myApplications, peers: students }) : null,
    [companies, currentStudent, myApplications, students],
  );
  const domain = useMemo(() => currentStudent ? inferCareerDomain(currentStudent, companies) : null, [companies, currentStudent]);
  const coding = useMemo(() => currentStudent ? buildCodingAnalytics(currentStudent) : null, [currentStudent]);
  const achievements = useMemo(() => currentStudent ? buildAchievements(currentStudent, companies) : [], [companies, currentStudent]);
  const notifications = useMemo(
    () => currentStudent ? buildStudentNotifications({ student: currentStudent, drives: companies, applications: myApplications }) : [],
    [companies, currentStudent, myApplications],
  );
  const vault = useMemo(
    () => currentStudent ? buildAlumniResumeVault({ companies, branch: currentStudent.branch }) : [],
    [companies, currentStudent],
  );

  const initialForm = useMemo(() => ({
    name: currentStudent?.name || '',
    email: currentStudent?.email || '',
    phone: currentStudent?.phone || '',
    bio: currentStudent?.bio || '',
    cgpa: currentStudent?.cgpa || '',
    branch: currentStudent?.branch || '',
    semester: currentStudent?.semester || '',
    skills: listText(currentStudent?.skills),
    certifications: listText(currentStudent?.certifications),
    github: currentStudent?.github || '',
    linkedin: currentStudent?.linkedin || '',
    leetcode: currentStudent?.leetcode || '',
    codechef: currentStudent?.codechef || '',
    notificationPreference: currentStudent?.notificationPreference || 'Important placement updates',
  }), [currentStudent]);

  const [form, setForm] = useState(() => initialForm);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [githubStatus, setGithubStatus] = useState('');
  const [githubSyncing, setGithubSyncing] = useState(false);

  const saveProfile = (event) => {
    event.preventDefault();
    const result = updateCurrentStudentProfile({
      name: form.name,
      email: form.email,
      phone: form.phone,
      bio: form.bio,
      cgpa: Number(form.cgpa || 0),
      branch: form.branch,
      semester: form.semester,
      skills: asList(form.skills),
      certifications: asList(form.certifications),
      github: form.github,
      linkedin: form.linkedin,
      leetcode: form.leetcode,
      codechef: form.codechef,
      notificationPreference: form.notificationPreference,
      profileLinks: [form.github, form.linkedin, form.leetcode, form.codechef].filter(Boolean),
    });

    setMessage(result.ok ? 'Career profile saved. Intelligence cards updated.' : result.error || 'Could not save profile.');
    setEditing(false);
    window.setTimeout(() => setMessage(''), 2600);
  };

  const syncGithub = async () => {
    setGithubSyncing(true);
    setGithubStatus('');
    const result = await syncGithubPublicProfile(form.github);
    if (result.ok) {
      setForm((current) => ({ ...current, github: result.github }));
      updateCurrentStudentProfile({
        github: result.github,
        avatarUrl: result.avatarUrl,
        githubStats: result,
        profileLinks: [result.github, form.linkedin, form.leetcode, form.codechef].filter(Boolean),
      });
      setGithubStatus(`Synced ${result.publicRepos} repositories and ${result.languageDistribution.length} language signals.`);
    } else {
      setGithubStatus(result.error);
    }
    setGithubSyncing(false);
  };

  if (!currentStudent) {
    return (
      <PageContainer>
        <Card>
          <SectionHeader title='Career Intelligence Hub' subtitle='No active student session was found.' />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className='space-y-6'>
      <section className='overflow-hidden rounded-[32px] border border-[var(--pf-border)] bg-[var(--pf-surface)] shadow-[var(--pf-shadow)]'>
        <div className='grid gap-5 p-6 lg:grid-cols-[1.2fr_0.8fr]'>
          <div className='flex gap-4'>
            <div className='grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 to-teal-300 text-2xl font-bold text-white shadow-lg'>
              {currentStudent.avatarUrl ? <img src={currentStudent.avatarUrl} alt='' className='h-full w-full object-cover' /> : (currentStudent.name || 'S').slice(0, 1)}
            </div>
            <div>
              <span className='inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-teal-300/20 dark:bg-teal-300/10 dark:text-teal-100'>
                <Radar className='h-3.5 w-3.5' />
                Career Intelligence Hub
              </span>
              <h1 className='mt-3 text-3xl font-semibold tracking-tight text-[var(--pf-text)] md:text-5xl'>{currentStudent.name}</h1>
              <p className='mt-2 max-w-2xl text-sm leading-6 text-[var(--pf-muted)]'>
                {currentStudent.bio || `Predicted track: ${domain?.domain}. Placify combines ATS, coding proof, role matching, and placement readiness into one recruiter-facing profile.`}
              </p>
              <div className='mt-4 flex flex-wrap gap-2'>
                <Button onClick={() => setEditing((value) => !value)} variant={editing ? 'secondary' : 'primary'}>
                  <User className='h-4 w-4' />
                  {editing ? 'Close Editor' : 'Edit Profile'}
                </Button>
                <Button onClick={syncGithub} variant='secondary' disabled={githubSyncing}>
                  <Code2 className='h-4 w-4' />
                  {githubSyncing ? 'Syncing...' : 'Sync GitHub'}
                </Button>
              </div>
            </div>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <Metric label='Readiness' value={`${readiness?.readinessScore || 0}%`} />
            <Metric label='Best Match' value={`${readiness?.matchPercentage || 0}%`} />
            <Metric label='ATS Strength' value={`${readiness?.resumeStrength || 0}%`} />
            <Metric label='Coding Score' value={`${coding?.consistency || 0}%`} />
          </div>
        </div>
      </section>

      {message || githubStatus ? (
        <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100'>
          {message || githubStatus}
        </div>
      ) : null}

      <section className='grid gap-4 xl:grid-cols-[1fr_0.85fr]'>
        <Card>
          <SectionHeader title='Recruiter Visibility Simulation' subtitle='How your profile looks to a company screening system.' />
          <div className='grid gap-3 md:grid-cols-3'>
            <Signal title='Career Track' value={domain?.domain} note={`${Math.round(domain?.confidence || 0)}% confidence`} icon={BrainCircuit} />
            <Signal title='Interview Level' value={domain?.difficulty} note={domain?.role} icon={Sparkles} />
            <Signal title='Selection Probability' value={`${readiness?.selectionProbability || 0}%`} note={readiness?.risk?.level} icon={Trophy} />
          </div>
          <div className='mt-4 grid gap-3 md:grid-cols-2'>
            {(domain?.domains || []).slice(0, 4).map((item) => (
              <ProgressRow key={item.domain} label={item.domain} value={item.score} note={item.matched.join(', ') || 'Needs proof'} />
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title='Smart Notifications' subtitle='Placement reminders and readiness alerts.' />
          <div className='space-y-2'>
            {notifications.map((item) => (
              <div key={`${item.type}-${item.title}`} className='flex gap-3 rounded-2xl border border-[var(--pf-border)] bg-white/65 p-3 dark:bg-white/[0.04]'>
                <Bell className='mt-0.5 h-4 w-4 text-sky-500' />
                <div>
                  <p className='text-sm font-semibold text-[var(--pf-text)]'>{item.title}</p>
                  <p className='text-xs leading-5 text-[var(--pf-muted)]'>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className='grid gap-4 xl:grid-cols-[0.9fr_1.1fr]'>
        <Card>
          <SectionHeader title='Connected Accounts' subtitle='Public profile signals used for recruiter confidence.' />
          <div className='grid gap-3'>
            <Connection icon={Code2} label='GitHub' value={form.github || currentStudent.github} score={readiness?.profileSignals?.github?.score || 0} />
            <Connection icon={User} label='LinkedIn' value={form.linkedin || currentStudent.linkedin} score={readiness?.profileSignals?.linkedin?.score || 0} />
            <Connection icon={Code2} label='Coding Profiles' value={[form.leetcode, form.codechef].filter(Boolean).join(' · ') || 'LeetCode / CodeChef not connected'} score={readiness?.profileSignals?.coding?.score || 0} />
          </div>
        </Card>

        <Card>
          <SectionHeader title='Coding Intelligence' subtitle='Deterministic coding profile analytics from project, DSA, and public profile signals.' />
          <div className='grid gap-3 md:grid-cols-3'>
            <Metric label='Problems' value={coding?.solved || 0} />
            <Metric label='Streak' value={`${coding?.streak || 0}d`} />
            <Metric label='Consistency' value={`${coding?.consistency || 0}%`} />
          </div>
          <div className='mt-4 grid grid-cols-14 gap-1'>
            {(coding?.heatmap || []).map((day) => (
              <span
                key={day.day}
                title={`Day ${day.day}: ${day.value} activity`}
                className='h-4 rounded'
                style={{ background: day.value > 5 ? '#14b8a6' : day.value > 2 ? '#7dd3fc' : 'rgba(148,163,184,0.22)' }}
              />
            ))}
          </div>
        </Card>
      </section>

      <section className='grid gap-4 xl:grid-cols-[1fr_1fr]'>
        <Card>
          <SectionHeader title='Achievement System' subtitle='Milestones that make readiness progress visible.' />
          <div className='grid gap-3 sm:grid-cols-2'>
            {achievements.map((item) => (
              <div key={item.title} className={`rounded-2xl border p-4 ${item.active ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-300/20 dark:bg-emerald-300/10' : 'border-[var(--pf-border)] bg-white/60 dark:bg-white/[0.04]'}`}>
                <Medal className={item.active ? 'h-5 w-5 text-emerald-600 dark:text-emerald-200' : 'h-5 w-5 text-[var(--pf-muted)]'} />
                <p className='mt-2 text-sm font-semibold text-[var(--pf-text)]'>{item.title}</p>
                <p className='mt-1 text-xs text-[var(--pf-muted)]'>{item.note}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title='Alumni Resume Vault' subtitle='Anonymized patterns from successful resume templates.' />
          <div className='space-y-3'>
            {vault.map((item) => (
              <div key={item.id} className='rounded-2xl border border-[var(--pf-border)] bg-white/65 p-3 dark:bg-white/[0.04]'>
                <div className='flex items-center justify-between gap-3'>
                  <p className='text-sm font-semibold text-[var(--pf-text)]'>{item.company} · {item.role}</p>
                  <span className='rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-400/10 dark:text-sky-200'>ATS {item.atsScore}</span>
                </div>
                <p className='mt-2 text-xs font-semibold text-[var(--pf-text)]'>{item.pattern}</p>
                <p className='mt-1 text-xs leading-5 text-[var(--pf-muted)]'>{item.insight}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {editing ? (
        <Card>
          <SectionHeader title='Profile Settings' subtitle='Manage profile, connected account links, notifications, and recruiter-facing signals.' />
          <form onSubmit={saveProfile} className='space-y-4'>
            <div className='grid gap-3 md:grid-cols-3'>
              <Input placeholder='Full name' value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              <Input placeholder='Email' value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              <Input placeholder='Phone' value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              <Input type='number' min='0' max='10' step='0.01' placeholder='CGPA' value={form.cgpa} onChange={(event) => setForm((current) => ({ ...current, cgpa: event.target.value }))} />
              <Input placeholder='Branch' value={form.branch} onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))} />
              <Input placeholder='Semester' value={form.semester} onChange={(event) => setForm((current) => ({ ...current, semester: event.target.value }))} />
              <Input placeholder='GitHub URL or username' value={form.github} onChange={(event) => setForm((current) => ({ ...current, github: event.target.value }))} />
              <Input placeholder='LinkedIn URL' value={form.linkedin} onChange={(event) => setForm((current) => ({ ...current, linkedin: event.target.value }))} />
              <Input placeholder='LeetCode URL' value={form.leetcode} onChange={(event) => setForm((current) => ({ ...current, leetcode: event.target.value }))} />
              <Input placeholder='CodeChef URL' value={form.codechef} onChange={(event) => setForm((current) => ({ ...current, codechef: event.target.value }))} />
              <Input placeholder='Skills, comma separated' value={form.skills} onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))} />
              <Input placeholder='Certifications, comma separated' value={form.certifications} onChange={(event) => setForm((current) => ({ ...current, certifications: event.target.value }))} />
            </div>
            <textarea
              value={form.bio}
              onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
              placeholder='Short recruiter-facing bio'
              className='min-h-28 w-full rounded-2xl border border-[var(--pf-border)] bg-white/80 p-3 text-sm text-[var(--pf-text)] outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-200/40 dark:bg-white/5'
            />
            <div className='grid gap-3 md:grid-cols-[1fr_auto]'>
              <select
                className='h-11 rounded-2xl border border-[var(--pf-border)] bg-white/80 px-3 text-sm text-[var(--pf-text)] outline-none dark:bg-white/5'
                value={form.notificationPreference}
                onChange={(event) => setForm((current) => ({ ...current, notificationPreference: event.target.value }))}
              >
                <option>Important placement updates</option>
                <option>All readiness and drive alerts</option>
                <option>Only application deadlines</option>
              </select>
              <Button type='submit'>
                <LockKeyhole className='h-4 w-4' />
                Save Intelligence Profile
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </PageContainer>
  );
}

function Metric({ label, value }) {
  return (
    <div className='rounded-2xl border border-[var(--pf-border)] bg-white/65 p-4 dark:bg-white/[0.04]'>
      <p className='text-xs text-[var(--pf-muted)]'>{label}</p>
      <p className='mt-1 text-2xl font-semibold text-[var(--pf-text)]'>{value}</p>
    </div>
  );
}

function Signal({ icon: Icon, title, value, note }) {
  return (
    <div className='rounded-2xl border border-[var(--pf-border)] bg-white/65 p-4 dark:bg-white/[0.04]'>
      {createElement(Icon, { className: 'h-5 w-5 text-sky-500 dark:text-teal-200' })}
      <p className='mt-3 text-xs text-[var(--pf-muted)]'>{title}</p>
      <p className='mt-1 text-base font-semibold text-[var(--pf-text)]'>{value || 'Not enough data'}</p>
      <p className='mt-1 text-xs text-[var(--pf-muted)]'>{note}</p>
    </div>
  );
}

function ProgressRow({ label, value, note }) {
  return (
    <div className='rounded-2xl border border-[var(--pf-border)] bg-white/55 p-3 dark:bg-white/[0.04]'>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-sm font-semibold text-[var(--pf-text)]'>{label}</p>
        <span className='text-sm font-semibold text-[var(--pf-muted)]'>{value}%</span>
      </div>
      <div className='mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10'>
        <div className='h-2 rounded-full bg-gradient-to-r from-sky-400 to-teal-300' style={{ width: `${value}%` }} />
      </div>
      <p className='mt-2 text-xs text-[var(--pf-muted)]'>{note}</p>
    </div>
  );
}

function Connection({ icon: Icon, label, value, score }) {
  return (
    <div className='rounded-2xl border border-[var(--pf-border)] bg-white/65 p-4 dark:bg-white/[0.04]'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex gap-3'>
          <span className='grid h-10 w-10 place-items-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-200'>
            {createElement(Icon, { className: 'h-5 w-5' })}
          </span>
          <div>
            <p className='text-sm font-semibold text-[var(--pf-text)]'>{label}</p>
            <p className='mt-1 max-w-[26rem] truncate text-xs text-[var(--pf-muted)]'>{value || 'Not connected'}</p>
          </div>
        </div>
        <span className='text-sm font-bold text-[var(--pf-text)]'>{score}%</span>
      </div>
    </div>
  );
}
