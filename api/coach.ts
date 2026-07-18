type Action = 'sos' | 'checkin' | 'weekly';

interface Profile {
  habitName: string;
  trigger: string;
  goal: string;
  riskTime: string;
  startDate: string;
}

interface CheckIn {
  date: string;
  mood: number;
  trigger: string;
  resisted: boolean;
}

interface ValidRequest {
  action: Action;
  profile: Profile;
  intensity?: number;
  checkIn?: Omit<CheckIn, 'date'>;
  history: CheckIn[];
}

const MAX_TEXT_LENGTH = 160;
const MAX_HISTORY = 7;

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[<>]/g, '').trim().slice(0, MAX_TEXT_LENGTH);
  return cleaned.length ? cleaned : null;
}

function parseRequest(input: unknown): ValidRequest | null {
  if (!input || typeof input !== 'object') return null;
  const body = input as Record<string, unknown>;
  if (!['sos', 'checkin', 'weekly'].includes(String(body.action))) return null;
  const rawProfile = body.profile as Record<string, unknown> | undefined;
  if (!rawProfile) return null;
  const profile: Profile = {
    habitName: cleanText(rawProfile.habitName) ?? '',
    trigger: cleanText(rawProfile.trigger) ?? '',
    goal: cleanText(rawProfile.goal) ?? '',
    riskTime: cleanText(rawProfile.riskTime) ?? '',
    startDate: cleanText(rawProfile.startDate) ?? '',
  };
  if (Object.values(profile).some((value) => !value)) return null;

  const intensity = Number(body.intensity);
  const rawCheckIn = body.checkIn as Record<string, unknown> | undefined;
  const checkIn = rawCheckIn
    ? {
        mood: Math.min(5, Math.max(1, Number(rawCheckIn.mood))),
        trigger: cleanText(rawCheckIn.trigger) ?? '',
        resisted: rawCheckIn.resisted === true,
      }
    : undefined;
  if (body.action === 'sos' && (!Number.isInteger(intensity) || intensity < 1 || intensity > 10)) return null;
  if (body.action === 'checkin' && (!checkIn || !Number.isInteger(checkIn.mood) || !checkIn.trigger)) return null;

  const history = Array.isArray(body.history)
    ? body.history.slice(-MAX_HISTORY).flatMap((item) => {
        const entry = item as Record<string, unknown>;
        const date = cleanText(entry.date);
        const trigger = cleanText(entry.trigger);
        const mood = Number(entry.mood);
        return date && trigger && Number.isInteger(mood) && mood >= 1 && mood <= 5
          ? [{ date, trigger, mood, resisted: entry.resisted === true }]
          : [];
      })
    : [];

  return { action: body.action as Action, profile, intensity, checkIn, history };
}

function promptFor(request: ValidRequest): string {
  const profile = request.profile;
  const context = `Habit: ${profile.habitName}\nMain trigger: ${profile.trigger}\nGoal: ${profile.goal}\nHigh-risk time: ${profile.riskTime}`;
  const shared = `You are BreakFree, a compassionate, non-clinical habit-change support coach. Do not diagnose, claim to be a therapist, or present yourself as emergency support. Be warm, concise, specific, and never judgmental. Return only valid JSON, with no markdown.`;

  if (request.action === 'sos') {
    return `${shared}\n\n${context}\nCurrent craving intensity: ${request.intensity}/10\nGive an immediate, personalized response with exactly this JSON object:\n{"acknowledgment":"one sentence","urgeSurfing":"a short 60-second body-focused instruction","replacementAction":"one specific incompatible action","cognitiveReframe":"one helpful thought","intensityAdvice":"extra support for high intensity, otherwise an empty string"}`;
  }
  if (request.action === 'checkin') {
    return `${shared}\n\n${context}\nToday's check-in: mood ${request.checkIn?.mood}/5; trigger: ${request.checkIn?.trigger}; resisted: ${request.checkIn?.resisted ? 'yes' : 'no'}.\nRecent history: ${JSON.stringify(request.history)}\nReturn exactly:\n{"insight":"one or two sentences","nudge":"one practical next action","ifThenPlan":"If ..., then I will ...","nextCheckinReminder":"one warm sentence"}`;
  }
  return `${shared}\n\n${context}\nRecent history: ${JSON.stringify(request.history)}\nReturn exactly:\n{"trend":"improving, stable, or struggling","keyInsight":"one sentence","strongestDay":"brief honest observation","watchOutFor":"one specific risk","encouragement":"one warm sentence"}`;
}

