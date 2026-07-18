import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestCoach } from './coach';

describe('requestCoach', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rejects malformed successful API payloads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      source: 'ai',
      data: { trend: 'unknown', keyInsight: '', strongestDay: '', watchOutFor: '', encouragement: '' },
    }), { status: 200 })));

    await expect(requestCoach({
      action: 'weekly',
      profile: {
        habitName: 'Scrolling',
        trigger: 'Stress',
        goal: 'Read',
        riskTime: 'Night',
        startDate: '2026-07-18',
      },
      history: [],
    })).rejects.toThrow('invalid response');
  });

  it('surfaces network failures as user-readable errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad gateway', { status: 502 })));

    await expect(requestCoach({
      action: 'sos',
      profile: {
        habitName: 'Scrolling',
        trigger: 'Stress',
        goal: 'Read',
        riskTime: 'Night',
        startDate: '2026-07-18',
      },
      intensity: 5,
      history: [],
    })).rejects.toThrow('could not be reached');
  });
});
