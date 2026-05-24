import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import recordingsRouter from './routes/recordings.js';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  const corsOptions =
    config.corsOrigins.length > 0
      ? { origin: config.corsOrigins, credentials: true }
      : { origin: true };
  app.use(cors(corsOptions));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'voice-transcriber-api',
      geminiConfigured: Boolean(config.geminiApiKey),
      model: config.geminiModel,
    });
  });

  app.use('/api/recordings', recordingsRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  app.use((err, _req, res, _next) => {
    console.error('[voice-ai]', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}
