import type { CheckIn, HabitProfile } from '../types';

// Local persistence is deliberate data minimization: this single-device micro-app
// needs no account or server-side profile database. Only these app-owned keys are
// retained, and coaching context is sent to the AI only when the user requests it.
const PROFILE_KEY = 'breakfree.profile';
const CHECKINS_KEY = 'breakfree.checkins';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadProfile(): HabitProfile | null {
  return read<HabitProfile | null>(PROFILE_KEY, null);
}

export function saveProfile(profile: HabitProfile): void {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadCheckIns(): CheckIn[] {
  return read<CheckIn[]>(CHECKINS_KEY, []);
}

export function saveCheckIns(checkIns: CheckIn[]): void {
  window.localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkIns));
}

export function clearBreakFreeData(): void {
  window.localStorage.removeItem(PROFILE_KEY);
  window.localStorage.removeItem(CHECKINS_KEY);
}

export function daysSinceGoalStarted(startDate: string): number {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.max(0, Math.floor((todayStart - start) / 86_400_000));
}

export function recentCheckIns(checkIns: CheckIn[]): CheckIn[] {
  return [...checkIns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
}
