import { beforeEach, describe, expect, it } from 'vitest';
import { clearBreakFreeData, daysSinceGoalStarted, loadCheckIns, saveCheckIns, saveProfile } from './storage';

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
});
