/**
 * Gemini calls for the voice transcriber.
 *
 * Talks to the REST endpoint with plain fetch rather than @google/generative-ai.
 * Three reasons: the key can then be swapped per request (the UI sends the
 * user's own key, so nothing has to be configured on the server), retry and
 * rate-limit handling stay under our control, and there is no SDK version to
 * keep in step with the API.
 *
 * Every call asks for `responseMimeType: application/json`, which makes Gemini
 * emit a bare JSON object instead of a fenced markdown block. parseJson() still
 * strips fences defensively, because the guarantee is not absolute.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/** Models the UI is allowed to ask for, so a typo can't send traffic anywhere odd. */
export const ALLOWED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
];

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function resolveModel(requested) {
  return ALLOWED_MODELS.includes(requested) ? requested : DEFAULT_MODEL;
}

/**
 * Server env wins when it is set, so a shared deployment can pin one key. Left
 * unset — the normal case here — the caller's own key is used and the server
 * stores nothing.
 */
export function resolveKey(headerKey) {
  const key = process.env.GEMINI_API_KEY || String(headerKey || '').trim();
  if (!key) {
    const err = new Error(
      'No Gemini API key. Add one in Settings, or set GEMINI_API_KEY on the server.'
    );
    err.statusCode = 401;
    err.code = 'NO_API_KEY';
    throw err;
  }
  return key;
}

