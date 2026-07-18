import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resistStreak, todayFocusMessage } from '../lib/streak';
import {
  clearBreakFreeData,
  daysSinceGoalStarted,
  loadCheckIns,
  loadProfile,
  recentCheckIns,
  saveCheckIns,
  saveProfile,
  type StorageOutcome,
} from '../lib/storage';
import type { CheckIn, HabitProfile } from '../types';

export function useHabit() {
  const [profile, setProfile] = useState<HabitProfile | null>(() => loadProfile());
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => loadCheckIns());
  const [storageError, setStorageError] = useState('');
  const checkInsRef = useRef(checkIns);

  useEffect(() => {
    checkInsRef.current = checkIns;
  }, [checkIns]);

  const recent = useMemo(() => recentCheckIns(checkIns), [checkIns]);
  const hasWeeklyEvidence = useMemo(
    () => new Set(recent.map((entry) => entry.date)).size >= 3,
    [recent],
  );
  const streak = useMemo(() => resistStreak(checkIns), [checkIns]);
  const days = useMemo(
    () => (profile ? daysSinceGoalStarted(profile.startDate) : 0),
    [profile],
  );
  const focusMessage = useMemo(
    () => (profile ? todayFocusMessage(profile.riskTime, profile.goal, checkIns) : ''),
    [checkIns, profile],
  );

  const completeOnboarding = useCallback((next: HabitProfile): StorageOutcome => {
    const outcome = saveProfile(next);
    if (outcome.ok) {
      setProfile(next);
      setStorageError('');
    } else {
      setStorageError(outcome.message);
    }
    return outcome;
  }, []);

  const persistCheckIn = useCallback((checkIn: CheckIn): StorageOutcome => {
    const next = [...checkInsRef.current.filter((entry) => entry.date !== checkIn.date), checkIn];
    const outcome = saveCheckIns(next);
    if (!outcome.ok) {
      setStorageError(outcome.message);
      return outcome;
    }
    checkInsRef.current = next;
    setCheckIns(next);
    setStorageError('');
    return outcome;
  }, []);

  const resetPlan = useCallback(() => {
    clearBreakFreeData();
    setProfile(null);
    checkInsRef.current = [];
    setCheckIns([]);
    setStorageError('');
  }, []);

  return {
    profile,
    checkIns,
    recent,
    streak,
    days,
    focusMessage,
    hasWeeklyEvidence,
    storageError,
    completeOnboarding,
    persistCheckIn,
    resetPlan,
  };
}
