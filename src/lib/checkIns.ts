import type { CheckIn } from '../types';

export function sortCheckInsNewestFirst(checkIns: CheckIn[]): CheckIn[] {
  return [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
}
