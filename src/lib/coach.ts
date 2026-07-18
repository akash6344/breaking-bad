import type { CoachRequest, CoachResult, NudgeResponse, SOSResponse, WeeklySummary } from '../types';
import { isCoachResultForAction } from './coach-contract';

export async function requestCoach<T extends SOSResponse | NudgeResponse | WeeklySummary>(
  request: CoachRequest,
  signal?: AbortSignal,
): Promise<CoachResult<T>> {
  const response = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error('The coach could not be reached. Please try again.');
  }

  const result: unknown = await response.json();
  if (!isCoachResultForAction(request.action, result)) {
    throw new Error('The coach returned an invalid response. Please try again.');
  }

  return result as CoachResult<T>;
}
