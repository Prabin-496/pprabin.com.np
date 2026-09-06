/**
 * Drives a recording from raw audio to a finished analysis.
 *
 * Three passes, deliberately split so no single request is long or precious:
 *
 *   1. transcribe  one Gemini call per ~5 minute chunk
 *   2. digest      every 8 transcribed chunks, condensed to a section note
 *   3. analyse     one final call over the section notes
 *
 * The middle pass exists because an eight-hour transcript is far too much to
 * hand to one summarisation call — digesting as we go keeps every request small
 * and means the final prompt is a few pages instead of a few hundred.
 *
 * Every step commits its result to IndexedDB before moving on, so the run is
 * resumable at chunk granularity. Closing the tab, losing Wi-Fi, or iOS
 * evicting the page costs at most the chunk that was in flight.
 */

import * as api from './api';
import { ApiError } from './api';
import {
  chunkId,
  dropAudio,
  dropChunkAudio,
  getAudio,
  getChunkAudio,
  putChunkAudio,
  getSession,
  listChunks,
  patchSession,
  putAudio,
  putChunk,
  putChunks,
  putSegments,
  putSession,
} from './db';
import type { ChunkRow, SessionRow, Settings } from './db';
import { normaliseSegment, planSplit, silenceThreshold } from './split';
import type { SplitPlan } from './split';

/** Chunks per digest call. Eight ~5-minute chunks is about 40 minutes. */
const DIGEST_EVERY = 8;

/**
 * The Gemini free tier allows roughly 10 requests a minute. Pacing at ~7s
 * keeps the run under that without ever tripping a 429, which is far cheaper
 * than backing off after the fact.
 */
const MIN_REQUEST_GAP_MS = 7000;

const MAX_ATTEMPTS = 4;

export interface Progress {
  sessionId: string;
  phase: 'planning' | 'scanning' | 'transcribing' | 'summarising' | 'done' | 'error' | 'paused';
  chunkDone: number;
  chunkTotal: number;
  message: string;
  etaSeconds?: number;
}

export type ProgressHandler = (progress: Progress) => void;

export class MissingKeyError extends Error {}

/* ------------------------------------------------------------ run bookkeeping */

/** One run at a time: two concurrent runs would fight over the rate limit. */
let activeRun: { sessionId: string; cancel: () => void } | null = null;

export function activeSessionId(): string | null {
  return activeRun?.sessionId ?? null;
}

export function cancelRun(): void {
  activeRun?.cancel();
}

const sleep = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

class Pacer {
  private last = 0;

  async wait(): Promise<void> {
    const since = Date.now() - this.last;
    if (since < MIN_REQUEST_GAP_MS) await sleep(MIN_REQUEST_GAP_MS - since);
    this.last = Date.now();
  }

  /** After a 429 the next call waits longer, on top of the normal pacing. */
  penalise(attempt: number): Promise<void> {
    return sleep(Math.min(60_000, 5000 * 2 ** attempt));
  }
}

/* ---------------------------------------------------------------- importing */

