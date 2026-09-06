/**
 * IndexedDB is the source of truth for this app — there is no server database.
 *
 * Everything the app knows lives here: sessions, per-chunk state, transcript
 * segments, the final analysis, and (while a job is running) the source audio
 * file itself. Keeping progress on disk rather than in memory is what makes a
 * multi-hour import survive a reload, a crash, or iOS evicting the tab: on the
 * next open the pipeline reads the chunk rows and carries on from the first one
 * that isn't done.
 *
 * Sessions are pruned after a retention window so old meetings don't
 * accumulate, and the source audio is deleted the moment a session finishes —
 * it is by far the largest thing stored, and it has no use after transcription.
 */

const DB_NAME = 'voice-ai';
const DB_VERSION = 2;

export const STORES = {
  sessions: 'sessions',
  chunks: 'chunks',
  segments: 'segments',
  audio: 'audio',
  chunkAudio: 'chunkAudio',
  settings: 'settings',
} as const;

export type SessionStatus =
  | 'planning'
  | 'transcribing'
  | 'summarising'
  | 'done'
  | 'paused'
  | 'error';

export type ChunkStatus = 'pending' | 'done' | 'skipped' | 'error';

export interface TranscriptSegment {
  speaker: string;
  speakerRole: string;
  atSec: number;
  original: string;
  english: string;
}

export interface ChunkRow {
  id: string;
  sessionId: string;
  index: number;
  startSec: number;
  durationSec: number;
  status: ChunkStatus;
  attempts: number;
  /** Live recording only: the container MediaRecorder produced for this segment. */
  mimeType?: string;
  /** Live recording only: audio was lost before this segment (app was suspended). */
  gapBefore?: boolean;
  error?: string;
  segments?: TranscriptSegment[];
  languages?: string[];
  confidence?: number | null;
}

export interface SessionRow {
  id: string;
  title: string;
  source: 'import' | 'live';
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
  strategy?: string;
  mimeType?: string;
  chunkSeconds: number;
  totalDurationSec: number;
  chunkTotal: number;
  chunkDone: number;
  languages: string[];
  digests: unknown[];
  analysis: SessionAnalysis | null;
  error?: string;
  /** Set when the source audio has been dropped after a completed run. */
  audioDropped?: boolean;
}

export interface SessionAnalysis {
  title?: string;
  summary?: string;
  detailed_summary?: string;
  project_status?: string;
  timeline?: { at?: string; what?: string }[];
  key_points?: string[];
  decisions?: string[];
  action_items_for_me?: { what?: string; by_when?: string; why?: string }[];
  action_items_for_others?: { who?: string; what?: string; by_when?: string }[];
  open_questions?: string[];
  speakers?: {
    speaker?: string;
    likely_role?: string;
    tone?: string;
    intent?: string;
    subtext?: string;
    psychology?: { pattern?: string; evidence?: string; reading?: string; confidence?: string }[];
  }[];
  japanese_glossary?: {
    term?: string;
    reading?: string;
    meaning?: string;
    politeness?: string;
    why_it_mattered?: string;
  }[];
  what_you_should_do?: { do?: string; why?: string; urgency?: string }[];
  questions_to_ask?: string[];
  risks?: string[];
  sentiment?: string;
  caveats?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.sessions)) {
        db.createObjectStore(STORES.sessions, { keyPath: 'id' }).createIndex(
          'createdAt',
          'createdAt'
        );
      }
      if (!db.objectStoreNames.contains(STORES.chunks)) {
        db.createObjectStore(STORES.chunks, { keyPath: 'id' }).createIndex(
          'sessionId',
          'sessionId'
        );
      }
      if (!db.objectStoreNames.contains(STORES.segments)) {
        db.createObjectStore(STORES.segments, { keyPath: 'id' }).createIndex(
          'sessionId',
          'sessionId'
        );
      }
      if (!db.objectStoreNames.contains(STORES.audio)) {
        db.createObjectStore(STORES.audio, { keyPath: 'sessionId' });
      }
      if (!db.objectStoreNames.contains(STORES.chunkAudio)) {
        db.createObjectStore(STORES.chunkAudio, { keyPath: 'id' }).createIndex(
          'sessionId',
          'sessionId'
        );
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const request = work(tx.objectStore(store));
        let value: T;

        if (request) request.onsuccess = () => (value = request.result);
        tx.oncomplete = () => resolve(value as T);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

/** run() for writes whose result is the generated key, which callers ignore. */
async function runVoid(
  store: string,
  work: (store: IDBObjectStore) => unknown
): Promise<void> {
  await run(store, 'readwrite', (objectStore) => {
    work(objectStore);
  });
}

async function byIndex<T>(store: string, indexName: string, key: IDBValidKey): Promise<T[]> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).index(indexName).getAll(key);
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

/* ----------------------------------------------------------------- sessions */

export async function putSession(session: SessionRow): Promise<SessionRow> {
  const next = { ...session, updatedAt: Date.now() };
  await run(STORES.sessions, 'readwrite', (store) => store.put(next));
  return next;
}

export function getSession(id: string): Promise<SessionRow | undefined> {
  return run<SessionRow | undefined>(STORES.sessions, 'readonly', (store) => store.get(id));
}

