import { useEffect, useMemo, useRef, useState } from 'react';
import { BreathingLoader } from './components/BreathingLoader';
import { NudgeCard, SOSCard, WeeklyCard } from './components/CoachCards';
import { RangeField } from './components/RangeField';
import { ResetPlanDialog } from './components/ResetPlanDialog';
import { CheckInForm } from './features/CheckInForm';
import { Onboarding } from './features/Onboarding';
import { requestCoach } from './lib/coach';
import { clearBreakFreeData, daysSinceGoalStarted, loadCheckIns, loadProfile, MAX_RECENT_CHECK_INS, MAX_STORED_CHECK_INS, recentCheckIns, saveCheckIns, saveProfile } from './lib/storage';
import type { CheckIn, CoachSource, HabitProfile, NudgeResponse, SOSResponse, WeeklySummary } from './types';

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
  const sosController = useRef<AbortController | null>(null);
  const weeklyController = useRef<AbortController | null>(null);
  const recent = useMemo(() => recentCheckIns(checkIns), [checkIns]);
  const hasWeeklyEvidence = new Set(recent.map((entry) => entry.date)).size >= 3;

  useEffect(() => () => {
    sosController.current?.abort();
    weeklyController.current?.abort();
  }, []);

  if (!profile) {
    return <Onboarding onComplete={(next) => {
      const outcome = saveProfile(next);
      if (outcome.ok) setProfile(next);
      return outcome;
    }} />;
  }
  const activeProfile: HabitProfile = profile;
  const days = daysSinceGoalStarted(activeProfile.startDate);

  async function getSOS() {
    sosController.current?.abort();
    const controller = new AbortController();
    sosController.current = controller;
    setSosLoading(true); setSosError('');
    try {
      setSos(await requestCoach<SOSResponse>({ action: 'sos', profile: activeProfile, intensity, history: recent }, controller.signal));
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === 'AbortError')) {
        setSosError(caught instanceof Error ? caught.message : 'Please try again.');
      }
    } finally {
      if (sosController.current === controller) setSosLoading(false);
    }
  }

  async function getWeekly() {
    if (!hasWeeklyEvidence) return;
    weeklyController.current?.abort();
    const controller = new AbortController();
    weeklyController.current = controller;
    setWeeklyLoading(true); setWeeklyError('');
    try {
      setWeekly(await requestCoach<WeeklySummary>({ action: 'weekly', profile: activeProfile, history: recent }, controller.signal));
      setWeeklyGeneratedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === 'AbortError')) {
        setWeeklyError(caught instanceof Error ? caught.message : 'Please try again.');
      }
    } finally {
      if (weeklyController.current === controller) setWeeklyLoading(false);
    }
  }

  function saveCheckIn(checkIn: CheckIn, response: NudgeResponse, source: CoachSource) {
    const next = [...checkIns.filter((entry) => entry.date !== checkIn.date), checkIn];
    const outcome = saveCheckIns(next);
    if (!outcome.ok) {
      setWeeklyError(outcome.message);
      return;
    }
    setCheckIns(next);
    setNudge({ data: response, source });
    setWeekly(null);
    setWeeklyGeneratedAt('');
    setWeeklyError('');
  }

  function resetPlan() {
    sosController.current?.abort();
    weeklyController.current?.abort();
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
    {showResetConfirm && <ResetPlanDialog onCancel={() => setShowResetConfirm(false)} onConfirm={resetPlan} />}
    <section className="summary" aria-label="Your progress"><div><span>{days}</span><p>days since you started<br />{profile.goal}</p></div><div><strong>Today’s focus</strong><p>{profile.riskTime} can be a high-risk time. Prepare before it arrives.</p></div></section>
    <section className="sos-panel" aria-labelledby="sos-title"><div><p className="eyebrow">SOS mode</p><h2 id="sos-title">A craving is a wave. Let’s get through this one.</h2><RangeField id="craving-intensity" label="How intense is it?" value={intensity} min={1} max={10} minLabel="Manageable" maxLabel="Overwhelming" onChange={setIntensity} /><button className="sos-button" onClick={getSOS} disabled={sosLoading} aria-busy={sosLoading}>{sosLoading ? 'Stay with your breath…' : 'I need support now'}</button>{sosError && <p className="form-error" role="alert">{sosError}</p>}</div>{sosLoading ? <BreathingLoader /> : sos && <SOSCard response={sos.data} source={sos.source} />}</section>
    <CheckInForm profile={activeProfile} history={recent} onSaved={saveCheckIn} />
    {nudge && <NudgeCard response={nudge.data} source={nudge.source} />}
    <section className="panel progress-panel">
      <div><p className="eyebrow">Your record</p><h2>Evidence of showing up</h2><p>{recent.length ? `Your last ${MAX_RECENT_CHECK_INS} check-ins are shown here. Up to ${MAX_STORED_CHECK_INS} are kept locally in this browser.` : 'Your first honest check-in will appear here.'}</p></div>
      <div className="progress-content">
        {recent.length > 0 && <ul>{recent.map((entry) => <li key={entry.id}><time dateTime={entry.date}>{entry.date}</time><span>Mood {entry.mood}/5</span><span>{entry.resisted ? 'Paused / resisted' : 'A lapse happened'}</span></li>)}</ul>}
        <button className="secondary" onClick={getWeekly} disabled={weeklyLoading || !hasWeeklyEvidence} aria-busy={weeklyLoading}>{weeklyLoading ? 'Finding a pattern…' : weekly ? 'Refresh weekly perspective' : 'Get weekly perspective'}</button>
        {!hasWeeklyEvidence && <p className="fine-print">Log check-ins on three different days to unlock a perspective based on enough real experience.</p>}
        {weeklyGeneratedAt && <p className="fine-print">Last generated today at {weeklyGeneratedAt}.</p>}
        {weeklyError && <p className="form-error" role="alert">{weeklyError}</p>}
      </div>
    </section>
    {weekly && <WeeklyCard response={weekly.data} source={weekly.source} />}
    <footer><p>BreakFree supports reflection; it does not replace professional or emergency care. If you may hurt yourself or someone else, call local emergency services or contact a trusted person now.</p></footer>
  </main>;
}