export async function importFile(
  file: File,
  settings: Settings,
  onProgress?: ProgressHandler
): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();

  const session: SessionRow = {
    id,
    title: file.name.replace(/\.[^.]+$/, '') || 'Imported recording',
    source: 'import',
    status: 'planning',
    createdAt: now,
    updatedAt: now,
    chunkSeconds: settings.chunkSeconds,
    totalDurationSec: 0,
    chunkTotal: 0,
    chunkDone: 0,
    languages: [],
    digests: [],
    analysis: null,
  };
  await putSession(session);

  onProgress?.({
    sessionId: id,
    phase: 'planning',
    chunkDone: 0,
    chunkTotal: 0,
    message: 'Reading the recording…',
  });

  // The file is kept so a resumed run can re-read chunks it hasn't sent yet.
  // It is deleted as soon as the session completes.
  await putAudioSafely(id, file);

  const plan = await planSplit(file, settings.chunkSeconds);

  // Measure before transcribing so silent stretches are never uploaded. On a
  // workday this is what keeps the job inside the free tier — most of an
  // eight-hour recording is an empty room.
  const silent = await findSilentChunks(plan, (done, total) =>
    onProgress?.({
      sessionId: id,
      phase: 'scanning',
      chunkDone: done,
      chunkTotal: total,
      message: 'Checking which stretches have speech in them',
    })
  );

  const rows: ChunkRow[] = plan.specs.map((spec) => ({
    id: chunkId(id, spec.index),
    sessionId: id,
    index: spec.index,
    startSec: spec.startSec,
    durationSec: spec.durationSec,
    status: silent.has(spec.index) ? 'skipped' : 'pending',
    attempts: 0,
  }));

  await putChunks(rows);
  await patchSession(id, {
    status: 'transcribing',
    strategy: plan.strategy,
    mimeType: plan.mimeType,
    totalDurationSec: plan.totalDurationSec,
    chunkTotal: rows.length,
    chunkDone: rows.filter((row) => row.status === 'skipped').length,
  });

  return id;
}

/**
 * Which chunks are quiet enough to skip.
 *
 * The threshold comes from the recording itself rather than a fixed number, so
 * it adapts to how the phone was placed and how loud the room was. If levels
 * can't be measured at all — no audio decoder, or an unusual format — nothing
 * is skipped, because wrongly dropping a chunk loses a piece of the meeting
 * while wrongly keeping one only costs a request.
 */
async function findSilentChunks(
  plan: SplitPlan,
  onProgress: (done: number, total: number) => void
): Promise<Set<number>> {
  const levels: (number | null)[] = [];

  for (const spec of plan.specs) {
    onProgress(spec.index, plan.specs.length);
    try {
      levels.push(await plan.measureLevel(spec));
    } catch {
      levels.push(null);
    }
  }

  const threshold = silenceThreshold(levels);
  const silent = new Set<number>();

  levels.forEach((level, index) => {
    if (level !== null && isFinite(threshold) && level < threshold) silent.add(index);
  });

  // A recording that measures as silent throughout is more likely a measurement
  // problem than eight hours of nothing, so it is transcribed rather than dropped.
  return silent.size === plan.specs.length ? new Set() : silent;
}

/**
 * iOS can refuse a large write when storage is tight. That is not fatal — the
 * run simply can't be resumed after a reload — so it degrades rather than fails.
 */
async function putAudioSafely(sessionId: string, file: Blob): Promise<void> {
  try {
    await putAudio(sessionId, file);
  } catch (err) {
    console.warn('[pipeline] could not store source audio; run will not be resumable', err);
  }
}

/* --------------------------------------------------------------- live capture */

/**
 * A live session's chunks arrive over time rather than being planned up front,
 * so it starts empty and grows. Each finished segment is written to disk before
 * it is acknowledged, which is what lets a recording that gets interrupted
 * still be processed afterwards.
 */
export async function startLiveSession(settings: Settings, title?: string): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();

  await putSession({
    id,
    title: title || `Recording ${new Date().toLocaleString()}`,
    source: 'live',
    status: 'transcribing',
    createdAt: now,
    updatedAt: now,
    chunkSeconds: settings.chunkSeconds,
    totalDurationSec: 0,
    chunkTotal: 0,
    chunkDone: 0,
    languages: [],
    digests: [],
    analysis: null,
  });

  return id;
}

export async function appendLiveSegment(
  sessionId: string,
  segment: { index: number; blob: Blob; mimeType: string; startSec: number; durationSec: number; gapBefore: boolean }
): Promise<void> {
  // Safari records to MP4, which Gemini does not take inline; normalising here
  // means the transcription pass sees the same format from both capture paths.
  const normalised = await normaliseSegment(segment.blob, segment.mimeType);

  await putChunkAudio(sessionId, segment.index, normalised.blob);
  await putChunk({
    id: chunkId(sessionId, segment.index),
    sessionId,
    index: segment.index,
    startSec: segment.startSec,
    durationSec: segment.durationSec,
    status: 'pending',
    attempts: 0,
    mimeType: normalised.mimeType,
    gapBefore: segment.gapBefore,
  });

  const session = await getSession(sessionId);
  await patchSession(sessionId, {
    chunkTotal: Math.max(session?.chunkTotal || 0, segment.index + 1),
    totalDurationSec: segment.startSec + segment.durationSec,
  });
}

