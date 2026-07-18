import { useEffect, useRef, useState, type FormEvent } from 'react';
import { RangeField } from '../components/RangeField';
import { requestCoach } from '../lib/coach';
import { sanitizeText } from '../lib/sanitize';
import { today } from '../lib/date';
import type { CheckIn, CoachSource, HabitProfile, NudgeResponse } from '../types';

interface CheckInFormProps {
  profile: HabitProfile;
  history: CheckIn[];
  onSaved: (checkIn: CheckIn, result: NudgeResponse, source: CoachSource) => void;
}

export function CheckInForm({ profile, history, onSaved }: CheckInFormProps) {
  const [mood, setMood] = useState(3);
  const [trigger, setTrigger] = useState('');
  const [resisted, setResisted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [triggerError, setTriggerError] = useState('');
  const [resistedError, setResistedError] = useState('');
  const [requestError, setRequestError] = useState('');
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextTriggerError = trigger.trim() ? '' : 'Describe what triggered you today.';
    const nextResistedError = resisted === null ? 'Choose what happened today.' : '';
    setTriggerError(nextTriggerError);
    setResistedError(nextResistedError);
    setRequestError('');
    if (nextTriggerError || nextResistedError || resisted === null) return;

    setLoading(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const payload = { mood, trigger: sanitizeText(trigger), resisted };
      const result = await requestCoach<NudgeResponse>({ action: 'checkin', profile, checkIn: payload, history }, controller.signal);
      onSaved({ id: crypto.randomUUID(), date: today(), ...payload }, result.data, result.source);
      setTrigger('');
      setResisted(null);
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === 'AbortError')) {
        setRequestError(caught instanceof Error ? caught.message : 'Please try again.');
      }
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
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
      <button className="secondary" type="submit" disabled={loading} aria-busy={loading}>
        {loading ? 'Getting your nudge…' : 'Save check-in & get a nudge'}
      </button>
    </form>
  </section>;
}
