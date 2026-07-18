import type { ReactNode } from 'react';
import type { CoachSource, NudgeResponse, SOSResponse, WeeklySummary } from '../types';

function SourceNotice({ source }: { source: CoachSource }) {
  return source === 'offline'
    ? <p className="offline-note" role="status">Offline guidance is showing while the AI coach is unavailable.</p>
    : <p className="ai-note" role="status">Personalized by the AI coach.</p>;
}

function CoachSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function CoachLiveRegion({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <section className={className} aria-live="polite" aria-atomic="true">
      {children}
    </section>
  );
}

export function SOSCard({ response, source }: { response: SOSResponse; source: CoachSource }) {
  return (
    <CoachLiveRegion className="coach-card">
      <SourceNotice source={source} />
      <p className="coach-lead">{response.acknowledgment}</p>
      <CoachSection title="Ride the wave">{response.urgeSurfing}</CoachSection>
      <CoachSection title="Do this now">{response.replacementAction}</CoachSection>
      <CoachSection title="A thought to hold">{response.cognitiveReframe}</CoachSection>
      {response.intensityAdvice && <p className="intensity-advice">{response.intensityAdvice}</p>}
    </CoachLiveRegion>
  );
}

export function NudgeCard({ response, source }: { response: NudgeResponse; source: CoachSource }) {
  return (
    <CoachLiveRegion className="nudge-card">
      <SourceNotice source={source} />
      <h2>Your next small step</h2>
      <p>{response.insight}</p>
      <strong>{response.nudge}</strong>
      <blockquote>{response.ifThenPlan}</blockquote>
      <p>{response.nextCheckinReminder}</p>
    </CoachLiveRegion>
  );
}

export function WeeklyCard({ response, source }: { response: WeeklySummary; source: CoachSource }) {
  return (
    <CoachLiveRegion className="weekly-card">
      <SourceNotice source={source} />
      <p className={`trend ${response.trend}`}>{response.trend}</p>
      <h2>Weekly perspective</h2>
      <p>{response.keyInsight}</p>
      <dl>
        <div><dt>Strongest signal</dt><dd>{response.strongestDay}</dd></div>
        <div><dt>Watch for</dt><dd>{response.watchOutFor}</dd></div>
      </dl>
      <p>{response.encouragement}</p>
    </CoachLiveRegion>
  );
}
