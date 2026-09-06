import { getApiBaseUrl } from '@shared/getApiBaseUrl';
import type { SessionAnalysis, TranscriptSegment } from './db';

const API_BASE = getApiBaseUrl(import.meta.env.VITE_VOICE_AI_API_URL);

/**
 * Requests go to /api/voice?path=… rather than the prettier /api/recordings/…
 * rewrite. Both work, but this form reaches the function without depending on
 * Vercel's route rewriting to preserve the other query parameters.
 */
function url(path: string, params: Record<string, string | number> = {}): string {
  const search = new URLSearchParams({ path });
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== undefined && value !== null) search.set(key, String(value));
  }
  return `${API_BASE}/api/voice?${search}`;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }

  /** Worth waiting and trying the same chunk again. */
  get retryable(): boolean {
    return this.status === 429 || this.status >= 500 || this.status === 0;
  }

  /** No amount of retrying fixes a missing or rejected key. */
  get fatal(): boolean {
    return this.status === 401 || this.code === 'NO_API_KEY';
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let code: string | undefined;
    try {
      const body = await res.json();
      message = body.error || message;
      code = body.code;
    } catch {
      /* non-JSON error page */
    }
    throw new ApiError(message, res.status, code);
  }
  return res.json() as Promise<T>;
}

/** A dropped connection reads as status 0, which the queue treats as retryable. */
function networkError(err: unknown): never {
  if (err instanceof ApiError) throw err;
  throw new ApiError(
    err instanceof Error && err.name === 'AbortError'
      ? 'Request timed out'
      : 'No connection to the server',
    0
  );
}

export interface Health {
  ok: boolean;
  geminiConfigured: boolean;
  keyRequiredFromClient: boolean;
  model: string;
  models: string[];
}

export interface ChunkTranscript {
  detected_languages: string[];
  confidence: number | null;
  segments: {
    speaker: string;
    speaker_role: string;
    at: string;
    original: string;
    english: string;
  }[];
}

export async function health(): Promise<Health> {
  try {
    return await parse<Health>(await fetch(url('health')));
  } catch (err) {
    return networkError(err);
  }
}

/**
 * Uploads one chunk as raw bytes. Not base64 JSON: base64 would add a third to
 * every request for no benefit, and raw bytes keep the payload clear of any
 * body-parser size limit.
 */
export async function transcribe(options: {
  apiKey: string;
  model: string;
  blob: Blob;
  mimeType: string;
  offsetSeconds: number;
  context?: string;
  signal?: AbortSignal;
}): Promise<ChunkTranscript> {
  try {
    const res = await fetch(
      url('transcribe', {
        model: options.model,
        mime: options.mimeType,
        offset: Math.round(options.offsetSeconds),
        context: options.context || '',
      }),
      {
        method: 'POST',
        headers: { 'Content-Type': options.mimeType, 'x-gemini-key': options.apiKey },
        body: options.blob,
        signal: options.signal,
      }
    );
    const body = await parse<{ chunk: ChunkTranscript }>(res);
    return body.chunk;
  } catch (err) {
    return networkError(err);
  }
}

export interface Digest {
  period?: string;
  notes?: string;
  decisions?: string[];
  commitments?: { who?: string; what?: string; when?: string }[];
  japanese_terms?: { term?: string; reading?: string; meaning?: string }[];
  tone_notes?: string;
}

export async function digest(options: {
  apiKey: string;
  model: string;
  transcript: string;
}): Promise<Digest> {
  try {
    const res = await fetch(url('digest'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-gemini-key': options.apiKey },
      body: JSON.stringify({ model: options.model, transcript: options.transcript }),
    });
    const body = await parse<{ digest: Digest }>(res);
    return body.digest;
  } catch (err) {
    return networkError(err);
  }
}

export async function analyze(options: {
  apiKey: string;
  model: string;
  digests: string;
  profile: { name: string; role: string };
  assumeNoJapanese: boolean;
}): Promise<SessionAnalysis> {
  try {
    const res = await fetch(url('analyze'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-gemini-key': options.apiKey },
      body: JSON.stringify({
        model: options.model,
        digests: options.digests,
        profile: options.profile,
        assumeNoJapanese: options.assumeNoJapanese,
      }),
    });
    const body = await parse<{ analysis: SessionAnalysis }>(res);
    return body.analysis;
  } catch (err) {
    return networkError(err);
  }
}

/** "1:23" or "1:02:03" relative to a chunk start, to absolute seconds. */
export function toAbsoluteSeconds(at: string, offsetSeconds: number): number {
  const parts = String(at || '')
    .split(':')
    .map((p) => Number(p.trim()) || 0);
  const within = parts.reduce((total, part) => total * 60 + part, 0);
  return offsetSeconds + within;
}

export function toSegments(chunk: ChunkTranscript, offsetSeconds: number): TranscriptSegment[] {
  return chunk.segments.map((segment) => ({
    speaker: segment.speaker,
    speakerRole: segment.speaker_role,
    atSec: toAbsoluteSeconds(segment.at, offsetSeconds),
    original: segment.original,
    english: segment.english,
  }));
}
