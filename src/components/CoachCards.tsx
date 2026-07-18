import type { CoachSource, NudgeResponse, SOSResponse, WeeklySummary } from '../types';

function SourceNotice({ source }: { source: CoachSource }) {
  return source === 'offline'
    ? <p className="offline-note" role="status">Offline guidance is showing while the AI coach is unavailable.</p>
    : <p className="ai-note" role="status">Personalized by the AI coach.</p>;
}

export function SOSCard({ response, source }: { response: SOSResponse; source: CoachSource }) {
  return <section className="coach-card" aria-live="polite">
    <SourceNotice source={source} />
    <h2>{response.acknowledgment}</h2>
    <div><h3>Ride the wave</h3><p>{response.urgeSurfing}</p></div>
    <div><h3>Do this now</h3><p>{response.replacementAction}</p></div>
    <div><h3>A thought to hold</h3><p>{response.cognitiveReframe}</p></div>
    {response.intensityAdvice && <p className="intensity-advice">{response.intensityAdvice}</p>}
  </section>;
}

export function NudgeCard({ response, source }: { response: NudgeResponse; source: CoachSource }) {
  return <section className="nudge-card" aria-live="polite">
    <SourceNotice source={source} />
    <h2>Your next small step</h2>
    <p>{response.insight}</p>
    <strong>{response.nudge}</strong>
    <blockquote>{response.ifThenPlan}</blockquote>
    <p>{response.nextCheckinReminder}</p>
  </section>;
}

export function WeeklyCard({ response, source }: { response: WeeklySummary; source: CoachSource }) {
  return <section className="weekly-card" aria-live="polite">
    <SourceNotice source={source} />
    <p className={`trend ${response.trend}`}>{response.trend}</p>
    <h2>Weekly perspective</h2>
    <p>{response.keyInsight}</p>
    <dl>
      <div><dt>Strongest signal</dt><dd>{response.strongestDay}</dd></div>
      <div><dt>Watch for</dt><dd>{response.watchOutFor}</dd></div>
    </dl>
    <p>{response.encouragement}</p>
  </section>;
}
