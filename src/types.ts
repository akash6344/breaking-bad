import type { CoachCheckIn } from './lib/coach-contract';

export type {
  CoachAction,
  CoachRequest,
  CoachResponse,
  CoachResult,
  CoachSource,
  HabitProfile,
  NudgeResponse,
  SOSResponse,
  WeeklySummary,
} from './lib/coach-contract';

export interface CheckIn extends CoachCheckIn {
  id: string;
}
