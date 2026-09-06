/**
 * Voice transcriber API — a stateless proxy in front of Gemini.
 *
 * It deliberately stores nothing. Sessions, transcripts and analyses live in
 * IndexedDB in the browser, which means the app works the moment a Gemini key
 * is pasted into Settings: no database to provision, no AWS credentials, no
 * retention job, and no copy of anyone's meetings sitting on a server. The
 * earlier DynamoDB-backed version is what was returning 500 in production.
 *
 * Audio arrives as base64 JSON rather than multipart, because serverless has no
 * durable disk and the bytes are only needed long enough to hand to Gemini. The
 * client splits recordings into ~5 minute chunks, which stay comfortably inside
 * Vercel's 4.5 MB request-body limit once base64-expanded.
 *
 * Three routes, each one Gemini call, each well inside the 60s function budget.
 * The client drives the sequence and keeps the state, so a long session becomes
 * many short requests that can be retried or resumed individually.
 */

import {
  handler,
  readBody,
  readRawBody,
  methodNotAllowed,
  badRequest,
  notFound,
} from './_lib/http.js';
import {
  ALLOWED_MODELS,
  DEFAULT_MODEL,
  analyzeSession,
  digestTranscript,
  geminiConfigured,
  resolveKey,
  resolveModel,
  transcribeChunk,
} from './_lib/gemini.js';

export default handler(async (req, res) => {
  if (!applyCors(req, res)) return;
  if (req.method === 'OPTIONS') return res.status(204).end();

  const segments = resolvePath(req);
  const route = segments[0] || '';

  if (route === 'health') {
    if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
    return res.status(200).json({
      ok: true,
      service: 'voice-transcriber-api',
      stateless: true,
      geminiConfigured: geminiConfigured(),
      keyRequiredFromClient: !geminiConfigured(),
      model: DEFAULT_MODEL,
      models: ALLOWED_MODELS,
    });
  }

  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const apiKey = resolveKey(req.headers['x-gemini-key']);

  // Audio comes in as raw bytes with its metadata on the query string; the two
  // text routes are ordinary JSON.
  if (route === 'transcribe') return transcribe(req, res, apiKey);

  const body = readBody(req);
  const model = resolveModel(body.model);
  if (route === 'digest') return digest(res, { apiKey, model, body });
  if (route === 'analyze') return analyze(res, { apiKey, model, body });

  throw notFound();
});

/**
 * vercel.json passes the sub-path as ?path=. Parsing req.url is kept as a
 * fallback so the function still routes correctly if invoked directly.
 */
function resolvePath(req) {
  const fromQuery = req.query?.path;
  const raw =
    typeof fromQuery === 'string'
      ? fromQuery
      : new URL(req.url, 'http://localhost').pathname.replace(/^\/api\/(recordings|voice)\/?/, '');

  return raw.split('/').filter(Boolean).map(decodeURIComponent);
}

/**
 * Same-origin in production; localhost is allowed so the Vite dev server on
 * :5175 can reach a locally running API. Anything else is refused rather than
 * echoed back, so a server-side GEMINI_API_KEY can't be borrowed by another site.
 */
function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return true;

  const allowed = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || sameSite(req, origin);
  if (!allowed) {
    res.status(403).json({ error: 'Origin not allowed' });
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '86400');
  return true;
}

function sameSite(req, origin) {
  try {
    const host = req.headers.host || '';
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Formats Gemini accepts for inline audio. */
const AUDIO_MIME = new Set([
  'audio/aac',
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/flac',
  'audio/aiff',
  'audio/webm',
  'audio/mp4',
]);

async function transcribe(req, res, apiKey) {
  const audio = await readRawBody(req);
  if (!audio?.length) throw badRequest('Request body must be the raw audio bytes');

  const q = req.query || {};
  const mimeType = AUDIO_MIME.has(String(q.mime)) ? String(q.mime) : 'audio/aac';

  const result = await transcribeChunk({
    apiKey,
    model: resolveModel(q.model),
    audioBase64: audio.toString('base64'),
    mimeType,
    offsetSeconds: Number(q.offset) || 0,
    // A short list of names and jargon carried over from earlier chunks. Kept
    // tight because it rides on the query string, and percent-encoded Japanese
    // costs ~9 bytes a character against the URL length limit.
    context: String(q.context || '').slice(0, 600),
  });

  return res.status(200).json({ chunk: result });
}

async function digest(res, { apiKey, model, body }) {
  const transcript = String(body.transcript || '').trim();
  if (!transcript) throw badRequest('transcript is required');

  const result = await digestTranscript({ apiKey, model, transcript });
  return res.status(200).json({ digest: result });
}

async function analyze(res, { apiKey, model, body }) {
  const digests = String(body.digests || '').trim();
  if (!digests) throw badRequest('digests are required');

  const result = await analyzeSession({
    apiKey,
    model,
    digests,
    profile: body.profile || null,
    assumeNoJapanese: Boolean(body.assumeNoJapanese),
  });

  return res.status(200).json({ analysis: result });
}
