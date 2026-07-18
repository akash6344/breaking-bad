import type { CheckIn } from '../types';

export function resistStreak(checkIns: CheckIn[]): number {
  const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  for (const entry of sorted) {
    if (!entry.resisted) break;
    streak += 1;
  }
  return streak;
}

export function latestCheckIn(checkIns: CheckIn[]): CheckIn | null {
  if (!checkIns.length) return null;
  return [...checkIns].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function todayFocusMessage(
  riskTime: string,
  goal: string,
  checkIns: CheckIn[],
): string {
  const latest = latestCheckIn(checkIns);
  const streak = resistStreak(checkIns);

  if (latest && !latest.resisted) {
    return `Your latest check-in noted a lapse around “${latest.trigger}.” That does not erase your goal: ${goal}.`;
  }
  if (streak > 0) {
    return `${streak}-day resist streak. ${riskTime} can still be high-risk — prepare one small alternative before then.`;
  }
  return `${riskTime} can be a high-risk time. Prepare before it arrives.`;
}
