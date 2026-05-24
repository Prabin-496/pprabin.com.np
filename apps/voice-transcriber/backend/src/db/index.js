import fs from 'fs';
import Database from 'better-sqlite3';
import { config } from '../config.js';
import { SCHEMA } from './schema.js';

let db;

export function getDb() {
  if (!db) {
    fs.mkdirSync(config.dataDir, { recursive: true });
    fs.mkdirSync(config.audioDir, { recursive: true });
    db = new Database(config.dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(SCHEMA);
  }
  return db;
}

export function rowToRecording(row) {
  if (!row) return null;
  let summary = null;
  let timestamps = [];
  try {
    if (row.summary_json) summary = JSON.parse(row.summary_json);
  } catch {
    /* ignore */
  }
  try {
    if (row.timestamps_json) timestamps = JSON.parse(row.timestamps_json);
  } catch {
    /* ignore */
  }
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    detected_language: row.detected_language,
    raw_transcript: row.raw_transcript,
    translated_english: row.translated_english,
    cleaned_english: row.cleaned_english,
    confidence: row.confidence,
    timestamps,
    summary,
    chunk_count: row.chunk_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