/* ------------------------------------------------------------------ running */

export async function runSession(
  sessionId: string,
  settings: Settings,
  onProgress?: ProgressHandler
): Promise<void> {
  if (activeRun) throw new Error('Another recording is already being processed.');
  if (!settings.apiKey.trim()) {
    throw new MissingKeyError('Add your Gemini API key in Settings before processing.');
  }

  let cancelled = false;
  activeRun = { sessionId, cancel: () => (cancelled = true) };

  const pacer = new Pacer();
  const report = (progress: Omit<Progress, 'sessionId'>) =>
    onProgress?.({ sessionId, ...progress });

  try {
    const session = await getSession(sessionId);
    if (!session) throw new Error('That session no longer exists.');

    const chunks = await listChunks(sessionId);

    // A chunk that exhausted its retries in an earlier run starts fresh here.
    // Its attempts were almost certainly spent on an outage that has since
    // passed, and without this a single bad afternoon would permanently lose
    // that stretch of the meeting.
    const pending = chunks
      .filter((chunk) => chunk.status === 'pending' || chunk.status === 'error')
      .map((chunk) => (chunk.status === 'error' ? { ...chunk, attempts: 0 } : chunk));

    // Reading audio is only needed while chunks are still outstanding. A run
    // resumed past transcription goes straight to summarising.
    const reader = pending.length ? await openReader(session) : null;

    let done = chunks.filter((chunk) => chunk.status !== 'pending' && chunk.status !== 'error').length;
    let context = '';
    let sentThisRun = 0;
    const startedAt = Date.now();

    for (const chunk of pending) {
      if (cancelled) {
        await patchSession(sessionId, { status: 'paused' });
        report({ phase: 'paused', chunkDone: done, chunkTotal: chunks.length, message: 'Paused' });
        return;
      }

      const spec = reader!.locate(chunk);
      if (!spec) continue;

      // ETA is measured from this run only: a resumed session has no useful
      // timing from whenever it was last interrupted.
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = pending.length - sentThisRun;

      report({
        phase: 'transcribing',
        chunkDone: done,
        chunkTotal: chunks.length,
        message: `Transcribing ${formatClock(spec.startSec)}–${formatClock(
          spec.startSec + spec.durationSec
        )}`,
        etaSeconds: sentThisRun ? Math.round((elapsed / sentThisRun) * remaining) : undefined,
      });

      const updated = await transcribeChunk({
        chunk,
        spec,
        read: () => reader!.read(chunk),
        settings,
        context,
        pacer,
        isCancelled: () => cancelled,
      });

      sentThisRun++;
      await putChunk(updated);

      if (updated.status === 'done' && updated.segments?.length) {
        await putSegments(sessionId, updated.index, updated.segments);
        context = buildContext(updated.segments, context);
      }

      if (updated.status === 'done' || updated.status === 'skipped') done++;
      await patchSession(sessionId, { chunkDone: done });

      if (updated.status === 'error' && updated.error?.startsWith('KEY:')) {
        throw new MissingKeyError(updated.error.slice(4));
      }
    }

    await summarise(sessionId, settings, pacer, report, () => cancelled);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await patchSession(sessionId, { status: 'error', error: message });
    report({ phase: 'error', chunkDone: 0, chunkTotal: 0, message });
    throw err;
  } finally {
    activeRun = null;
  }
}

/**
 * Where a chunk's bytes come from. An imported file is re-split on demand from
 * the stored source; a live recording already has each segment on disk.
 */
