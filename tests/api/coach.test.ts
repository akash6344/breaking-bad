// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../api/coach';

const profile = {
  habitName: 'Late-night scrolling',
  trigger: 'Stress',
  goal: 'Read before bed',
  riskTime: 'After 9pm',
  startDate: '2026-07-18',
};

function coachRequest(body: object): Request {
  return new Request('https://breakfree.test/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('coach API contract', () => {
  it('accepts an intentionally empty intensity message for a normal SOS response', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');
    const modelOutput = {
      acknowledgment: 'The urge is understandable.',
      urgeSurfing: 'Notice the feeling and breathe slowly.',
      replacementAction: 'Hold a book with both hands.',
      cognitiveReframe: 'An urge is not an instruction.',
      intensityAdvice: '',
    };
    const providerFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(modelOutput) }] } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', providerFetch);

    const response = await POST(coachRequest({ action: 'sos', profile, intensity: 5, history: [] }));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual({ data: modelOutput, source: 'ai' });
    const [url, options] = providerFetch.mock.calls[0];
    expect(String(url)).not.toContain('test-gemini-key');
    expect(options?.headers).toMatchObject({ 'x-goog-api-key': 'test-gemini-key' });
  });

  it('rejects malformed input before contacting a provider', async () => {
    const providerFetch = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', providerFetch);

    const response = await POST(coachRequest({ action: 'sos', profile, intensity: 99, history: [] }));

    expect(response.status).toBe(400);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('rejects oversized payloads before contacting a provider', async () => {
    const providerFetch = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', providerFetch);

    const response = await POST(coachRequest({
      action: 'sos',
      profile: { ...profile, goal: 'x'.repeat(8_100) },
      intensity: 5,
      history: [],
    }));

    expect(response.status).toBe(413);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('requires JSON requests', async () => {
    const request = new Request('https://breakfree.test/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not-json',
    });

    expect((await POST(request)).status).toBe(415);
  });

  it('labels deterministic guidance as offline when providers fail', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');
    vi.stubEnv('MISTRAL_API_KEY', 'test-mistral-key');
    const providerFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response('unavailable', { status: 503 }));
    vi.stubGlobal('fetch', providerFetch);

    const response = await POST(coachRequest({ action: 'weekly', profile, history: [] }));
    const result = await response.json();

    expect(providerFetch).toHaveBeenCalledTimes(2);
    expect(result.source).toBe('offline');
    expect(result.data.trend).toBe('stable');
  });
});
