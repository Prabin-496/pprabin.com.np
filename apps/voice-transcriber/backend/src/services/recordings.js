import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getDb, rowToRecording } from '../db/index.js';
import { config } from '../config.js';
import { transcribeAudioChunk, mergeChunkTranscripts, cleanAndSummarize } from './gemini.js';

const now = () => new Date().toISOString();

export function createRecording(title) {
  const id = randomUUID();
  const ts = now();
  getDb()
    .prepare(
      `INSERT INTO recordings (id, title, status, created_at, updated_at)
       VALUES (?, ?, 'recording', ?, ?)`
    )
    .run(id, title || `Recording ${new Date().toLocaleString()}`, ts, ts);
  return getRecording(id);
}

export function getRecording(id) {
  const row = getDb().prepare('SELECT * FROM recordings WHERE id = ?').get(id);
  return rowToRecording(row);
}

export function listRecordings() {
  const rows = getDb()
    .prepare('SELECT * FROM recordings ORDER BY created_at DESC')
    .all();
  return rows.map(rowToRecording);
}

export function deleteRecording(id) {
  const chunks = getDb()
    .prepare('SELECT audio_path FROM chunks WHERE recording_id = ?')
    .all(id);
  for (const c of chunks) {
    if (c.audio_path && fs.existsSync(c.audio_path)) fs.unlinkSync(c.audio_path);
  }
  const recDir = path.join(config.audioDir, id);
  if (fs.existsSync(recDir)) fs.rmSync(recDir, { recursive: true, force: true });
  getDb().prepare('DELETE FROM chunks WHERE recording_id = ?').run(id);
  getDb().prepare('DELETE FROM recordings WHERE id = ?').run(id);
}

export function getChunks(recordingId) {
  return getDb()
    .prepare('SELECT * FROM chunks WHERE recording_id = ? ORDER BY chunk_index')
    .all(recordingId);
}

export async function saveChunk(recordingId, chunkIndex, file, mimeType) {
  const db = getDb();
  const rec = db.prepare('SELECT id FROM recordings WHERE id = ?').get(recordingId);
  if (!rec) throw new Error('Recording not found');

  const chunkId = randomUUID();
  const dir = path.join(config.audioDir, recordingId);
  fs.mkdirSync(dir, { recursive: true });
  const ext = mimeType?.includes('mp4') ? 'm4a' : 'webm';
  const audioPath = path.join(dir, `chunk-${String(chunkIndex).padStart(4, '0')}.${ext}`);
  fs.renameSync(file.path, audioPath);

  const ts = now();
  db.prepare(
    `INSERT INTO chunks (id, recording_id, chunk_index, audio_path, status, created_at)
     VALUES (?, ?, ?, ?, 'processing', ?)`
  ).run(chunkId, recordingId, chunkIndex, audioPath, ts);

  try {
    const result = await transcribeAudioChunk(audioPath, mimeType);
    db.prepare(
      `UPDATE chunks SET status = 'done', raw_transcript = ?, translated_english = ?,
       detected_language = ?, confidence = ?, error_message = NULL WHERE id = ?`
    ).run(
      result.raw_transcript,
      result.translated_english,
      result.detected_language,
      result.confidence ?? null,
      chunkId
    );
    db.prepare(
      `UPDATE recordings SET chunk_count = (SELECT COUNT(*) FROM chunks WHERE recording_id = ?),
       updated_at = ? WHERE id = ?`
    ).run(recordingId, ts, recordingId);
    return { chunkId, ...result, status: 'done' };
  } catch (err) {
    db.prepare(`UPDATE chunks SET status = 'error', error_message = ? WHERE id = ?`).run(
      err.message,
      chunkId
    );
    throw err;
  }
}

export async function finalizeRecording(recordingId) {
  const db = getDb();
  const chunks = getChunks(recordingId);
  if (!chunks.length) throw new Error('No audio chunks to process');

  const doneChunks = chunks.filter((c) => c.status === 'done' && c.raw_transcript);
  if (!doneChunks.length) throw new Error('No transcribed chunks available');

  db.prepare(`UPDATE recordings SET status = 'processing', updated_at = ? WHERE id = ?`).run(
    now(),
    recordingId
  );

  let merged;
  if (doneChunks.length === 1) {
    merged = {
      detected_language: doneChunks[0].detected_language,
      raw_transcript: doneChunks[0].raw_transcript,
      translated_english: doneChunks[0].translated_english,
      confidence: doneChunks[0].confidence,
      timestamps: [],
    };
  } else {
    merged = await mergeChunkTranscripts(
      doneChunks.map((c) => ({
        index: c.chunk_index,
        raw: c.raw_transcript,
        english: c.translated_english,
        language: c.detected_language,
      }))
    );
  }

  const analysis = await cleanAndSummarize({
    detected_language: merged.detected_language,
    raw_transcript: merged.raw_transcript,
    translated_english: merged.translated_english,
  });

  const summaryPayload = {
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
  };

  const ts = now();
  db.prepare(
    `UPDATE recordings SET
      status = 'done',
      detected_language = ?,
      raw_transcript = ?,
      translated_english = ?,
      cleaned_english = ?,
      confidence = ?,
      timestamps_json = ?,
      summary_json = ?,
      updated_at = ?
     WHERE id = ?`
  ).run(
    merged.detected_language,
    merged.raw_transcript,
    merged.translated_english,
    analysis.cleaned_english,
    merged.confidence ?? null,
    JSON.stringify(merged.timestamps || []),
    JSON.stringify(summaryPayload),
    ts,
    recordingId
  );

  return getRecording(recordingId);
}

export function searchRecordings(query) {
  const q = `%${query}%`;
  const rows = getDb()
    .prepare(
      `SELECT * FROM recordings WHERE
        raw_transcript LIKE ? OR translated_english LIKE ? OR cleaned_english LIKE ?
        OR title LIKE ? OR summary_json LIKE ?
       ORDER BY created_at DESC`
    )
    .all(q, q, q, q, q);
  return rows.map(rowToRecording);
}
