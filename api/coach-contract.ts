export const MAX_TEXT_LENGTH = 160;
export const MAX_HISTORY = 7;
export const MAX_RESPONSE_LENGTH = 700;
export const MAX_REQUEST_BYTES = 8_000;

export type CoachAction = 'sos' | 'checkin' | 'weekly';
export type CoachSource = 'ai' | 'offline';

export const COACH_RESPONSE_FIELDS = {
  sos: ['acknowledgment', 'urgeSurfing', 'replacementAction', 'cognitiveReframe', 'intensityAdvice'],
  checkin: ['insight', 'nudge', 'ifThenPlan', 'nextCheckinReminder'],
  weekly: ['trend', 'keyInsight', 'strongestDay', 'watchOutFor', 'encouragement'],
} as const satisfies Record<CoachAction, readonly string[]>;

export const WEEKLY_TRENDS = ['improving', 'stable', 'struggling'] as const;

export interface HabitProfile {
  habitName: string;
  trigger: string;
  goal: string;
  riskTime: string;
  startDate: string;
}

export interface CoachCheckIn {
  date: string;
  mood: number;
  trigger: string;
  resisted: boolean;
}

export interface SOSResponse {
  acknowledgment: string;
  urgeSurfing: string;
  replacementAction: string;
  cognitiveReframe: string;
  intensityAdvice: string;
}

export interface NudgeResponse {
  insight: string;
  nudge: string;
  ifThenPlan: string;
  nextCheckinReminder: string;
}

export interface WeeklySummary {
  trend: (typeof WEEKLY_TRENDS)[number];
  keyInsight: string;
  strongestDay: string;
  watchOutFor: string;
  encouragement: string;
}

export type CoachResponse = SOSResponse | NudgeResponse | WeeklySummary;

export interface CoachResult<T extends CoachResponse> {
  data: T;
  source: CoachSource;
}

export interface CoachRequest {
  action: CoachAction;
  profile: HabitProfile;
  intensity?: number;
  checkIn?: Omit<CoachCheckIn, 'date'>;
  history?: CoachCheckIn[];
}

export function isCoachSource(value: unknown): value is CoachSource {
  return value === 'ai' || value === 'offline';
}

export function isCoachResult(value: unknown): value is CoachResult<CoachResponse> {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  return isCoachSource(result.source) && Boolean(result.data) && typeof result.data === 'object';
}

export function validateCoachResponseData(
  action: CoachAction,
  value: Record<string, unknown>,
): Record<string, string> | null {
  const result: Record<string, string> = {};
  for (const field of COACH_RESPONSE_FIELDS[action]) {
    const mayBeEmpty = action === 'sos' && field === 'intensityAdvice';
    if (typeof value[field] !== 'string' || (!mayBeEmpty && !value[field].trim())) return null;
    result[field] = value[field].trim().slice(0, MAX_RESPONSE_LENGTH);
  }
  if (action === 'weekly' && !WEEKLY_TRENDS.includes(result.trend as (typeof WEEKLY_TRENDS)[number])) {
    return null;
  }
  return result;
}

export function isCoachResultForAction(action: CoachAction, value: unknown): value is CoachResult<CoachResponse> {
  if (!isCoachResult(value)) return false;
  return validateCoachResponseData(action, value.data as unknown as Record<string, unknown>) !== null;
}

/** Shared client/server text cleaning: strip angle brackets, trim, and bound length. */
export function sanitizeText(value: string): string {
  return value.replace(/[<>]/g, '').trim().slice(0, MAX_TEXT_LENGTH);
}

export function cleanOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = sanitizeText(value);
  return cleaned.length ? cleaned : null;
}
