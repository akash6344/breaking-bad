import { FormEvent, useMemo, useState } from 'react';
import { requestCoach } from './lib/coach';
import { clearBreakFreeData, daysSinceGoalStarted, loadCheckIns, loadProfile, recentCheckIns, saveCheckIns, saveProfile } from './lib/storage';
import type { CheckIn, CoachSource, HabitProfile, NudgeResponse, SOSResponse, WeeklySummary } from './types';

const today = () => new Date().toISOString().slice(0, 10);

function Onboarding({ onComplete }: { onComplete: (profile: HabitProfile) => void }) {
  const [form, setForm] = useState({ habitName: '', trigger: '', goal: '', riskTime: '' });
  const [error, setError] = useState('');
  const update = (name: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    if (Object.values(form).some((value) => !value.trim())) return setError('Please complete all four fields.');
    onComplete({ ...form, startDate: today() });
  }

  return <main className="onboarding-shell">
    <section className="hero" aria-labelledby="welcome-title">
      <p className="eyebrow">BreakFree</p>
      <h1 id="welcome-title">Make the next right choice.</h1>
      <p>Personalized, non-judgmental support for the moments a habit feels hardest to change.</p>
      {/* <p className="fine-print">BreakFree is not therapy or emergency care. In immediate danger, contact local emergency services or someone you trust.</p> */}
    </section>
    <form className="profile-form" onSubmit={submit}>
      <h2>Set up your support plan</h2>
      <p>These details stay in this browser and shape your coaching.</p>
      <label htmlFor="habit-name">Habit you want to change <span aria-hidden="true">*</span></label>
      <input id="habit-name" value={form.habitName} onChange={(event) => update('habitName', event.target.value)} maxLength={160} placeholder="Late-night phone scrolling" required autoFocus />
      <label htmlFor="common-trigger">Most common trigger <span aria-hidden="true">*</span></label>
      <input id="common-trigger" value={form.trigger} onChange={(event) => update('trigger', event.target.value)} maxLength={160} placeholder="Stress after work" required />
      <label htmlFor="goal">Your goal <span aria-hidden="true">*</span></label>
      <textarea id="goal" className="goal-input" value={form.goal} onChange={(event) => update('goal', event.target.value)} maxLength={160} placeholder="Read before bed instead" required aria-describedby="goal-hint" />
      <span id="goal-hint" className="field-hint">Use a specific action you can recognize, such as “Read for 10 minutes before bed.”</span>
      <label htmlFor="risk-time">High-risk time <span aria-hidden="true">*</span></label>
      <input id="risk-time" value={form.riskTime} onChange={(event) => update('riskTime', event.target.value)} maxLength={160} placeholder="After 9pm" required />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary" type="submit">Create my plan</button>
    </form>
  </main>;
}

function SourceNotice({ source }: { source: CoachSource }) {
  return source === 'offline'
    ? <p className="offline-note" role="status">Offline guidance is showing while the AI coach is unavailable.</p>
    : <p className="ai-note" role="status">Personalized by the AI coach.</p>;
}

function SOSCard({ response, source }: { response: SOSResponse; source: CoachSource }) {
  return <section className="coach-card" aria-live="polite">
    <SourceNotice source={source} />
    <h2>{response.acknowledgment}</h2>
    <div><h3>Ride the wave</h3><p>{response.urgeSurfing}</p></div>
    <div><h3>Do this now</h3><p>{response.replacementAction}</p></div>
    <div><h3>A thought to hold</h3><p>{response.cognitiveReframe}</p></div>
    {response.intensityAdvice && <p className="intensity-advice">{response.intensityAdvice}</p>}
  </section>;
}

function BreathingLoader() {
  return <div className="breathing" aria-live="polite" aria-label="Your coach is preparing a response">
    <span>Inhale</span><strong>4</strong><span>Exhale slowly</span>
  </div>;
}

function RangeField({ id, label, value, min, max, minLabel, maxLabel, onChange }: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  onChange: (value: number) => void;
}) {
  return <div className="range-field">
    <label htmlFor={id}>{label} <output htmlFor={id}>{value}/{max}</output></label>
    <input id={id} aria-label={`${label} from ${min} to ${max}`} type="range" min={min} max={max} step={1} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    <div className="range-labels" aria-hidden="true"><span>{minLabel}</span><span>{maxLabel}</span></div>
  </div>;
}

