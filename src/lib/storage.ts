import { isValidCalendarDate } from './date';
import type { CheckIn, HabitProfile } from '../types';

// Local persistence is deliberate data minimization: this single-device micro-app
// needs no account or server-side profile database. Only these app-owned keys are
// retained, and coaching context is sent to the AI only when the user requests it.
const PROFILE_KEY = 'breakfree.profile';
const CHECKINS_KEY = 'breakfree.checkins';

export const MAX_STORED_CHECK_INS = 90;
export const MAX_RECENT_CHECK_INS = 5;

export const STORAGE_UNAVAILABLE_MESSAGE = 'Could not save locally. Check browser storage settings and try again.';

export type StorageOutcome = { ok: true } | { ok: false; message: string };

function isText(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}

function isProfile(value: unknown): value is HabitProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  return ['habitName', 'trigger', 'goal', 'riskTime', 'startDate'].every((key) => isText(profile[key]))
    && isValidCalendarDate(String(profile.startDate));
}

function isCheckIn(value: unknown): value is CheckIn {
  if (!value || typeof value !== 'object') return false;
  const checkIn = value as Record<string, unknown>;
  return isText(checkIn.id)
    && isValidCalendarDate(String(checkIn.date))
    && Number.isInteger(checkIn.mood) && Number(checkIn.mood) >= 1 && Number(checkIn.mood) <= 5
    && isText(checkIn.trigger)
    && typeof checkIn.resisted === 'boolean';
}

function write(key: string, value: string): StorageOutcome {
  try {
    window.localStorage.setItem(key, value);
    return { ok: true };
  } catch {
    return { ok: false, message: STORAGE_UNAVAILABLE_MESSAGE };
  }
}

function read<T>(key: string, fallback: T, parse: (value: unknown) => T | null): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = parse(JSON.parse(raw));
    if (parsed !== null) return parsed;
    window.localStorage.removeItem(key);
    return fallback;
  } catch {
    return fallback;
  }
}

export function loadProfile(): HabitProfile | null {
  return read(PROFILE_KEY, null, (value) => isProfile(value) ? value : null);
}

export function saveProfile(profile: HabitProfile): StorageOutcome {
  if (!isProfile(profile)) return { ok: false, message: STORAGE_UNAVAILABLE_MESSAGE };
  return write(PROFILE_KEY, JSON.stringify(profile));
}

export function loadCheckIns(): CheckIn[] {
  return read(CHECKINS_KEY, [], (value) => {
    if (!Array.isArray(value) || !value.every(isCheckIn)) return null;
    return value.slice(-MAX_STORED_CHECK_INS);
  });
}

export function saveCheckIns(checkIns: CheckIn[]): StorageOutcome {
  const valid = checkIns.filter(isCheckIn).slice(-MAX_STORED_CHECK_INS);
  return write(CHECKINS_KEY, JSON.stringify(valid));
}

export function clearBreakFreeData(): void {
  try {
    window.localStorage.removeItem(PROFILE_KEY);
    window.localStorage.removeItem(CHECKINS_KEY);
  } catch {
    // Reset should still clear in-memory state even when storage is unavailable.
  }
}

export function daysSinceGoalStarted(startDate: string): number {
  if (!isValidCalendarDate(startDate)) return 0;
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.max(0, Math.floor((todayStart - start) / 86_400_000));
}

export function recentCheckIns(checkIns: CheckIn[]): CheckIn[] {
  return [...checkIns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_RECENT_CHECK_INS);
}
