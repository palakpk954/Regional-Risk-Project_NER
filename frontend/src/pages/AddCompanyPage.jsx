import { createElement, useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarClock,
  Check,
  Copy,
  Edit3,
  GraduationCap,
  MapPin,
  Plus,
  Save,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import PageContainer from '../components/PageContainer';
import { calculateJobMatch } from '../services/jobMatchService';
import { usePlacementStore } from '../store/usePlacementStore';

const DRAFT_KEY = 'placify-opening-draft';
const BRANCHES = ['All', 'CSE', 'IT', 'ECE', 'ME', 'CE', 'EE', 'AI/ML', 'Data Science'];
const ROUND_OPTIONS = ['Aptitude', 'Coding Test', 'Technical Interview', 'Managerial Round', 'HR Interview', 'Group Discussion'];
const RESUME_FORMATS = ['PDF', 'DOCX', 'TXT'];

const initialForm = {
  driveType: 'Placement',
  name: '',
  logoUrl: '',
  role: '',
  package: '',
  stipend: '',
  location: 'Jaipur',
  workType: 'Onsite',
  description: '',
  requiredSkills: '',
  preferredSkills: '',
  batchYear: '2025',
  eligibleBranches: ['All'],
  eligibility: '7',
  minAttendance: '75',
  maxBacklogs: '0',
  genderPreference: 'Any',
  degreeType: 'B.Tech',
  internshipDuration: '',
  bondInfo: 'No bond',
  hiringRounds: ['Aptitude', 'Technical Interview', 'HR Interview'],
  deadline: '',
  scheduledAt: '',
  openings: '10',
  allowedResumeFormats: ['PDF', 'DOCX'],
  internshipPreference: 'Preferred',
  preferredCertifications: '',
  preferredTechnologies: '',
  status: 'Open',
};

const steps = [
  { title: 'Company', icon: BriefcaseBusiness },
  { title: 'Eligibility', icon: GraduationCap },
  { title: 'Hiring', icon: CalendarClock },
  { title: 'Review', icon: WandSparkles },
];

function listToText(value) {
  return Array.isArray(value) ? value.join(', ') : String(value || '');
}

function toggleValue(list, value) {
  const current = Array.isArray(list) ? list : [];
  if (value === 'All') return current.includes('All') ? [] : ['All'];
  const withoutAll = current.filter((item) => item !== 'All');
  return withoutAll.includes(value) ? withoutAll.filter((item) => item !== value) : [...withoutAll, value];
}

function fieldClass() {
  return 'h-11 w-full rounded-2xl border border-[var(--pf-border)] bg-white/75 px-4 text-sm text-[var(--pf-text)] outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-200/40 dark:bg-white/5';
}

function textAreaClass() {
  return 'min-h-[132px] w-full rounded-2xl border border-[var(--pf-border)] bg-white/75 p-4 text-sm text-[var(--pf-text)] outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-200/40 dark:bg-white/5';
}

function Label({ children }) {
  return <label className='mb-1.5 block text-sm font-semibold text-[var(--pf-text)]'>{children}</label>;
}

export default function AddCompanyPage() {
  const companies = usePlacementStore((state) => state.companies);
  const students = usePlacementStore((state) => state.students);
  const addCompany = usePlacementStore((state) => state.addCompany);
  const updateCompany = usePlacementStore((state) => state.updateCompany);
  const deleteCompany = usePlacementStore((state) => state.deleteCompany);
  const duplicateCompany = usePlacementStore((state) => state.duplicateCompany);

  const [step, setStep] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => {
    try {
      return { ...initialForm, ...(JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')) };
    } catch {
      return initialForm;
    }
  });
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validation = useMemo(() => {
    const problems = [];
    if (!form.name.trim()) problems.push('Company name is required.');
    if (!form.role.trim()) problems.push('Role is required.');
    if (!Number(form.package) && form.driveType === 'Placement') problems.push('Package is required for placement drives.');
    if (!Number(form.stipend) && form.driveType === 'Internship') problems.push('Stipend is required for internship drives.');
    if (!form.deadline) problems.push('Application deadline is required.');
    if (!listToText(form.requiredSkills)) problems.push('Add at least one required skill.');
    if (!form.eligibleBranches.length) problems.push('Choose eligible branches.');
    return problems;
  }, [form]);

  const previewDrive = useMemo(() => ({
    ...form,
    branch: form.eligibleBranches,
    eligibleBranches: form.eligibleBranches,
  }), [form]);

  const eligibleCount = useMemo(() => {
    return students.filter((student) => {
      const match = calculateJobMatch(student, previewDrive);
      return match.branchEligible && Number(student.cgpa || 0) >= Number(form.eligibility || 0);
    }).length;
  }, [form.eligibility, previewDrive, students]);

  const avgMatch = useMemo(() => {
    if (!students.length) return 0;
    const total = students.reduce((sum, student) => sum + calculateJobMatch(student, previewDrive).matchScore, 0);
    return Math.round(total / students.length);
  }, [previewDrive, students]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setStep(0);
    setError('');
    localStorage.removeItem(DRAFT_KEY);
  };

  const editOpening = (company) => {
    setEditingId(company.id);
    setForm({
      ...initialForm,
      ...company,
      name: company.name || company.company || '',
      package: String(company.package || company.packageLpa || ''),
      stipend: String(company.stipend || ''),
      eligibility: String(company.eligibility || company.minCgpa || ''),
      minAttendance: String(company.minAttendance || 75),
      maxBacklogs: String(company.maxBacklogs || 0),
      openings: String(company.openings || 1),
      eligibleBranches: Array.isArray(company.eligibleBranches) ? company.eligibleBranches : listToText(company.branch || 'All').split(/[,;|]/).map((item) => item.trim()).filter(Boolean),
      requiredSkills: listToText(company.requiredSkills),
      preferredSkills: listToText(company.preferredSkills),
      preferredCertifications: listToText(company.preferredCertifications),
      preferredTechnologies: listToText(company.preferredTechnologies),
      hiringRounds: Array.isArray(company.hiringRounds) ? company.hiringRounds : initialForm.hiringRounds,
      allowedResumeFormats: Array.isArray(company.allowedResumeFormats) ? company.allowedResumeFormats : initialForm.allowedResumeFormats,
    });
    setStep(0);
  };

  const saveOpening = (statusOverride) => {
    if (!statusOverride && validation.length) {
      setError(validation[0]);
      return;
    }

    const payload = {
      ...form,
      status: statusOverride || 'Open',
      branch: form.eligibleBranches,
      eligibleBranches: form.eligibleBranches,
      hiringRounds: form.hiringRounds,
      allowedResumeFormats: form.allowedResumeFormats,
    };
    const result = editingId ? updateCompany(editingId, payload) : addCompany(payload);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setToast(statusOverride === 'Draft' ? 'Draft saved.' : editingId ? 'Opening published to students.' : 'Opening published to students.');
    resetForm();
  };

  const lifecycleAction = (company, status) => {
    const result = updateCompany(company.id, { ...company, status });
    setToast(result.ok ? `Opening marked ${status}.` : result.error);
  };

  const removeOpening = (company) => {
    const result = deleteCompany(company.id);
    setToast(result.ok ? 'Opening deleted.' : result.error);
  };

  const cloneOpening = (company) => {
    const result = duplicateCompany(company.id);
    setToast(result.ok ? 'Opening duplicated as draft.' : result.error);
  };

  return (
    <PageContainer className='space-y-6'>
      <section className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='text-sm font-medium text-[var(--pf-muted)]'>Companies</p>
          <h1 className='mt-2 text-3xl font-semibold tracking-tight text-[var(--pf-text)]'>Create placement and internship drives</h1>
          <p className='mt-2 max-w-2xl text-sm leading-6 text-[var(--pf-muted)]'>
            A guided opening builder with eligibility rules, hiring rounds, autosaved drafts, and instant match estimates.
          </p>
        </div>
        <Button variant='secondary' onClick={resetForm}>
          <Plus className='h-4 w-4' />
          New Opening
        </Button>
      </section>

      {toast ? <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'>{toast}</div> : null}

      <section className='grid gap-5 xl:grid-cols-[1.1fr_0.9fr]'>
        <Card className='p-0'>
          <div className='border-b border-[var(--pf-border)] p-5'>
            <div className='grid gap-3 sm:grid-cols-4'>
              {steps.map((item, index) => {
                const Icon = item.icon;
                const active = index === step;
                const done = index < step;
                return (
                  <button
                    key={item.title}
                    type='button'
                    onClick={() => setStep(index)}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200'
                        : 'border-[var(--pf-border)] bg-white/55 text-[var(--pf-muted)] hover:text-[var(--pf-text)] dark:bg-white/[0.03]'
                    }`}
                  >
                    <span className='grid h-8 w-8 place-items-center rounded-xl bg-white shadow-sm dark:bg-white/10'>
                      {done ? <Check className='h-4 w-4' /> : <Icon className='h-4 w-4' />}
                    </span>
                    {item.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className='p-5'>
            {error ? <p className='mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-200'>{error}</p> : null}

            {step === 0 ? (
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <Label>Drive type</Label>
                  <select className={fieldClass()} value={form.driveType} onChange={(event) => updateField('driveType', event.target.value)}>
                    <option>Placement</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div>
                  <Label>Company name</Label>
                  <Input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder='Microsoft, Amazon, Infosys' />
                </div>
                <div>
                  <Label>Company logo URL</Label>
                  <Input value={form.logoUrl} onChange={(event) => updateField('logoUrl', event.target.value)} placeholder='https://...' />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={form.role} onChange={(event) => updateField('role', event.target.value)} placeholder='Software Engineer Intern' />
                </div>
                <div>
                  <Label>Package / CTC LPA</Label>
                  <Input type='number' min='0' step='0.1' value={form.package} onChange={(event) => updateField('package', event.target.value)} />
                </div>
                <div>
                  <Label>Internship stipend</Label>
                  <Input type='number' min='0' step='1000' value={form.stipend} onChange={(event) => updateField('stipend', event.target.value)} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(event) => updateField('location', event.target.value)} />
                </div>
                <div>
                  <Label>Work type</Label>
                  <select className={fieldClass()} value={form.workType} onChange={(event) => updateField('workType', event.target.value)}>
                    <option>Remote</option>
                    <option>Hybrid</option>
                    <option>Onsite</option>
                  </select>
                </div>
                <div className='md:col-span-2'>
                  <Label>Job description</Label>
                  <textarea className={textAreaClass()} value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder='Responsibilities, expectations, role summary, and selection process.' />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <Label>Batch year</Label>
                  <Input value={form.batchYear} onChange={(event) => updateField('batchYear', event.target.value)} />
                </div>
                <div>
                  <Label>Degree type</Label>
                  <select className={fieldClass()} value={form.degreeType} onChange={(event) => updateField('degreeType', event.target.value)}>
                    <option>B.Tech</option>
                    <option>M.Tech</option>
                    <option>MBA</option>
                    <option>BCA</option>
                    <option>MCA</option>
                  </select>
                </div>
                <div>
                  <Label>Minimum CGPA</Label>
                  <Input type='number' min='0' max='10' step='0.1' value={form.eligibility} onChange={(event) => updateField('eligibility', event.target.value)} />
                </div>
                <div>
                  <Label>Minimum attendance %</Label>
                  <Input type='number' min='0' max='100' value={form.minAttendance} onChange={(event) => updateField('minAttendance', event.target.value)} />
                </div>
                <div>
                  <Label>Maximum active backlogs</Label>
                  <Input type='number' min='0' value={form.maxBacklogs} onChange={(event) => updateField('maxBacklogs', event.target.value)} />
                </div>
                <div>
                  <Label>Gender preference</Label>
                  <select className={fieldClass()} value={form.genderPreference} onChange={(event) => updateField('genderPreference', event.target.value)}>
                    <option>Any</option>
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </div>
                <div className='md:col-span-2'>
                  <Label>Eligible branches</Label>
                  <div className='flex flex-wrap gap-2'>
                    {BRANCHES.map((branch) => (
                      <button
                        key={branch}
                        type='button'
                        onClick={() => updateField('eligibleBranches', toggleValue(form.eligibleBranches, branch))}
                        className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                          form.eligibleBranches.includes(branch)
                            ? 'border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200'
                            : 'border-[var(--pf-border)] bg-white/60 text-[var(--pf-muted)] hover:text-[var(--pf-text)] dark:bg-white/5'
                        }`}
                      >
                        {branch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <Label>Required skills</Label>
                  <Input value={form.requiredSkills} onChange={(event) => updateField('requiredSkills', event.target.value)} placeholder='DSA, React, SQL' />
                </div>
                <div>
                  <Label>Preferred skills</Label>
                  <Input value={form.preferredSkills} onChange={(event) => updateField('preferredSkills', event.target.value)} placeholder='Docker, AWS, System Design' />
                </div>
                <div>
                  <Label>Preferred certifications</Label>
                  <Input value={form.preferredCertifications} onChange={(event) => updateField('preferredCertifications', event.target.value)} placeholder='AWS, NPTEL, Coursera' />
                </div>
                <div>
                  <Label>Preferred technologies</Label>
                  <Input value={form.preferredTechnologies} onChange={(event) => updateField('preferredTechnologies', event.target.value)} placeholder='Git, PostgreSQL, Firebase' />
                </div>
                <div>
                  <Label>Application deadline</Label>
                  <Input type='date' value={form.deadline} onChange={(event) => updateField('deadline', event.target.value)} />
                </div>
                <div>
                  <Label>Schedule date</Label>
                  <Input type='datetime-local' value={form.scheduledAt} onChange={(event) => updateField('scheduledAt', event.target.value)} />
                </div>
                <div>
                  <Label>Number of openings</Label>
                  <Input type='number' min='1' value={form.openings} onChange={(event) => updateField('openings', event.target.value)} />
                </div>
                <div>
                  <Label>Internship duration</Label>
                  <Input value={form.internshipDuration} onChange={(event) => updateField('internshipDuration', event.target.value)} placeholder='6 months' />
                </div>
                <div>
                  <Label>Bond information</Label>
                  <Input value={form.bondInfo} onChange={(event) => updateField('bondInfo', event.target.value)} />
                </div>
                <div>
                  <Label>Internship preference</Label>
                  <select className={fieldClass()} value={form.internshipPreference} onChange={(event) => updateField('internshipPreference', event.target.value)}>
                    <option>Not Required</option>
                    <option>Preferred</option>
                    <option>Required</option>
                  </select>
                </div>
                <ChoiceGroup title='Hiring rounds' values={ROUND_OPTIONS} selected={form.hiringRounds} onChange={(value) => updateField('hiringRounds', toggleValue(form.hiringRounds, value))} />
                <ChoiceGroup title='Allowed resume formats' values={RESUME_FORMATS} selected={form.allowedResumeFormats} onChange={(value) => updateField('allowedResumeFormats', toggleValue(form.allowedResumeFormats, value))} />
              </div>
            ) : null}

            {step === 3 ? (
              <div className='grid gap-4 lg:grid-cols-[1fr_0.85fr]'>
                <div className='rounded-3xl border border-[var(--pf-border)] bg-white/60 p-5 dark:bg-white/[0.03]'>
                  <p className='text-sm font-semibold text-[var(--pf-muted)]'>Opening preview</p>
                  <div className='mt-4 flex items-start gap-3'>
                    <CompanyAvatar name={form.name} logoUrl={form.logoUrl} />
                    <div>
                      <h2 className='text-2xl font-semibold text-[var(--pf-text)]'>{form.name || 'Company name'}</h2>
                      <p className='mt-1 text-sm text-[var(--pf-muted)]'>{form.role || 'Role title'} · {form.driveType}</p>
                    </div>
                  </div>
                  <p className='mt-4 text-sm leading-6 text-[var(--pf-muted)]'>{form.description || 'Add a clear role description so students understand the opportunity.'}</p>
                  <div className='mt-5 grid gap-3 sm:grid-cols-2'>
                    <PreviewMetric label='CTC' value={`${form.package || 0} LPA`} />
                    <PreviewMetric label='Stipend' value={`₹${form.stipend || 0}`} />
                    <PreviewMetric label='Eligible students' value={eligibleCount} />
                    <PreviewMetric label='Average match' value={`${avgMatch}%`} />
                  </div>
                </div>
                <div className='rounded-3xl border border-[var(--pf-border)] bg-gradient-to-br from-sky-50 to-cyan-50 p-5 dark:from-sky-400/10 dark:to-cyan-400/10'>
                  <p className='font-semibold text-[var(--pf-text)]'>Validation</p>
                  <div className='mt-4 space-y-2'>
                    {(validation.length ? validation : ['Opening is ready to publish.']).map((item) => (
                      <p key={item} className={`rounded-2xl px-3 py-2 text-sm ${validation.length ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200'}`}>
                        {item}
                      </p>
                    ))}
                  </div>
                  <div className='mt-5 space-y-2 text-sm text-[var(--pf-muted)]'>
                    <p><MapPin className='mr-2 inline h-4 w-4' />{form.location} · {form.workType}</p>
                    <p>Branches: {form.eligibleBranches.join(', ') || 'Not selected'}</p>
                    <p>Rounds: {form.hiringRounds.join(', ') || 'Not selected'}</p>
                    <p>Formats: {form.allowedResumeFormats.join(', ') || 'Not selected'}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className='mt-6 flex flex-wrap justify-between gap-2 border-t border-[var(--pf-border)] pt-5'>
              <Button type='button' variant='secondary' onClick={() => saveOpening('Draft')}>
                <Save className='h-4 w-4' />
                Save Draft
              </Button>
              <div className='flex gap-2'>
                <Button type='button' variant='secondary' disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button>
                {step < steps.length - 1 ? (
                  <Button type='button' onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>Continue</Button>
                ) : (
                  <Button type='button' onClick={() => saveOpening()}>
                    <Check className='h-4 w-4' />
                    {editingId ? 'Update Opening' : 'Publish Opening'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className='space-y-4'>
          <Card>
            <p className='text-sm font-semibold text-[var(--pf-muted)]'>Live estimate</p>
            <div className='mt-4 grid grid-cols-2 gap-3'>
              <PreviewMetric label='Eligible' value={eligibleCount} />
              <PreviewMetric label='Avg match' value={`${avgMatch}%`} />
              <PreviewMetric label='Openings' value={form.openings || 0} />
              <PreviewMetric label='Deadline' value={form.deadline || 'Set date'} />
            </div>
          </Card>

          <Card>
            <p className='text-sm font-semibold text-[var(--pf-muted)]'>Existing openings</p>
            <div className='mt-4 space-y-3'>
              {companies.map((company) => (
                <div key={company.id} className='rounded-2xl border border-[var(--pf-border)] bg-white/55 p-3 dark:bg-white/[0.03]'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex min-w-0 items-start gap-3'>
                      <CompanyAvatar name={company.name} logoUrl={company.logoUrl} compact />
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-semibold text-[var(--pf-text)]'>{company.name}</p>
                        <p className='truncate text-xs text-[var(--pf-muted)]'>{company.role} · {company.package || company.packageLpa || 0} LPA</p>
                      </div>
                    </div>
                    <span className='rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-400/10 dark:text-sky-200'>{company.status || 'Open'}</span>
                  </div>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <IconButton label='Edit' onClick={() => editOpening(company)} icon={Edit3} />
                    <IconButton label='Duplicate' onClick={() => cloneOpening(company)} icon={Copy} />
                    <IconButton label='Close' onClick={() => lifecycleAction(company, 'Closed')} icon={CalendarClock} />
                    <IconButton label='Delete' onClick={() => removeOpening(company)} icon={Trash2} danger />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </PageContainer>
  );
}

function ChoiceGroup({ title, values, selected, onChange }) {
  return (
    <div className='md:col-span-2'>
      <Label>{title}</Label>
      <div className='flex flex-wrap gap-2'>
        {values.map((value) => (
          <button
            key={value}
            type='button'
            onClick={() => onChange(value)}
            className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
              selected.includes(value)
                ? 'border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200'
                : 'border-[var(--pf-border)] bg-white/60 text-[var(--pf-muted)] hover:text-[var(--pf-text)] dark:bg-white/5'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function CompanyAvatar({ name, logoUrl, compact = false }) {
  const size = compact ? 'h-9 w-9 rounded-xl text-xs' : 'h-14 w-14 rounded-2xl text-lg';
  if (logoUrl) {
    return <img src={logoUrl} alt='' className={`${size} object-cover ring-1 ring-[var(--pf-border)]`} />;
  }
  return (
    <span className={`${size} grid shrink-0 place-items-center bg-gradient-to-br from-sky-400 to-teal-300 font-bold text-white shadow-lg shadow-sky-400/20`}>
      {(name || 'P').slice(0, 1).toUpperCase()}
    </span>
  );
}

function PreviewMetric({ label, value }) {
  return (
    <div className='rounded-2xl border border-[var(--pf-border)] bg-white/65 p-3 dark:bg-white/5'>
      <p className='text-xs font-semibold uppercase tracking-wide text-[var(--pf-muted)]'>{label}</p>
      <p className='mt-1 text-xl font-semibold text-[var(--pf-text)]'>{value}</p>
    </div>
  );
}

function IconButton({ label, icon: IconComponent, onClick, danger = false }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 ${
        danger
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200'
          : 'border-[var(--pf-border)] bg-white/70 text-[var(--pf-muted)] hover:text-[var(--pf-text)] dark:bg-white/5'
      }`}
    >
      {createElement(IconComponent, { className: 'h-3.5 w-3.5' })}
      {label}
    </button>
  );
}