export async function listSessions(): Promise<SessionRow[]> {
  const all = await run<SessionRow[]>(STORES.sessions, 'readonly', (store) => store.getAll());
  return (all || []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function patchSession(
  id: string,
  patch: Partial<SessionRow>
): Promise<SessionRow | undefined> {
  const existing = await getSession(id);
  if (!existing) return undefined;
  return putSession({ ...existing, ...patch });
}

export async function deleteSession(id: string): Promise<void> {
  const [chunks, segments] = await Promise.all([listChunks(id), listSegments(id)]);

  await run(STORES.sessions, 'readwrite', (store) => store.delete(id));
  await run(STORES.audio, 'readwrite', (store) => store.delete(id));
  await dropChunkAudio(id);
  await run(STORES.chunks, 'readwrite', (store) => {
    chunks.forEach((chunk) => store.delete(chunk.id));
  });
  await run(STORES.segments, 'readwrite', (store) => {
    segments.forEach((segment) => store.delete((segment as { id: string }).id));
  });
}

/* ------------------------------------------------------------------- chunks */

export const chunkId = (sessionId: string, index: number) => `${sessionId}:${index}`;

export function putChunks(chunks: ChunkRow[]): Promise<void> {
  return run(STORES.chunks, 'readwrite', (store) => {
    chunks.forEach((chunk) => store.put(chunk));
  });
}

export function putChunk(chunk: ChunkRow): Promise<void> {
  return runVoid(STORES.chunks, (store) => store.put(chunk));
}

export async function listChunks(sessionId: string): Promise<ChunkRow[]> {
  const rows = await byIndex<ChunkRow>(STORES.chunks, 'sessionId', sessionId);
  return rows.sort((a, b) => a.index - b.index);
}

/* ----------------------------------------------------------------- segments */

interface SegmentRow extends TranscriptSegment {
  id: string;
  sessionId: string;
  chunkIndex: number;
}

export function putSegments(
  sessionId: string,
  chunkIndex: number,
  segments: TranscriptSegment[]
): Promise<void> {
  const rows: SegmentRow[] = segments.map((segment, i) => ({
    ...segment,
    id: `${sessionId}:${chunkIndex}:${i}`,
    sessionId,
    chunkIndex,
  }));

  return run(STORES.segments, 'readwrite', (store) => {
    rows.forEach((row) => store.put(row));
  });
}

export async function listSegments(sessionId: string): Promise<SegmentRow[]> {
  const rows = await byIndex<SegmentRow>(STORES.segments, 'sessionId', sessionId);
  return rows.sort((a, b) => a.chunkIndex - b.chunkIndex || a.atSec - b.atSec);
}

/* -------------------------------------------------------------------- audio */

export function putAudio(sessionId: string, file: Blob): Promise<void> {
  return runVoid(STORES.audio, (store) => store.put({ sessionId, file, storedAt: Date.now() }));
}

export async function getAudio(sessionId: string): Promise<Blob | null> {
  const row = await run<{ file: Blob } | undefined>(STORES.audio, 'readonly', (store) =>
    store.get(sessionId)
  );
  return row?.file || null;
}

export function dropAudio(sessionId: string): Promise<void> {
  return runVoid(STORES.audio, (store) => store.delete(sessionId));
}

/**
 * Live recording stores one blob per segment instead of a single source file:
 * segments arrive one at a time over hours, and writing each straight to disk
 * means a crash costs the segment in progress rather than the whole session.
 */
export function putChunkAudio(sessionId: string, index: number, blob: Blob): Promise<void> {
  return runVoid(STORES.chunkAudio, (store) => store.put({ id: chunkId(sessionId, index), sessionId, index, blob }));
}

export async function getChunkAudio(sessionId: string, index: number): Promise<Blob | null> {
  const row = await run<{ blob: Blob } | undefined>(STORES.chunkAudio, 'readonly', (store) =>
    store.get(chunkId(sessionId, index))
  );
  return row?.blob || null;
}

export async function dropChunkAudio(sessionId: string): Promise<void> {
  const rows = await byIndex<{ id: string }>(STORES.chunkAudio, 'sessionId', sessionId);
  await run(STORES.chunkAudio, 'readwrite', (store) => {
    rows.forEach((row) => store.delete(row.id));
  });
}

/* ----------------------------------------------------------------- settings */

export interface Settings {
  apiKey: string;
  model: string;
  chunkSeconds: number;
  retentionDays: number;
  profileName: string;
  profileRole: string;
  assumeNoJapanese: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  chunkSeconds: 300,
  retentionDays: 7,
  profileName: '',
  profileRole: '',
  assumeNoJapanese: true,
};

export async function loadSettings(): Promise<Settings> {
  const row = await run<{ value: Partial<Settings> } | undefined>(
    STORES.settings,
    'readonly',
    (store) => store.get('settings')
  );
  return { ...DEFAULT_SETTINGS, ...(row?.value || {}) };
}

export function saveSettings(value: Settings): Promise<void> {
  return runVoid(STORES.settings, (store) => store.put({ key: 'settings', value }));
}

/* ---------------------------------------------------------------- retention */

/**
 * Drops sessions past the retention window, and frees the source audio of any
 * session that has finished. Runs on every app start — cheap, and it means
 * storage never grows without bound even if the app is left alone for weeks.
 */
export async function pruneOldSessions(retentionDays: number): Promise<number> {
  const sessions = await listSessions();
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const session of sessions) {
    if (retentionDays > 0 && session.createdAt < cutoff) {
      await deleteSession(session.id);
      removed++;
      continue;
    }
    if (session.status === 'done' && !session.audioDropped) {
      await dropAudio(session.id);
      await dropChunkAudio(session.id);
      await patchSession(session.id, { audioDropped: true });
    }
  }

  return removed;
}

/** Rough on-disk usage, for the Settings screen. Not supported everywhere. */
export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}
