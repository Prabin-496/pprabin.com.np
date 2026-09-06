/**
 * Voice transcriber API — the whole Express backend as one Vercel function.
 *
 * All /api/recordings/* paths are rewritten here by vercel.json. They are
 * handled in a single function on purpose: Vercel's Hobby plan allows 12
 * serverless functions per deployment, and splitting these five routes into
 * five files would put the project at the edge of that limit for no benefit.
 *
 * Audio is accepted as base64 JSON rather than multipart. The old backend used
 * multer to spool uploads to disk; serverless has no durable disk, and the
 * audio is only needed long enough to hand to Gemini, so it never touches one.
 * A 45-second Opus chunk is ~200 KB (~270 KB base64), well inside Vercel's
 * 4.5 MB request-body limit.
 */

import { handler, readBody, methodNotAllowed, badRequest, notFound } from './_lib/http.js';
import {
  geminiConfigured,
  geminiModel,
  transcribeAudioChunk,
  mergeChunkTranscripts,
  cleanAndSummarize,
} from './_lib/gemini.js';
import {
  createRecording,
  deleteRecording,
  getChunks,
  getRecording,
  listRecordings,
  putChunk,
  searchRecordings,
  touchRecording,
  updateRecording,
} from './_lib/voiceRepo.js';

export default handler(async (req, res) => {
  const segments = resolvePath(req);

  // /api/voice/health — reported separately from the flashcards health check.
  if (segments[0] === 'health') {
    if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
    return res.status(200).json({
      ok: true,
      service: 'voice-transcriber-api',
      geminiConfigured: geminiConfigured(),
      model: geminiModel,
    });
  }

  if (segments.length === 0) return collection(req, res);
  if (segments[0] === 'search') return search(req, res);

  const [id, action] = segments;
  if (!action) return single(req, res, id);
  if (action === 'chunks') return uploadChunk(req, res, id);
  if (action === 'finalize') return finalize(req, res, id);

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
      : new URL(req.url, 'http://localhost').pathname
          .replace(/^\/api\/(recordings|voice)\/?/, '');

  return raw.split('/').filter(Boolean).map(decodeURIComponent);
}

async function collection(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ recordings: await listRecordings() });
  }
  if (req.method === 'POST') {
    const { title } = readBody(req);
    return res.status(201).json({ recording: await createRecording(title) });
  }
  return methodNotAllowed(res, ['GET', 'POST']);
}

async function search(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const q = String(req.query?.q || '').trim();
  const recordings = q ? await searchRecordings(q) : await listRecordings();
  return res.status(200).json({ recordings });
}

async function single(req, res, id) {
  const recording = await getRecording(id);
  if (!recording) throw notFound();

  if (req.method === 'GET') {
    return res.status(200).json({ recording, chunks: await getChunks(id) });
  }
  if (req.method === 'DELETE') {
    await deleteRecording(id);
    return res.status(204).end();
  }
  return methodNotAllowed(res, ['GET', 'DELETE']);
}

async function uploadChunk(req, res, id) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const recording = await getRecording(id);
  if (!recording) throw notFound('Recording not found');

  const body = readBody(req);
  const audio = String(body.audio || '');
  if (!audio) throw badRequest('audio (base64) is required');

  const chunkIndex = Number(body.chunkIndex ?? 0);
  const mimeType = body.mimeType || 'audio/webm';

  try {
    const result = await transcribeAudioChunk(audio, mimeType);
    await putChunk(id, chunkIndex, {
      status: 'done',
      raw_transcript: result.raw_transcript ?? null,
      translated_english: result.translated_english ?? null,
      detected_language: result.detected_language ?? null,
      confidence: result.confidence ?? null,
    });
    const chunks = await getChunks(id);
    await touchRecording(id, chunks.length);
    return res.status(201).json({ chunk: { ...result, status: 'done' } });
  } catch (err) {
    // Record the failure so finalize can skip this chunk instead of stalling.
    await putChunk(id, chunkIndex, { status: 'error', error_message: err.message });
    throw err;
  }
}

async function finalize(req, res, id) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const recording = await getRecording(id);
  if (!recording) throw notFound('Recording not found');

  const chunks = await getChunks(id);
  if (!chunks.length) throw badRequest('No audio chunks to process');

  const done = chunks.filter((c) => c.status === 'done' && c.raw_transcript);
  if (!done.length) throw badRequest('No transcribed chunks available');

  await updateRecording(id, { status: 'processing' });

  // A single chunk is already coherent — merging it costs a Gemini call for nothing.
  const merged =
    done.length === 1
      ? {
          detected_language: done[0].detected_language,
          raw_transcript: done[0].raw_transcript,
          translated_english: done[0].translated_english,
          confidence: done[0].confidence,
          timestamps: [],
        }
      : await mergeChunkTranscripts(
          done.map((c) => ({
            index: c.chunk_index,
            raw: c.raw_transcript,
            english: c.translated_english,
            language: c.detected_language,
          }))
        );

  const analysis = await cleanAndSummarize({
    detected_language: merged.detected_language,
    raw_transcript: merged.raw_transcript,
    translated_english: merged.translated_english,
  });

  const updated = await updateRecording(id, {
    status: 'done',
    detected_language: merged.detected_language ?? null,
    raw_transcript: merged.raw_transcript ?? null,
    translated_english: merged.translated_english ?? null,
    cleaned_english: analysis.cleaned_english ?? null,
    confidence: merged.confidence ?? null,
    timestamps: merged.timestamps || [],
    summary: {
      summary: analysis.summary,
      detailed_summary: analysis.detailed_summary,
      key_points: analysis.key_points || [],
      action_items: analysis.action_items || [],
      important_terms: analysis.important_terms || [],
      detected_topics: analysis.detected_topics || [],
      language: analysis.language || merged.detected_language,
      sentiment: analysis.sentiment || 'neutral',
      follow_up_questions: analysis.follow_up_questions || [],
      meeting_notes: analysis.meeting_notes || '',
      vocabulary: analysis.vocabulary || [],
    },
  });

  return res.status(200).json({ recording: updated });
}
