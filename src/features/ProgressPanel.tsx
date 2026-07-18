import { WeeklyCard } from '../components/CoachCards';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { MAX_RECENT_CHECK_INS, MAX_STORED_CHECK_INS } from '../lib/storage';
import type { CheckIn, CoachSource, WeeklySummary } from '../types';

interface ProgressPanelProps {
  recent: CheckIn[];
  hasWeeklyEvidence: boolean;
  weeklyLoading: boolean;
  weeklyError: string;
  weeklyGeneratedAt: string;
  weekly: { data: WeeklySummary; source: CoachSource } | null;
  onRequestWeekly: () => void;
}

export function ProgressPanel({
  recent,
  hasWeeklyEvidence,
  weeklyLoading,
  weeklyError,
  weeklyGeneratedAt,
  weekly,
  onRequestWeekly,
}: ProgressPanelProps) {
  return (
    <>
      <section className="panel progress-panel">
        <div>
          <p className="eyebrow">Your record</p>
          <h2>Evidence of showing up</h2>
          <p>
            {recent.length
              ? `Your last ${MAX_RECENT_CHECK_INS} check-ins are shown here. Up to ${MAX_STORED_CHECK_INS} are kept locally in this browser.`
              : 'Your first honest check-in will appear here.'}
          </p>
        </div>
        <div className="progress-content">
          {recent.length > 0 && (
            <ul>
              {recent.map((entry) => (
                <li key={entry.id}>
                  <time dateTime={entry.date}>{entry.date}</time>
                  <span>Mood {entry.mood}/5</span>
                  <span>{entry.resisted ? 'Paused / resisted' : 'A lapse happened'}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            className="secondary"
            onClick={onRequestWeekly}
            disabled={weeklyLoading || !hasWeeklyEvidence}
            aria-busy={weeklyLoading}
          >
            {weeklyLoading ? 'Finding a pattern…' : weekly ? 'Refresh weekly perspective' : 'Get weekly perspective'}
          </button>
          {!hasWeeklyEvidence && (
            <p className="fine-print">
              Log check-ins on three different days to unlock a perspective based on enough real experience.
            </p>
          )}
          {weeklyGeneratedAt && <p className="fine-print">Last generated today at {weeklyGeneratedAt}.</p>}
          {weeklyError && <p className="form-error" role="alert">{weeklyError}</p>}
        </div>
      </section>
      {weekly && (
        <ErrorBoundary title="The weekly perspective could not be shown. Please try again.">
          <WeeklyCard response={weekly.data} source={weekly.source} />
        </ErrorBoundary>
      )}
    </>
  );
}
