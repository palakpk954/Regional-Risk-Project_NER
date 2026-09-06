import {
  Camera,
  CheckCircle2,
  Clock3,
  FileUp,
  KeyRound,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  Play,
  Send,
  Sparkles,
  Square,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import PageContainer from '../components/PageContainer';
import { evaluateInterview, generateInterviewQuestions } from '../services/mockInterviewService';
import { inferStudentProfile } from '../services/jobMatchService';
import { parseResumeSignals } from '../services/predictionService';
import { usePlacementStore } from '../store/usePlacementStore';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function StepPill({ active, done, label }) {
  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
      done
        ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100'
        : active
          ? 'border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100'
          : 'border-white/10 bg-white/[0.035] text-slate-400'
    }`}>
      {done ? <CheckCircle2 className='h-3.5 w-3.5' /> : <span className='h-2 w-2 rounded-full bg-current' />}
      {label}
    </div>
  );
}

function ScoreCard({ label, value, tone = '#5eead4' }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <Card>
      <p className='text-sm text-slate-400'>{label}</p>
      <p className='mt-2 text-4xl font-bold text-white'>{safe}</p>
      <div className='mt-4 h-2 rounded-full bg-white/10'>
        <div className='h-2 rounded-full' style={{ width: `${safe}%`, background: tone }} />
      </div>
    </Card>
  );
}

export default function MockInterviewPage() {
  const auth = usePlacementStore((state) => state.auth);
  const students = usePlacementStore((state) => state.students);
  const currentStudentId = usePlacementStore((state) => state.currentStudentId);
  const companies = usePlacementStore((state) => state.companies);

  const currentStudent = useMemo(
    () => students.find((student) => student.id === currentStudentId) || students[0] || {},
    [currentStudentId, students],
  );
  const baseProfile = useMemo(() => inferStudentProfile(currentStudent), [currentStudent]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  const [phase, setPhase] = useState('resume');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeSignals, setResumeSignals] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState('');

  const [role, setRole] = useState(companies[0]?.role || 'Software Engineer Intern');
  const [jobDescription, setJobDescription] = useState(companies[0]?.description || 'Campus placement role focused on DSA, projects, communication, and role-specific fundamentals.');
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('placify-mock-gemini-key') || '';
    } catch {
      return '';
    }
  });

  const [cameraOn, setCameraOn] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [draft, setDraft] = useState('');
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [source, setSource] = useState('not-run');
  const [startedAt, setStartedAt] = useState(null);
  const [interviewError, setInterviewError] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try {
      return localStorage.getItem('placify-mock-voice') !== 'off';
    } catch {
      return true;
    }
  });
  const [speaking, setSpeaking] = useState(false);

  const profile = useMemo(() => {
    const mergedSkills = [...new Set([...(baseProfile.skills || []), ...(resumeSignals?.skills || []), ...(resumeSignals?.technologies || [])])];
    return {
      ...baseProfile,
      name: auth?.name || resumeSignals?.inferred_name || baseProfile.name,
      skills: mergedSkills,
      projects: resumeSignals?.no_of_projects ?? baseProfile.projects,
      internships: resumeSignals?.internships ?? baseProfile.internships,
      resumeScore: resumeSignals?.resumeScore ?? currentStudent.resumeScore ?? 0,
      atsScore: resumeSignals?.atsScore ?? currentStudent.atsScore ?? 0,
      certifications: resumeSignals?.certifications || [],
    };
  }, [auth?.name, baseProfile, currentStudent.atsScore, currentStudent.resumeScore, resumeSignals]);

  const activeQuestion = questions[activeIndex];
  const progress = questions.length ? Math.round(((activeIndex + 1) / questions.length) * 100) : 0;

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      recognitionRef.current?.stop?.();
      window.speechSynthesis?.cancel?.();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn, phase]);

  const speakQuestion = useCallback((text) => {
    const nextText = text || activeQuestion?.question;
    if (!nextText || typeof window === 'undefined' || !window.speechSynthesis) {
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(nextText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.08;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [activeQuestion]);

  useEffect(() => {
    if (phase !== 'interview' || !activeQuestion || !voiceEnabled) return undefined;
    speakQuestion(activeQuestion.question);
    return () => window.speechSynthesis?.cancel?.();
  }, [activeQuestion, phase, speakQuestion, voiceEnabled]);

  const toggleVoice = () => {
    setVoiceEnabled((current) => {
      const next = !current;
      try {
        localStorage.setItem('placify-mock-voice', next ? 'on' : 'off');
      } catch {
        // Voice preference is optional.
      }
      if (!next) {
        window.speechSynthesis?.cancel?.();
        setSpeaking(false);
      } else if (activeQuestion?.question) {
        speakQuestion(activeQuestion.question);
      }
      return next;
    });
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;
    setResumeFile(file);
    setResumeError('');
    setResumeLoading(true);
    try {
      const parsed = await parseResumeSignals(file);
      setResumeSignals(parsed);
      setPhase('device');
    } catch (error) {
      setResumeError(error.message || 'Resume parser could not read this file.');
    } finally {
      setResumeLoading(false);
    }
  };

  const enableDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setMicReady(true);
    } catch {
      setCameraOn(false);
      setMicReady(false);
    }
  };

  const startRecognition = () => {
    if (!SpeechRecognition) {
      setTranscript('Speech recognition is not supported in this browser. Type your answer instead.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += text;
        else interimText += text;
      }
      if (finalText) {
        setDraft((current) => `${current}${current ? ' ' : ''}${finalText.trim()}`.trim());
      }
      setTranscript(interimText);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopRecognition = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
    setTranscript('');
  };

  const beginInterview = async () => {
    setLoadingQuestions(true);
    setResult(null);
    setInterviewError('');
    try {
      const response = await generateInterviewQuestions({
        role,
        profile,
        focusAreas: ['Resume', 'Projects', 'DSA', 'Communication', 'Behavioral'],
        jobDescription,
        apiKey,
      });
      setQuestions(response.questions);
      setSource(response.source || 'backend');
      setActiveIndex(0);
      setAnswers([]);
      setDraft('');
      setTranscript('');
      setStartedAt(Date.now());
      setPhase('interview');
    } catch (error) {
      setInterviewError(error.message || 'Could not start interview. Local fallback should recover on retry.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const saveAnswerAndNext = () => {
    if (!activeQuestion) return;
    const nextAnswer = {
      question: activeQuestion.question,
      type: activeQuestion.type,
      answer: draft.trim(),
      timestamp: new Date().toISOString(),
    };
    setAnswers((current) => {
      const copy = [...current];
      copy[activeIndex] = nextAnswer;
      return copy;
    });
    setDraft('');
    setTranscript('');
    if (activeIndex < questions.length - 1) setActiveIndex((value) => value + 1);
  };

  const finishInterview = async () => {
    stopRecognition();
    window.speechSynthesis?.cancel?.();
    setSpeaking(false);
    setEvaluating(true);
    setInterviewError('');
    const mergedAnswers = [...answers];
    if (activeQuestion && draft.trim()) {
      mergedAnswers[activeIndex] = {
        question: activeQuestion.question,
        type: activeQuestion.type,
        answer: draft.trim(),
        timestamp: new Date().toISOString(),
      };
    }
    try {
      const response = await evaluateInterview({
        role,
        profile,
        answers: mergedAnswers.filter(Boolean),
        jobDescription,
        apiKey,
        durationSeconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0,
      });
      setAnswers(mergedAnswers);
      setResult(response);
      setSource(response.source || source);
      setPhase('result');
    } catch (error) {
      setInterviewError(error.message || 'Could not evaluate interview. Please retry.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <PageContainer className='space-y-5'>
      <section className='relative overflow-hidden rounded-[28px] border border-white/10 bg-[#070b18] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.34)] lg:p-7'>
        <div className='manga-speed-lines opacity-70' />
        <div className='relative flex flex-wrap items-center justify-between gap-5'>
          <div>
            <span className='inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-1 text-xs font-semibold text-fuchsia-100'>
              <Zap className='h-3.5 w-3.5' />
              AI Mock Interview Studio
            </span>
            <h1 className='mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl'>Practice like a real placement round</h1>
            <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-400'>
              Upload resume, verify camera and mic, answer role-aware questions, then get honest feedback with weak topics and score reasons.
            </p>
          </div>
          <div className='manga-card relative min-w-[260px] rounded-3xl border border-fuchsia-300/20 bg-white/[0.045] p-5'>
            <div className='flex justify-between gap-2'>
              <StepPill label='Resume' active={phase === 'resume'} done={Boolean(resumeSignals)} />
              <StepPill label='Devices' active={phase === 'device'} done={cameraOn && micReady} />
              <StepPill label='Interview' active={phase === 'interview'} done={phase === 'result'} />
            </div>
            <div className='manga-aura mx-auto mt-5 grid h-24 w-24 place-items-center rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10'>
              <MonitorUp className='h-10 w-10 text-fuchsia-100' />
            </div>
            <p className='mt-4 text-center text-xs text-slate-500'>Engine: {source}</p>
          </div>
        </div>
      </section>

      {phase === 'resume' ? (
        <section className='mx-auto max-w-5xl rounded-[28px] border border-white/10 bg-[#0d1728]/90 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.24)]'>
          <div className='rounded-3xl bg-gradient-to-r from-violet-500 to-fuchsia-400 p-6 text-white'>
            <div className='flex items-center gap-4'>
              <FileUp className='h-9 w-9' />
              <div>
                <h2 className='text-2xl font-semibold'>Upload Resume</h2>
                <p className='text-sm text-white/80'>Questions become sharper when the interviewer can inspect projects, skills, and internships.</p>
              </div>
            </div>
          </div>

          <label className='mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-500/40 bg-slate-950/45 px-6 py-12 text-center transition hover:border-fuchsia-300/60 hover:bg-fuchsia-300/[0.045]'>
            {resumeLoading ? <Loader2 className='h-9 w-9 animate-spin text-fuchsia-200' /> : <FileUp className='h-9 w-9 text-slate-300' />}
            <span className='mt-3 text-lg font-semibold text-white'>{resumeFile ? resumeFile.name : 'Click to upload resume'}</span>
            <span className='mt-1 text-sm text-slate-400'>PDF, DOC, DOCX, TXT, MD, PNG, JPG, WEBP, BMP, TIFF</span>
            <input
              type='file'
              accept='.pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff'
              className='hidden'
              onChange={(event) => void handleResumeUpload(event.target.files?.[0])}
            />
          </label>

          {resumeError ? <p className='mt-4 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100'>{resumeError}</p> : null}
        </section>
      ) : null}

      {phase === 'device' ? (
        <section className='mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1728]/90 shadow-[0_18px_70px_rgba(0,0,0,0.24)]'>
          <div className='h-2 bg-white/10'>
            <div className='h-2 w-2/3 rounded-r-full bg-gradient-to-r from-violet-500 to-fuchsia-400' />
          </div>
          <div className='bg-gradient-to-r from-violet-500 to-fuchsia-400 p-6 text-white'>
            <div className='flex items-center gap-4'>
              <Camera className='h-9 w-9' />
              <div>
                <h2 className='text-2xl font-semibold'>Device Setup</h2>
                <p className='text-sm text-white/80'>Check camera, microphone, API key, and role context before starting.</p>
              </div>
            </div>
          </div>

          <div className='grid gap-5 p-6 lg:grid-cols-[1fr_0.9fr]'>
            <div className='space-y-4'>
              <div className='overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60'>
                {cameraOn ? (
                  <video ref={videoRef} autoPlay muted playsInline className='aspect-video w-full object-cover' />
                ) : (
                  <div className='grid aspect-video place-items-center text-center'>
                    <VideoOff className='mx-auto h-10 w-10 text-slate-500' />
                    <p className='mt-2 text-sm text-slate-400'>Camera preview is off</p>
                  </div>
                )}
              </div>
              <div className='grid gap-3 sm:grid-cols-3'>
                <StatusTile icon={cameraOn ? Video : VideoOff} label='Camera' value={cameraOn ? 'Ready' : 'Pending'} ok={cameraOn} />
                <StatusTile icon={micReady ? Mic : MicOff} label='Microphone' value={micReady ? 'Ready' : 'Pending'} ok={micReady} />
                <StatusTile icon={resumeSignals ? CheckCircle2 : FileUp} label='Resume' value={resumeSignals ? `${resumeSignals.resumeScore || 0}/100` : 'Missing'} ok={Boolean(resumeSignals)} />
              </div>
              <Button onClick={enableDevices} variant='secondary'>
                <Camera className='h-4 w-4' />
                Enable camera and mic
              </Button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm text-slate-300'>Target role</label>
                <Input value={role} onChange={(event) => setRole(event.target.value)} />
              </div>
              <div>
                <label className='mb-1 flex items-center gap-2 text-sm text-slate-300'>
                  <KeyRound className='h-4 w-4 text-fuchsia-200' />
                  Gemini API key
                </label>
                <Input
                  type='password'
                  value={apiKey}
                  placeholder='Optional, fallback works without it'
                  onChange={(event) => {
                    const next = event.target.value;
                    setApiKey(next);
                    try {
                      localStorage.setItem('placify-mock-gemini-key', next);
                    } catch {
                      // Browser storage may be unavailable.
                    }
                  }}
                />
              </div>
              <div>
                <label className='mb-1 block text-sm text-slate-300'>Job description</label>
                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  className='min-h-[150px] w-full rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-300/20'
                />
              </div>
              <div className='rounded-2xl border border-white/10 bg-white/[0.035] p-4'>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Resume signals</p>
                <p className='mt-2 text-sm text-slate-300'>
                  {profile.skills.slice(0, 8).join(', ') || 'Skills not detected'} • {profile.projects || 0} projects • ATS {profile.atsScore || profile.resumeScore || 0}/100
                </p>
              </div>
              <Button onClick={beginInterview} disabled={loadingQuestions || !resumeSignals} className='w-full'>
                {loadingQuestions ? <Loader2 className='h-4 w-4 animate-spin' /> : <Play className='h-4 w-4' />}
                Start Interview
              </Button>
              {interviewError ? <p className='rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100'>{interviewError}</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {phase === 'interview' ? (
        <section className='grid gap-5 xl:grid-cols-[0.9fr_1.1fr]'>
          <Card className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Interview room</p>
                <h2 className='mt-1 text-xl font-semibold text-white'>{role}</h2>
              </div>
              <span className='rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-1 text-xs font-semibold text-fuchsia-100'>
                {progress}% complete
              </span>
            </div>

            <div className='overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60'>
              {cameraOn ? (
                <video ref={videoRef} autoPlay muted playsInline className='aspect-video w-full object-cover' />
              ) : (
                <div className='grid aspect-video place-items-center text-center'>
                  <VideoOff className='mx-auto h-10 w-10 text-slate-500' />
                  <p className='mt-2 text-sm text-slate-400'>Camera unavailable</p>
                </div>
              )}
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <Button variant={listening ? 'danger' : 'secondary'} onClick={listening ? stopRecognition : startRecognition}>
                {listening ? <Square className='h-4 w-4' /> : <Mic className='h-4 w-4' />}
                {listening ? 'Stop transcript' : 'Start transcript'}
              </Button>
              <Button variant='secondary' onClick={toggleVoice}>
                {voiceEnabled ? <Volume2 className='h-4 w-4' /> : <VolumeX className='h-4 w-4' />}
                {speaking ? 'Speaking...' : voiceEnabled ? 'Voice on' : 'Voice off'}
              </Button>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <Button variant='secondary' onClick={() => speakQuestion()} disabled={!activeQuestion}>
                <Volume2 className='h-4 w-4' />
                Replay question
              </Button>
              <Button variant='secondary' onClick={finishInterview} disabled={evaluating}>
                {evaluating ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
                Finish
              </Button>
            </div>

            <div className='rounded-2xl border border-white/10 bg-white/[0.035] p-4'>
              <p className='flex items-center gap-2 text-sm font-semibold text-white'>
                <Clock3 className='h-4 w-4 text-teal-200' />
                Live transcript
              </p>
              <p className='mt-2 min-h-12 text-sm leading-6 text-slate-400'>
                {transcript || (listening ? 'Listening...' : 'Start transcript to capture speech here.')}
              </p>
            </div>
          </Card>

          <Card className='space-y-5'>
            <div className='h-2 rounded-full bg-white/10'>
              <div className='h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400' style={{ width: `${progress}%` }} />
            </div>
            <div>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Question {activeIndex + 1} of {questions.length}</p>
              <h2 className='mt-2 text-2xl font-semibold leading-9 text-white'>{activeQuestion?.question}</h2>
              <div className='mt-4 flex flex-wrap gap-2'>
                {(activeQuestion?.expectedSignals || []).map((signal) => (
                  <span key={signal} className='rounded-full border border-teal-300/20 bg-teal-300/10 px-2 py-1 text-xs text-teal-100'>
                    {signal}
                  </span>
                ))}
              </div>
            </div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder='Your transcribed or typed answer will appear here...'
              className='min-h-[260px] w-full rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-300/20'
            />
            <div className='flex flex-wrap justify-between gap-3'>
              <Button variant='secondary' disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}>
                Previous
              </Button>
              <Button onClick={saveAnswerAndNext} disabled={!draft.trim()}>
                {activeIndex === questions.length - 1 ? 'Save answer' : 'Save and next'}
              </Button>
            </div>
          </Card>
        </section>
      ) : null}

      {phase === 'result' && result ? (
        <section className='space-y-5'>
          <div className='grid gap-4 lg:grid-cols-3'>
            <ScoreCard label='Confidence' value={result.confidenceScore} tone='#a78bfa' />
            <ScoreCard label='Communication' value={result.communicationScore} tone='#5eead4' />
            <ScoreCard label='Technical readiness' value={result.technicalReadinessScore} tone='#38bdf8' />
          </div>
          <div className='grid gap-4 lg:grid-cols-2'>
            <ResultList title='Strengths' items={result.strengths} tone='emerald' />
            <ResultList title='Improvements' items={result.improvements} tone='amber' />
            <ResultList title='Weak topics' items={result.weakTopics} tone='rose' />
            <ResultList title='Score reasons' items={result.scoreReasons} tone='sky' />
          </div>
          <Card>
            <h2 className='text-lg font-semibold text-white'>Feedback Summary</h2>
            <p className='mt-3 text-sm leading-6 text-slate-300'>{result.feedback}</p>
            <div className='mt-4 flex flex-wrap gap-2'>
              <Button onClick={() => setPhase('device')} variant='secondary'>Retake Setup</Button>
              <Button onClick={() => {
                setPhase('interview');
                setActiveIndex(0);
                setDraft('');
                setResult(null);
              }}>
                Retry Interview
              </Button>
            </div>
          </Card>
        </section>
      ) : null}
    </PageContainer>
  );
}

function StatusTile({ icon: Icon, label, value, ok }) {
  return (
    <div className={`rounded-2xl border p-3 ${ok ? 'border-emerald-300/20 bg-emerald-300/10' : 'border-white/10 bg-white/[0.035]'}`}>
      {createElement(Icon, { className: `h-5 w-5 ${ok ? 'text-emerald-200' : 'text-slate-500'}` })}
      <p className='mt-2 text-sm font-semibold text-white'>{label}</p>
      <p className='text-xs text-slate-400'>{value}</p>
    </div>
  );
}

function ResultList({ title, items = [], tone }) {
  const toneClass = {
    emerald: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
    amber: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
    rose: 'border-rose-300/20 bg-rose-300/10 text-rose-100',
    sky: 'border-sky-300/20 bg-sky-300/10 text-sky-100',
  }[tone];

  return (
    <Card>
      <h3 className='font-semibold text-white'>{title}</h3>
      <div className='mt-3 space-y-2'>
        {(items.length ? items : ['Not enough answer data generated for this section.']).map((item) => (
          <p key={item} className={`rounded-2xl border px-3 py-2 text-sm ${toneClass}`}>
            {item}
          </p>
        ))}
      </div>
    </Card>
  );
}
