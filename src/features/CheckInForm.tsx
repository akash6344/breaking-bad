import { useState, type FormEvent } from 'react';
import { RangeField } from '../components/RangeField';
import { useCoach } from '../hooks/useCoach';
import { sanitizeText } from '../lib/sanitize';
import { today } from '../lib/date';
import type { CheckIn, CoachSource, HabitProfile, NudgeResponse } from '../types';

interface CheckInFormProps {
  profile: HabitProfile;
  history: CheckIn[];
  onSaved: (checkIn: CheckIn, result: NudgeResponse, source: CoachSource) => void;
}

export function CheckInForm({ profile, history, onSaved }: CheckInFormProps) {
  const coach = useCoach<NudgeResponse>();
  const [mood, setMood] = useState(3);
  const [trigger, setTrigger] = useState('');
  const [resisted, setResisted] = useState<boolean | null>(null);
  const [triggerError, setTriggerError] = useState('');
  const [resistedError, setResistedError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextTriggerError = trigger.trim() ? '' : 'Describe what triggered you today.';
    const nextResistedError = resisted === null ? 'Choose what happened today.' : '';
    setTriggerError(nextTriggerError);
    setResistedError(nextResistedError);
    if (nextTriggerError || nextResistedError || resisted === null) return;

    const payload = { mood, trigger: sanitizeText(trigger), resisted };
    const result = await coach.run({
      action: 'checkin',
      profile,
      checkIn: payload,
      history,
    });
    if (!result) return;

    onSaved({ id: crypto.randomUUID(), date: today(), ...payload }, result.data, result.source);
    setTrigger('');
    setResisted(null);
  }

  return (
    <section className="panel checkin-panel" aria-labelledby="checkin-title">
      <div>
        <p className="eyebrow">Daily check-in</p>
        <h2 id="checkin-title">Notice the pattern, without judgment.</h2>
      </div>
      <form onSubmit={submit} noValidate>
        <RangeField id="mood" label="Mood" value={mood} min={1} max={5} minLabel="Low" maxLabel="Good" onChange={setMood} />
        <label htmlFor="checkin-trigger">What triggered you? <span aria-hidden="true">*</span></label>
        <input
          id="checkin-trigger"
          value={trigger}
          maxLength={160}
          onBlur={() => !trigger.trim() && setTriggerError('Describe what triggered you today.')}
          onChange={(event) => {
            setTrigger(event.target.value);
            if (event.target.value.trim()) setTriggerError('');
          }}
          placeholder="A difficult conversation"
          required
          aria-invalid={Boolean(triggerError)}
          aria-describedby={triggerError ? 'trigger-error' : undefined}
        />
        {triggerError && <p id="trigger-error" className="form-error" role="alert">{triggerError}</p>}
        <fieldset className="choice-field" aria-describedby={resistedError ? 'resisted-error' : undefined}>
          <legend>Were you able to pause or resist? <span aria-hidden="true">*</span></legend>
          <label>
            <input type="radio" name="resisted" checked={resisted === true} onChange={() => { setResisted(true); setResistedError(''); }} />
            Yes
          </label>
          <label>
            <input type="radio" name="resisted" checked={resisted === false} onChange={() => { setResisted(false); setResistedError(''); }} />
            Not this time
          </label>
        </fieldset>
        {resistedError && <p id="resisted-error" className="form-error" role="alert">{resistedError}</p>}
        {coach.error && <p className="form-error" role="alert">{coach.error}</p>}
        <button className="secondary" type="submit" disabled={coach.loading} aria-busy={coach.loading}>
          {coach.loading ? 'Getting your nudge…' : 'Save check-in & get a nudge'}
        </button>
      </form>
    </section>
  );
}
