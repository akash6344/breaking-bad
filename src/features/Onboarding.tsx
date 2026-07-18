import { useState, type FormEvent } from 'react';
import { sanitizeText } from '../lib/sanitize';
import { today } from '../lib/date';
import type { HabitProfile } from '../types';
import type { StorageOutcome } from '../lib/storage';

export function Onboarding({ onComplete }: { onComplete: (profile: HabitProfile) => StorageOutcome }) {
  const [form, setForm] = useState({ habitName: '', trigger: '', goal: '', riskTime: '' });
  const [error, setError] = useState('');

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (Object.values(form).some((value) => !value.trim())) {
      setError('Please complete all four fields.');
      return;
    }
    const outcome = onComplete({
      habitName: sanitizeText(form.habitName),
      trigger: sanitizeText(form.trigger),
      goal: sanitizeText(form.goal),
      riskTime: sanitizeText(form.riskTime),
      startDate: today(),
    });
    if (!outcome.ok) setError(outcome.message);
  }

  return <main className="onboarding-shell">
    <section className="hero" aria-labelledby="welcome-title">
      <p className="eyebrow">BreakFree</p>
      <h1 id="welcome-title">Make the next right choice.</h1>
      <p>Personalized, non-judgmental support for the moments a habit feels hardest to change.</p>
    </section>
    <form className="profile-form" onSubmit={submit}>
      <h2>Set up your support plan</h2>
      <p>Saved only in this browser. Relevant details are sent to the AI provider only when you request coaching.</p>
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