interface ChunkReader {
  locate(chunk: ChunkRow): { startSec: number; durationSec: number } | null;
  read(chunk: ChunkRow): Promise<{ blob: Blob; mimeType: string }>;
}

async function openReader(session: SessionRow): Promise<ChunkReader> {
  if (session.source === 'live') {
    return {
      locate: (chunk) => ({ startSec: chunk.startSec, durationSec: chunk.durationSec }),
      async read(chunk) {
        const blob = await getChunkAudio(session.id, chunk.index);
        if (!blob) throw new Error(`Segment ${chunk.index + 1} is missing from storage`);
        return { blob, mimeType: chunk.mimeType || 'audio/aac' };
      },
    };
  }

  const audio = await getAudio(session.id);
  if (!audio) {
    throw new Error(
      'The source audio for this session is gone, so the remaining chunks cannot be ' +
        'transcribed. Import the file again to finish it.'
    );
  }

  const plan: SplitPlan = await planSplit(audio, session.chunkSeconds);
  return {
    locate: (chunk) => plan.specs[chunk.index] || null,
    async read(chunk) {
      const spec = plan.specs[chunk.index];
      return { blob: await plan.read(spec), mimeType: plan.mimeType };
    },
  };
}

async function transcribeChunk(options: {
  chunk: ChunkRow;
  spec: { startSec: number; durationSec: number };
  read: () => Promise<{ blob: Blob; mimeType: string }>;
  settings: Settings;
  context: string;
  pacer: Pacer;
  isCancelled: () => boolean;
}): Promise<ChunkRow> {
  const { chunk, spec, read, settings, context, pacer, isCancelled } = options;
  let attempt = chunk.attempts;

  while (attempt < MAX_ATTEMPTS) {
    if (isCancelled()) return { ...chunk, attempts: attempt };

    try {
      await pacer.wait();
      const { blob, mimeType } = await read();

      const result = await api.transcribe({
        apiKey: settings.apiKey,
        model: settings.model,
        blob,
        mimeType,
        offsetSeconds: spec.startSec,
        context,
      });

      const segments = api.toSegments(result, spec.startSec);
      return {
        ...chunk,
        attempts: attempt + 1,
        // Gemini returning nothing for a chunk means silence or noise, which is
        // a normal outcome over a long day, not a failure.
        status: segments.length ? 'done' : 'skipped',
        error: undefined,
        segments,
        languages: result.detected_languages,
        confidence: result.confidence,
      };
    } catch (err) {
      attempt++;

      if (err instanceof ApiError && err.fatal) {
        return { ...chunk, attempts: attempt, status: 'error', error: `KEY:${err.message}` };
      }
      if (err instanceof ApiError && err.retryable && attempt < MAX_ATTEMPTS) {
        await pacer.penalise(attempt);
        continue;
      }
      if (attempt >= MAX_ATTEMPTS) {
        // One bad chunk must not sink the session; it is recorded and skipped,
        // and the transcript will show the gap.
        return {
          ...chunk,
          attempts: attempt,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  }

  return { ...chunk, attempts: attempt, status: 'error', error: 'Gave up after repeated failures' };
}

/**
 * A running list of names and terms, passed to later chunks so a person
 * introduced at 9am is still spelled the same way at 4pm. Deliberately short —
 * it travels on the query string.
 */
function buildContext(segments: { original: string; speakerRole: string }[], previous: string): string {
  const roles = segments.map((segment) => segment.speakerRole).filter(Boolean);
  const merged = [...new Set([...previous.split(' · ').filter(Boolean), ...roles])];
  return merged.join(' · ').slice(0, 500);
}

/* -------------------------------------------------------------- summarising */

async function summarise(
  sessionId: string,
  settings: Settings,
  pacer: Pacer,
  report: (progress: Omit<Progress, 'sessionId'>) => void,
  isCancelled: () => boolean
): Promise<void> {
  const chunks = await listChunks(sessionId);
  const withText = chunks.filter((chunk) => chunk.segments?.length);

  if (!withText.length) {
    await patchSession(sessionId, {
      status: 'done',
      error: 'No speech was found in this recording.',
    });
    report({ phase: 'done', chunkDone: chunks.length, chunkTotal: chunks.length, message: 'No speech found' });
    return;
  }

  await patchSession(sessionId, { status: 'summarising' });

  const groups: ChunkRow[][] = [];
  for (let i = 0; i < withText.length; i += DIGEST_EVERY) {
    groups.push(withText.slice(i, i + DIGEST_EVERY));
  }

  const digests: api.Digest[] = [];
  for (const [i, group] of groups.entries()) {
    if (isCancelled()) {
      await patchSession(sessionId, { status: 'paused' });
      report({ phase: 'paused', chunkDone: 0, chunkTotal: 0, message: 'Paused' });
      return;
    }

    report({
      phase: 'summarising',
      chunkDone: i,
      chunkTotal: groups.length,
      message: `Condensing section ${i + 1} of ${groups.length}`,
    });

    await pacer.wait();
    try {
      digests.push(
        await api.digest({
          apiKey: settings.apiKey,
          model: settings.model,
          transcript: renderTranscript(group),
        })
      );
    } catch (err) {
      // A lost section note costs detail, not the whole summary.
      console.warn('[pipeline] digest failed for section', i, err);
      digests.push({ period: `Section ${i + 1}`, notes: '(this section could not be condensed)' });
    }
  }

  await patchSession(sessionId, { digests });

  report({
    phase: 'summarising',
    chunkDone: groups.length,
    chunkTotal: groups.length,
    message: 'Writing the summary and reading the room…',
  });

  await pacer.wait();
  const analysis = await api.analyze({
    apiKey: settings.apiKey,
    model: settings.model,
    digests: renderDigests(digests),
    profile: { name: settings.profileName, role: settings.profileRole },
    assumeNoJapanese: settings.assumeNoJapanese,
  });

  const languages = [...new Set(chunks.flatMap((chunk) => chunk.languages || []))];
  const session = await getSession(sessionId);

  await patchSession(sessionId, {
    status: 'done',
    analysis,
    languages,
    error: undefined,
    title: analysis.title || session?.title || 'Recording',
    audioDropped: true,
  });

  // The audio has done its job and is by far the largest thing on disk.
  await dropAudio(sessionId);
  await dropChunkAudio(sessionId);

  report({
    phase: 'done',
    chunkDone: chunks.length,
    chunkTotal: chunks.length,
    message: 'Finished',
  });
}

function renderTranscript(chunks: ChunkRow[]): string {
  return chunks
    .flatMap((chunk) => chunk.segments || [])
    .map(
      (segment) =>
        `[${formatClock(segment.atSec)}] ${segment.speaker}${
          segment.speakerRole ? ` (${segment.speakerRole})` : ''
        }: ${segment.original}${segment.english ? `\n    EN: ${segment.english}` : ''}`
    )
    .join('\n');
}

function renderDigests(digests: api.Digest[]): string {
  return digests
    .map((digest, i) => {
      const lines = [`## Section ${i + 1}${digest.period ? ` — ${digest.period}` : ''}`];
      if (digest.notes) lines.push(digest.notes);
      if (digest.decisions?.length) lines.push(`Decisions: ${digest.decisions.join('; ')}`);
      if (digest.commitments?.length) {
        lines.push(
          `Commitments: ${digest.commitments
            .map((c) => `${c.who || '?'} — ${c.what || ''}${c.when ? ` (${c.when})` : ''}`)
            .join('; ')}`
        );
      }
      if (digest.japanese_terms?.length) {
        lines.push(
          `Japanese: ${digest.japanese_terms
            .map((t) => `${t.term}${t.reading ? `(${t.reading})` : ''} = ${t.meaning}`)
            .join('; ')}`
        );
      }
      if (digest.tone_notes) lines.push(`Tone: ${digest.tone_notes}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}
