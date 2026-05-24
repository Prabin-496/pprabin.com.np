/** SQLite schema — personal single-user storage */

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS recordings (
  id TEXT PRIMARY KEY,
  title TEXT,
  status TEXT DEFAULT 'recording',
  detected_language TEXT,
  raw_transcript TEXT,
  translated_english TEXT,
  cleaned_english TEXT,
  confidence REAL,
  timestamps_json TEXT,
  summary_json TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  recording_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  audio_path TEXT,
  raw_transcript TEXT,
  translated_english TEXT,
  detected_language TEXT,
  confidence REAL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chunks_recording ON chunks(recording_id);
CREATE INDEX IF NOT EXISTS idx_recordings_created ON recordings(created_at DESC);
`;
