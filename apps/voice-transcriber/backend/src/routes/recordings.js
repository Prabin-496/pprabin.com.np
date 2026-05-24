import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { config } from '../config.js';
import {
  createRecording,
  deleteRecording,
  finalizeRecording,
  getChunks,
  getRecording,
  listRecordings,
  saveChunk,
  searchRecordings,
} from '../services/recordings.js';

const upload = multer({
  dest: path.join(os.tmpdir(), 'voice-ai-uploads'),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024 },
});

const router = Router();

router.get('/', (_req, res) => {
  res.json({ recordings: listRecordings() });
});

router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ recordings: listRecordings() });
  res.json({ recordings: searchRecordings(q) });
});

router.post('/', (req, res) => {
  const title = req.body?.title;
  const recording = createRecording(title);
  res.status(201).json({ recording });
});

router.get('/:id', (req, res) => {
  const recording = getRecording(req.params.id);
  if (!recording) return res.status(404).json({ error: 'Not found' });
  const chunks = getChunks(req.params.id);
  res.json({ recording, chunks });
});

router.delete('/:id', (req, res) => {
  const recording = getRecording(req.params.id);
  if (!recording) return res.status(404).json({ error: 'Not found' });
  deleteRecording(req.params.id);
  res.status(204).send();
});

router.post('/:id/chunks', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'audio file required' });
    const chunkIndex = Number(req.body.chunkIndex ?? 0);
    const mimeType = req.body.mimeType || req.file.mimetype || 'audio/webm';
    const result = await saveChunk(req.params.id, chunkIndex, req.file, mimeType);
    res.status(201).json({ chunk: result });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
});

router.post('/:id/finalize', async (req, res, next) => {
  try {
    const recording = await finalizeRecording(req.params.id);
    res.json({ recording });
  } catch (err) {
    next(err);
  }
});

export default router;