function CheckInForm({ profile, history, onSaved }: { profile: HabitProfile; history: CheckIn[]; onSaved: (checkIn: CheckIn, result: NudgeResponse, source: CoachSource) => void }) {
  const [mood, setMood] = useState(3);
  const [trigger, setTrigger] = useState('');
  const [resisted, setResisted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [triggerError, setTriggerError] = useState('');
  const [resistedError, setResistedError] = useState('');
  const [requestError, setRequestError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextTriggerError = trigger.trim() ? '' : 'Describe what triggered you today.';
    const nextResistedError = resisted === null ? 'Choose what happened today.' : '';
    setTriggerError(nextTriggerError);
    setResistedError(nextResistedError);
    setRequestError('');
    if (nextTriggerError || nextResistedError || resisted === null) return;

    setLoading(true);
    try {
      const payload = { mood, trigger: trigger.trim(), resisted };
      const result = await requestCoach<NudgeResponse>({ action: 'checkin', profile, checkIn: payload, history });
      onSaved({ id: crypto.randomUUID(), date: today(), ...payload }, result.data, result.source);
      setTrigger('');
      setResisted(null);
    } catch (caught) {
      setRequestError(caught instanceof Error ? caught.message : 'Please try again.');
    } finally { setLoading(false); }
  }

  return <section className="panel checkin-panel" aria-labelledby="checkin-title">
    <div><p className="eyebrow">Daily check-in</p><h2 id="checkin-title">Notice the pattern, without judgment.</h2></div>
    <form onSubmit={submit} noValidate>
      <RangeField id="mood" label="Mood" value={mood} min={1} max={5} minLabel="Low" maxLabel="Good" onChange={setMood} />
      <label htmlFor="checkin-trigger">What triggered you? <span aria-hidden="true">*</span></label>
      <input
        id="checkin-trigger"
        value={trigger}
        maxLength={160}
        onBlur={() => !trigger.trim() && setTriggerError('Describe what triggered you today.')}
        onChange={(event) => { setTrigger(event.target.value); if (event.target.value.trim()) setTriggerError(''); }}
        placeholder="A difficult conversation"
        required
        aria-invalid={Boolean(triggerError)}
        aria-describedby={triggerError ? 'trigger-error' : undefined}
      />
      {triggerError && <p id="trigger-error" className="form-error" role="alert">{triggerError}</p>}
      <fieldset className="choice-field" aria-describedby={resistedError ? 'resisted-error' : undefined}>
        <legend>Were you able to pause or resist? <span aria-hidden="true">*</span></legend>
        <label><input type="radio" name="resisted" checked={resisted === true} onChange={() => { setResisted(true); setResistedError(''); }} /> Yes</label>
        <label><input type="radio" name="resisted" checked={resisted === false} onChange={() => { setResisted(false); setResistedError(''); }} /> Not this time</label>
      </fieldset>
      {resistedError && <p id="resisted-error" className="form-error" role="alert">{resistedError}</p>}
      {requestError && <p className="form-error" role="alert">{requestError}</p>}
      <button className="secondary" type="submit" disabled={loading} aria-busy={loading}>{loading ? 'Getting your nudge…' : 'Save check-in & get a nudge'}</button>
    </form>
  </section>;
}

function NudgeCard({ response, source }: { response: NudgeResponse; source: CoachSource }) {
  return <section className="nudge-card" aria-live="polite"><SourceNotice source={source} /><h2>Your next small step</h2><p>{response.insight}</p><strong>{response.nudge}</strong><blockquote>{response.ifThenPlan}</blockquote><p>{response.nextCheckinReminder}</p></section>;
}

function WeeklyCard({ response, source }: { response: WeeklySummary; source: CoachSource }) {
  return <section className="weekly-card" aria-live="polite"><SourceNotice source={source} /><p className={`trend ${response.trend}`}>{response.trend}</p><h2>Weekly perspective</h2><p>{response.keyInsight}</p><dl><div><dt>Strongest signal</dt><dd>{response.strongestDay}</dd></div><div><dt>Watch for</dt><dd>{response.watchOutFor}</dd></div></dl><p>{response.encouragement}</p></section>;
}

export default function App() {
  const [profile, setProfile] = useState<HabitProfile | null>(() => loadProfile());
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => loadCheckIns());
  const [intensity, setIntensity] = useState(5);
  const [sos, setSos] = useState<{ data: SOSResponse; source: CoachSource } | null>(null);
  const [nudge, setNudge] = useState<{ data: NudgeResponse; source: CoachSource } | null>(null);
  const [weekly, setWeekly] = useState<{ data: WeeklySummary; source: CoachSource } | null>(null);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosError, setSosError] = useState('');
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState('');
  const [weeklyGeneratedAt, setWeeklyGeneratedAt] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const recent = useMemo(() => recentCheckIns(checkIns), [checkIns]);

  if (!profile) return <Onboarding onComplete={(next) => { saveProfile(next); setProfile(next); }} />;
  const activeProfile: HabitProfile = profile;
  const days = daysSinceGoalStarted(activeProfile.startDate);

  async function getSOS() {
    setSosLoading(true); setSosError('');
    try { setSos(await requestCoach<SOSResponse>({ action: 'sos', profile: activeProfile, intensity, history: recent })); }
    catch (caught) { setSosError(caught instanceof Error ? caught.message : 'Please try again.'); }
    finally { setSosLoading(false); }
  }

  async function getWeekly() {
    setWeeklyLoading(true); setWeeklyError('');
    try {
      setWeekly(await requestCoach<WeeklySummary>({ action: 'weekly', profile: activeProfile, history: recent }));
      setWeeklyGeneratedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    } catch (caught) {
      setWeeklyError(caught instanceof Error ? caught.message : 'Please try again.');
    }
    finally { setWeeklyLoading(false); }
  }

  function saveCheckIn(checkIn: CheckIn, response: NudgeResponse, source: CoachSource) {
    const next = [...checkIns.filter((entry) => entry.date !== checkIn.date), checkIn];
    saveCheckIns(next);
    setCheckIns(next);
    setNudge({ data: response, source });
    setWeekly(null);
    setWeeklyGeneratedAt('');
    setWeeklyError('');
  }

  function resetPlan() {
    clearBreakFreeData();
    setProfile(null);
    setCheckIns([]);
    setIntensity(5);
    setSos(null);
    setNudge(null);
    setWeekly(null);
    setSosLoading(false);
    setSosError('');
    setWeeklyLoading(false);
    setWeeklyError('');
    setWeeklyGeneratedAt('');
    setShowResetConfirm(false);
  }

  return <main className="app-shell">
    <header><div><p className="eyebrow">BreakFree</p><h1>Hello. Keep it small today.</h1></div><button className="text-button" onClick={() => setShowResetConfirm(true)}>Reset plan</button></header>
    {showResetConfirm && <section className="reset-confirm" role="alertdialog" aria-modal="true" aria-labelledby="reset-title" aria-describedby="reset-description">
      <h2 id="reset-title">Reset your plan?</h2>
      <p id="reset-description">This permanently deletes this plan and its check-in history from this browser. Other website data will not be affected.</p>
      <div className="dialog-actions">
        <button className="secondary" onClick={() => setShowResetConfirm(false)} autoFocus>Keep my plan</button>
        <button className="danger-button" onClick={resetPlan}>Reset and delete</button>
      </div>
    </section>}
    <section className="summary" aria-label="Your progress"><div><span>{days}</span><p>days since you started<br />{profile.goal}</p></div><div><strong>Today’s focus</strong><p>{profile.riskTime} can be a high-risk time. Prepare before it arrives.</p></div></section>
    <section className="sos-panel" aria-labelledby="sos-title"><div><p className="eyebrow">SOS mode</p><h2 id="sos-title">A craving is a wave. Let’s get through this one.</h2><RangeField id="craving-intensity" label="How intense is it?" value={intensity} min={1} max={10} minLabel="Manageable" maxLabel="Overwhelming" onChange={setIntensity} /><button className="sos-button" onClick={getSOS} disabled={sosLoading} aria-busy={sosLoading}>{sosLoading ? 'Stay with your breath…' : 'I need support now'}</button>{sosError && <p className="form-error" role="alert">{sosError}</p>}</div>{sosLoading ? <BreathingLoader /> : sos && <SOSCard response={sos.data} source={sos.source} />}</section>
    <CheckInForm profile={activeProfile} history={recent} onSaved={saveCheckIn} />
    {nudge && <NudgeCard response={nudge.data} source={nudge.source} />}
    <section className="panel progress-panel">
      <div><p className="eyebrow">Your record</p><h2>Evidence of showing up</h2><p>{recent.length ? 'Your last five check-ins are stored only in this browser.' : 'Your first honest check-in will appear here.'}</p></div>
      <div className="progress-content">
        {recent.length > 0 && <ul>{recent.map((entry) => <li key={entry.id}><time dateTime={entry.date}>{entry.date}</time><span>Mood {entry.mood}/5</span><span>{entry.resisted ? 'Paused / resisted' : 'A lapse happened'}</span></li>)}</ul>}
        <button className="secondary" onClick={getWeekly} disabled={weeklyLoading || !recent.length} aria-busy={weeklyLoading}>{weeklyLoading ? 'Finding a pattern…' : weekly ? 'Refresh weekly perspective' : 'Get weekly perspective'}</button>
        {!recent.length && <p className="fine-print">Log one check-in to unlock a perspective based on your real experience.</p>}
        {weeklyGeneratedAt && <p className="fine-print">Last generated today at {weeklyGeneratedAt}.</p>}
        {weeklyError && <p className="form-error" role="alert">{weeklyError}</p>}
      </div>
    </section>
    {weekly && <WeeklyCard response={weekly.data} source={weekly.source} />}
    <footer><p>BreakFree supports reflection; it does not replace professional or emergency care. If you may hurt yourself or someone else, call local emergency services or contact a trusted person now.</p></footer>
  </main>;
}
