import { afterEach, describe, expect, it, vi } from 'vitest';
import { isValidCalendarDate, today } from './date';

describe('today', () => {
  afterEach(() => vi.useRealTimers());

  it('returns a local calendar date in storage-safe format', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 18, 23, 45));

    expect(today()).toBe('2026-07-18');
  });
});

describe('isValidCalendarDate', () => {
  it('accepts real dates and rejects impossible ones', () => {
    expect(isValidCalendarDate('2026-07-18')).toBe(true);
    expect(isValidCalendarDate('2026-02-30')).toBe(false);
    expect(isValidCalendarDate('not-a-date')).toBe(false);
  });
});
