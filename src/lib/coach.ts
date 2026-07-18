import type { CoachRequest, CoachResult, NudgeResponse, SOSResponse, WeeklySummary } from '../types';

export async function requestCoach<T extends SOSResponse | NudgeResponse | WeeklySummary>(
  request: CoachRequest,
): Promise<CoachResult<T>> {
  const response = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('The coach could not be reached. Please try again.');
  }

  return (await response.json()) as CoachResult<T>;
}
