export interface HabitProfile {
  habitName: string;
  trigger: string;
  goal: string;
  riskTime: string;
  startDate: string;
}

export interface CheckIn {
  id: string;
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
  trend: 'improving' | 'stable' | 'struggling';
  keyInsight: string;
  strongestDay: string;
  watchOutFor: string;
  encouragement: string;
}

export type CoachAction = 'sos' | 'checkin' | 'weekly';
export type CoachSource = 'ai' | 'offline';

export interface CoachResult<T> {
  data: T;
  source: CoachSource;
}

export interface CoachRequest {
  action: CoachAction;
  profile: HabitProfile;
  intensity?: number;
  checkIn?: Omit<CheckIn, 'id' | 'date'>;
  history?: CheckIn[];
}
