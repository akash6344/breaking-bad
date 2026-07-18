import { sortCheckInsNewestFirst } from './checkIns';
import type { CheckIn } from '../types';

export function resistStreak(checkIns: CheckIn[]): number {
  let streak = 0;
  for (const entry of sortCheckInsNewestFirst(checkIns)) {
    if (!entry.resisted) break;
    streak += 1;
  }
  return streak;
}

export function latestCheckIn(checkIns: CheckIn[]): CheckIn | null {
  return sortCheckInsNewestFirst(checkIns)[0] ?? null;
}

export function todayFocusMessage(
  riskTime: string,
  goal: string,
  checkIns: CheckIn[],
): string {
  // One sort feeds both latest-entry and streak reads.
  const newestFirst = sortCheckInsNewestFirst(checkIns);
  const latest = newestFirst[0] ?? null;
  let streak = 0;
  for (const entry of newestFirst) {
    if (!entry.resisted) break;
    streak += 1;
  }

  if (latest && !latest.resisted) {
    return `Your latest check-in noted a lapse around “${latest.trigger}.” That does not erase your goal: ${goal}.`;
  }
  if (streak > 0) {
    return `${streak}-day resist streak. ${riskTime} can still be high-risk — prepare one small alternative before then.`;
  }
  return `${riskTime} can be a high-risk time. Prepare before it arrives.`;
}