function parseJson(raw: string): Record<string, unknown> {
  const unwrapped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed: unknown = JSON.parse(unwrapped);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JSON object');
  return parsed as Record<string, unknown>;
}

function validateResponse(action: Action, value: Record<string, unknown>): Record<string, string> {
  const fields = action === 'sos'
    ? ['acknowledgment', 'urgeSurfing', 'replacementAction', 'cognitiveReframe', 'intensityAdvice']
    : action === 'checkin'
      ? ['insight', 'nudge', 'ifThenPlan', 'nextCheckinReminder']
      : ['trend', 'keyInsight', 'strongestDay', 'watchOutFor', 'encouragement'];
  const result: Record<string, string> = {};
  for (const field of fields) {
    if (typeof value[field] !== 'string' || !value[field].trim()) throw new Error('Invalid coach schema');
    result[field] = value[field].trim().slice(0, 700);
  }
  if (action === 'weekly' && !['improving', 'stable', 'struggling'].includes(result.trend)) {
    throw new Error('Invalid trend');
  }
  return result;
}

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini is not configured');
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 400, responseMimeType: 'application/json', temperature: 0.5 },
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Gemini failed: ${response.status}`);
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

async function callMistral(prompt: string): Promise<string> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error('Mistral is not configured');
  const model = process.env.MISTRAL_MODEL ?? 'mistral-small-latest';
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Mistral failed: ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Mistral returned no text');
  return text;
}

function offlineResponse(request: ValidRequest): Record<string, string> {
  if (request.action === 'sos') {
    return {
      acknowledgment: `It makes sense that ${request.profile.habitName} feels tempting right now—an urge is a feeling, not an instruction.`,
      urgeSurfing: 'For one minute, plant both feet on the floor. Slowly breathe in for four, hold for four, and out for six while noticing where the urge feels strongest.',
      replacementAction: 'Put your phone in another room and drink a glass of water while standing by a window.',
      cognitiveReframe: 'I can let this wave pass without acting on it.',
      intensityAdvice: request.intensity && request.intensity >= 7 ? 'If you feel unsafe or might harm yourself, contact local emergency services or a trusted person now.' : '',
    };
  }
  if (request.action === 'checkin') {
    return {
      insight: 'A check-in is useful information, not a grade. Notice what was happening just before the urge.',
      nudge: 'Prepare one small alternative activity before your next high-risk time.',
      ifThenPlan: `If I notice ${request.profile.trigger}, then I will take three slow breaths and step away for two minutes.`,
      nextCheckinReminder: 'Tomorrow, return for a brief check-in and keep the next step small.',
    };
  }
  return {
    trend: 'stable',
    keyInsight: 'You are building awareness by logging what happens around your habit.',
    strongestDay: 'Your most useful day is the one you check in honestly.',
    watchOutFor: `Watch for ${request.profile.trigger}, especially during ${request.profile.riskTime}.`,
    encouragement: `Small choices still support your goal: ${request.profile.goal}.`,
  };
}

export async function POST(request: Request): Promise<Response> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const valid = parseRequest(input);
  if (!valid) return Response.json({ error: 'Invalid request' }, { status: 400 });

  const prompt = promptFor(valid);
  for (const provider of [callGemini, callMistral]) {
    try {
      const data = validateResponse(valid.action, parseJson(await provider(prompt)));
      return Response.json({ data, source: 'ai' });
    } catch {
      // A provider can time out, rate limit, or violate the JSON contract. Try the next provider.
    }
  }
  return Response.json({ data: offlineResponse(valid), source: 'offline' });
}

export function GET(): Response {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
