import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHabit } from './useHabit';

describe('useHabit', () => {
  beforeEach(() => window.localStorage.clear());

  it('persists a profile and check-in to localStorage', () => {
    const { result } = renderHook(() => useHabit());

    act(() => {
      result.current.completeOnboarding({
        habitName: 'Scrolling',
        trigger: 'Stress',
        goal: 'Read',
        riskTime: 'Night',
        startDate: '2026-07-16',
      });
    });

    expect(result.current.profile?.habitName).toBe('Scrolling');
    expect(window.localStorage.getItem('breakfree.profile')).toContain('Scrolling');

    act(() => {
      result.current.persistCheckIn({
        id: 'one',
        date: '2026-07-18',
        mood: 4,
        trigger: 'stress',
        resisted: true,
      });
    });

    expect(result.current.checkIns).toHaveLength(1);
    expect(result.current.streak).toBe(1);
    expect(window.localStorage.getItem('breakfree.checkins')).toContain('stress');
  });

  it('increments resist streak and resets after a lapse', () => {
    const { result } = renderHook(() => useHabit());

    act(() => {
      result.current.completeOnboarding({
        habitName: 'Scrolling',
        trigger: 'Stress',
        goal: 'Read',
        riskTime: 'Night',
        startDate: '2026-07-16',
      });
      result.current.persistCheckIn({
        id: 'a',
        date: '2026-07-17',
        mood: 3,
        trigger: 'evening',
        resisted: true,
      });
      result.current.persistCheckIn({
        id: 'b',
        date: '2026-07-18',
        mood: 4,
        trigger: 'evening',
        resisted: true,
      });
    });

    expect(result.current.streak).toBe(2);

    act(() => {
      result.current.persistCheckIn({
        id: 'c',
        date: '2026-07-19',
        mood: 2,
        trigger: 'stress',
        resisted: false,
      });
    });

    expect(result.current.streak).toBe(0);
    expect(result.current.focusMessage).toMatch(/lapse/);
  });
});
