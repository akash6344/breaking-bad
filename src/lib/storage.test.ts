import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearBreakFreeData, daysSinceGoalStarted, loadCheckIns, loadProfile, saveCheckIns, saveProfile, STORAGE_UNAVAILABLE_MESSAGE } from './storage';

describe('local progress storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('persists the check-in log', () => {
    const checkIns = [{ id: 'one', date: '2026-07-18', mood: 4, trigger: 'stress', resisted: true }];
    saveCheckIns(checkIns);
    expect(loadCheckIns()).toEqual(checkIns);
  });

  it('never returns negative days since the goal began', () => {
    expect(daysSinceGoalStarted('2099-01-01')).toBe(0);
  });

  it('clears only BreakFree-owned data', () => {
    saveProfile({ habitName: 'Scrolling', trigger: 'Stress', goal: 'Read', riskTime: 'Night', startDate: '2026-07-18' });
    saveCheckIns([{ id: 'one', date: '2026-07-18', mood: 4, trigger: 'stress', resisted: true }]);
    window.localStorage.setItem('unrelated.preference', 'keep-me');

    clearBreakFreeData();

    expect(window.localStorage.getItem('breakfree.profile')).toBeNull();
    expect(loadCheckIns()).toEqual([]);
    expect(window.localStorage.getItem('unrelated.preference')).toBe('keep-me');
  });

  it('discards malformed persisted data instead of exposing it to the UI', () => {
    window.localStorage.setItem('breakfree.profile', JSON.stringify({ habitName: 'Only one field' }));
    window.localStorage.setItem('breakfree.checkins', JSON.stringify([{ id: 'one', mood: 99 }]));

    expect(loadProfile()).toBeNull();
    expect(loadCheckIns()).toEqual([]);
    expect(window.localStorage.getItem('breakfree.profile')).toBeNull();
    expect(window.localStorage.getItem('breakfree.checkins')).toBeNull();
  });

  it('keeps local history bounded', () => {
    saveCheckIns(Array.from({ length: 91 }, (_, index) => ({
      id: String(index),
      date: '2026-07-18',
      mood: 3,
      trigger: 'stress',
      resisted: index % 2 === 0,
    })));

    expect(loadCheckIns()).toHaveLength(90);
  });

  it('discards impossible calendar dates', () => {
    window.localStorage.setItem('breakfree.profile', JSON.stringify({
      habitName: 'Scrolling',
      trigger: 'Stress',
      goal: 'Read',
      riskTime: 'Night',
      startDate: '2026-02-30',
    }));

    expect(loadProfile()).toBeNull();
    expect(daysSinceGoalStarted('2026-02-30')).toBe(0);
  });

  it('returns a controlled error when storage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    const outcome = saveProfile({
      habitName: 'Scrolling',
      trigger: 'Stress',
      goal: 'Read',
      riskTime: 'Night',
      startDate: '2026-07-18',
    });

    expect(outcome).toEqual({ ok: false, message: STORAGE_UNAVAILABLE_MESSAGE });
  });
});
