import { describe, expect, it } from 'vitest';
import { resistStreak, todayFocusMessage } from './streak';
import type { CheckIn } from '../types';

const entry = (date: string, resisted: boolean, trigger = 'stress'): CheckIn => ({
  id: date,
  date,
  mood: 3,
  trigger,
  resisted,
});

describe('resistStreak', () => {
  it('counts consecutive resisted check-ins from the most recent day', () => {
    expect(resistStreak([
      entry('2026-07-18', true),
      entry('2026-07-17', true),
      entry('2026-07-16', false),
    ])).toBe(2);
  });

  it('resets when the latest check-in is a lapse', () => {
    expect(resistStreak([entry('2026-07-18', false)])).toBe(0);
  });
});

describe('todayFocusMessage', () => {
  it('uses relapse-aware copy after a lapse', () => {
    expect(todayFocusMessage('After 9pm', 'Read before bed', [entry('2026-07-18', false, 'a tough meeting')])).toMatch(/lapse/);
  });
});