function parseJson(text) {
  const cleaned = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // A truncated response still usually contains a complete object up to the
    // last closing brace; salvaging it beats throwing away a whole chunk.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    const err = new Error('Gemini returned a response that was not valid JSON');
    err.statusCode = 502;
    throw err;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 429 (free-tier quota) and 5xx are both transient. Retries stay short because
 * the whole call has to finish inside the 60s function budget — the client
 * queue is the real safety net and will re-send a chunk that fails here.
 */
async function callGemini({ apiKey, model, parts, maxOutputTokens = 8192, attempt = 0 }) {
  const res = await fetch(`${ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens,
      },
      safetySettings: [
        'HARM_CATEGORY_HARASSMENT',
        'HARM_CATEGORY_HATE_SPEECH',
        'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'HARM_CATEGORY_DANGEROUS_CONTENT',
      ].map((category) => ({ category, threshold: 'BLOCK_ONLY_HIGH' })),
    }),
  });

  if (res.status === 429 || res.status >= 500) {
    if (attempt < 2) {
      await sleep(2000 * 2 ** attempt);
      return callGemini({ apiKey, model, parts, maxOutputTokens, attempt: attempt + 1 });
    }
    const err = new Error(
      res.status === 429
        ? 'Gemini rate limit reached. The queue will retry this chunk shortly.'
        : `Gemini is unavailable (HTTP ${res.status}).`
    );
    err.statusCode = res.status === 429 ? 429 : 503;
    err.code = res.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_DOWN';
    throw err;
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(geminiErrorMessage(res.status, detail));
    err.statusCode = res.status === 400 || res.status === 403 ? 401 : 502;
    err.code = 'GEMINI_ERROR';
    throw err;
  }

  const body = await res.json();
  const candidate = body.candidates?.[0];

  // A blocked or empty candidate carries no text; surfacing the reason beats a
  // confusing JSON parse error further down.
  if (!candidate || candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
    const err = new Error(
      `Gemini declined this segment (${candidate?.finishReason || 'no output'}).`
    );
    err.statusCode = 422;
    err.code = 'NO_CANDIDATE';
    throw err;
  }

  const text = (candidate.content?.parts || []).map((p) => p.text || '').join('');
  return parseJson(text);
}

function geminiErrorMessage(status, detail) {
  const lower = detail.toLowerCase();
  if (lower.includes('api key not valid') || lower.includes('api_key_invalid')) {
    return 'That Gemini API key is not valid. Check it in Settings.';
  }
  if (lower.includes('permission') || status === 403) {
    return 'This Gemini key is not permitted to use the Generative Language API.';
  }
  return `Gemini rejected the request (HTTP ${status}).`;
}

/* ------------------------------------------------------------------ prompts */

const LANGUAGE_RULES = `The audio is from a Japanese workplace. Expect Japanese as the main
language, with English technical terms mixed in mid-sentence, and occasionally Nepali (the
listener is Nepali). A single sentence may switch language more than once — transcribe each
part in its own script and never silently drop a language you are unsure of.

Write Japanese in normal Japanese script (kanji + kana), Nepali in Devanagari, English in Latin.
Do not romanise Japanese or Nepali.`;

const transcribePrompt = ({ offsetSeconds, context }) => `You are transcribing one segment of a
longer workplace recording. This segment starts at ${formatClock(offsetSeconds)} in the session.

${LANGUAGE_RULES}

${context ? `Context from earlier in the session (for names and terminology only):\n${context}\n` : ''}
Separate speakers as best you can and label them S1, S2, S3… Keep the same label for the same
voice across the segment. If a speaker's role is obvious (chair, manager, the Nepali listener),
note it in speaker_role, otherwise leave it empty.

If the segment is silence, noise, or has no intelligible speech, return an empty segments array
rather than inventing content.

Return JSON:
{
  "detected_languages": ["Japanese","English"],
  "confidence": 0.0-1.0,
  "segments": [
    {
      "speaker": "S1",
      "speaker_role": "",
      "at": "M:SS relative to the start of THIS segment",
      "original": "verbatim text in the original language(s)",
      "english": "natural English translation; repeat the text if already English"
    }
  ]
}`;

const digestPrompt = (transcript) => `Condense this portion of a workplace recording into a dense
note that a later pass will use to write the full summary. Preserve every name, number, date,
system name, decision and commitment. Drop small talk and filler.

Transcript portion:
${transcript}

Return JSON:
{
  "period": "short label for what this stretch was about",
  "notes": "dense paragraph of what happened, in English",
  "decisions": ["decision made"],
  "commitments": [{"who":"S1 or name","what":"what they committed to","when":"if stated"}],
  "japanese_terms": [{"term":"日本語","reading":"kana","meaning":"English meaning"}],
  "tone_notes": "how people sounded and behaved — hesitation, pushback, agreement, deference"
}`;

const analyzePrompt = ({ digests, profile, assumeNoJapanese }) => `You are the personal meeting
analyst for ${profile?.name || 'a Nepali engineer'} working at a Japanese company${
  profile?.role ? ` as ${profile.role}` : ''
}. They understand limited Japanese and rely on you to tell them what actually happened, what
people really meant, and what to do next.

Section notes from the recording, in order:
${digests}

${assumeNoJapanese ? 'Assume the reader knows almost no Japanese: explain every Japanese phrase you cite.' : ''}

Be concrete and specific — name the person, the system, the date. Where you are inferring rather
than reporting, say so in the confidence field instead of stating it as fact. Ground every
psychological read in something that was actually said.

Return JSON:
{
  "title": "short descriptive title for this session",
  "summary": "3-4 sentences: what this was and what came out of it",
  "detailed_summary": "several paragraphs, plain English",
  "project_status": "what is actually going on with the project right now, plainly stated",
  "timeline": [{"at":"H:MM","what":"what happened at this point"}],
  "key_points": ["point"],
  "decisions": ["decision that was actually settled"],
  "action_items_for_me": [{"what":"task","by_when":"if stated","why":"why it matters to you"}],
  "action_items_for_others": [{"who":"person","what":"task","by_when":""}],
  "open_questions": ["question left unresolved"],
  "speakers": [
    {
      "speaker": "S1",
      "likely_role": "best guess at their role",
      "tone": "how they came across",
      "intent": "what they were trying to achieve",
      "subtext": "what they likely meant but did not say outright",
      "psychology": [
        {
          "pattern": "named behaviour, e.g. indirect refusal, face-saving (建前), hedging, consensus-building (根回し), deference through keigo, escalating politeness under pressure",
          "evidence": "the quote or moment that shows it",
          "reading": "what it most likely means about what they think or want",
          "confidence": "high | medium | low"
        }
      ]
    }
  ],
  "japanese_glossary": [
    {
      "term": "日本語表現",
      "reading": "かな",
      "meaning": "English meaning",
      "politeness": "casual | polite | keigo | humble",
      "why_it_mattered": "what it signalled in this conversation"
    }
  ],
  "what_you_should_do": [{"do":"concrete next step","why":"reason","urgency":"today | this week | when you can"}],
  "questions_to_ask": ["question worth asking next time, with the Japanese if useful"],
  "risks": ["something aimed at you or your work that you may have missed"],
  "sentiment": "positive | neutral | negative | mixed",
  "caveats": "where the transcript was unclear or your reading is uncertain"
}`;

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

/* -------------------------------------------------------------------- calls */

export async function transcribeChunk({
  apiKey,
  model,
  audioBase64,
  mimeType,
  offsetSeconds = 0,
  context = '',
}) {
  const out = await callGemini({
    apiKey,
    model,
    parts: [
      { inlineData: { mimeType: mimeType || 'audio/aac', data: audioBase64 } },
      { text: transcribePrompt({ offsetSeconds, context }) },
    ],
  });

  return {
    detected_languages: asArray(out.detected_languages),
    confidence: typeof out.confidence === 'number' ? out.confidence : null,
    segments: asArray(out.segments)
      .filter((s) => s && (s.original || s.english))
      .map((s) => ({
        speaker: String(s.speaker || 'S1'),
        speaker_role: String(s.speaker_role || ''),
        at: String(s.at || '0:00'),
        original: String(s.original || ''),
        english: String(s.english || ''),
      })),
  };
}

export async function digestTranscript({ apiKey, model, transcript }) {
  return callGemini({ apiKey, model, parts: [{ text: digestPrompt(transcript) }] });
}

export async function analyzeSession({ apiKey, model, digests, profile, assumeNoJapanese }) {
  return callGemini({
    apiKey,
    model,
    parts: [{ text: analyzePrompt({ digests, profile, assumeNoJapanese }) }],
    maxOutputTokens: 16384,
  });
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}
