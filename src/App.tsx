import { lazy, Suspense, useCallback, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NudgeCard } from './components/CoachCards';
import { ResetPlanDialog } from './components/ResetPlanDialog';
import { CheckInForm } from './features/CheckInForm';
import { DashboardSummary } from './features/DashboardSummary';
import { Onboarding } from './features/Onboarding';
import { SOSPanel } from './features/SOSPanel';
import { useCoach } from './hooks/useCoach';
import { useHabit } from './hooks/useHabit';
import type { CheckIn, CoachSource, NudgeResponse, SOSResponse, WeeklySummary } from './types';

const ProgressPanel = lazy(async () => {
  const module = await import('./features/ProgressPanel');
  return { default: module.ProgressPanel };
});

export function App() {
  const {
    profile,
    checkIns,
    recent,
    streak,
    days,
    focusMessage,
    hasWeeklyEvidence,
    storageError,
    completeOnboarding,
    persistCheckIn,
    resetPlan: resetHabit,
  } = useHabit();

  const {
    result: sosResult,
    loading: sosLoading,
    error: sosError,
    run: runSos,
    clear: clearSos,
  } = useCoach<SOSResponse>();

  const {
    result: weeklyResult,
    loading: weeklyLoading,
    error: weeklyError,
    generatedAt: weeklyGeneratedAt,
    run: runWeekly,
    clear: clearWeekly,
  } = useCoach<WeeklySummary>();

  const [intensity, setIntensity] = useState(5);
  const [nudge, setNudge] = useState<{ data: NudgeResponse; source: CoachSource } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const requestSOS = useCallback(() => {
    if (!profile) return;
    void runSos({
      action: 'sos',
      profile,
      intensity,
      history: recent,
    });
  }, [intensity, profile, recent, runSos]);

  const requestWeekly = useCallback(() => {
    if (!profile || !hasWeeklyEvidence) return;
    void runWeekly({
      action: 'weekly',
      profile,
      history: recent,
    });
  }, [hasWeeklyEvidence, profile, recent, runWeekly]);

  const saveCheckIn = useCallback((checkIn: CheckIn, response: NudgeResponse, source: CoachSource) => {
    const outcome = persistCheckIn(checkIn);
    if (!outcome.ok) return;
    setNudge({ data: response, source });
    clearWeekly();
  }, [clearWeekly, persistCheckIn]);

  const resetPlan = useCallback(() => {
    clearSos();
    clearWeekly();
    setNudge(null);
    setIntensity(5);
    resetHabit();
    setShowResetConfirm(false);
  }, [clearSos, clearWeekly, resetHabit]);

  if (!profile) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <main className="app-shell">
      <header>
        <div>
          <p className="eyebrow">BreakFree</p>
          <h1>Hello. Keep it small today.</h1>
        </div>
        <button className="text-button" onClick={() => setShowResetConfirm(true)}>Reset plan</button>
      </header>
      {showResetConfirm && (
        <ResetPlanDialog onCancel={() => setShowResetConfirm(false)} onConfirm={resetPlan} />
      )}
      <DashboardSummary
        streak={streak}
        days={days}
        goal={profile.goal}
        hasCheckIns={checkIns.length > 0}
        focusMessage={focusMessage}
      />
      <SOSPanel
        intensity={intensity}
        onIntensityChange={setIntensity}
        loading={sosLoading}
        error={sosError}
        onRequest={requestSOS}
        result={sosResult}
      />
      <CheckInForm profile={profile} history={recent} onSaved={saveCheckIn} />
      {storageError && <p className="form-error" role="alert">{storageError}</p>}
      {nudge && (
        <ErrorBoundary title="The check-in nudge could not be shown. Please try again.">
          <NudgeCard response={nudge.data} source={nudge.source} />
        </ErrorBoundary>
      )}
      <Suspense fallback={<p className="fine-print" role="status">Loading your record…</p>}>
        <ProgressPanel
          recent={recent}
          hasWeeklyEvidence={hasWeeklyEvidence}
          weeklyLoading={weeklyLoading}
          weeklyError={weeklyError}
          weeklyGeneratedAt={weeklyGeneratedAt}
          weekly={weeklyResult}
          onRequestWeekly={requestWeekly}
        />
      </Suspense>
      <footer>
        <p>
          BreakFree supports reflection; it does not replace professional or emergency care.
          If you may hurt yourself or someone else, call local emergency services or contact a trusted person now.
        </p>
      </footer>
    </main>
  );
}

export default App;
