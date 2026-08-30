import express from 'express';
import cors from 'cors';
import { config, TABLE_ARN } from './config.js';
import cardsRouter from './routes/cards.js';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '32kb' }));

  const corsOptions =
    config.corsOrigins.length > 0
      ? { origin: config.corsOrigins, credentials: true }
      : { origin: true };

  app.use(cors(corsOptions));

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'japanese-flashcards-api',
      region: config.awsRegion,
      table: config.tableName,
      tableArn: TABLE_ARN,
    });
  });

  app.use('/api/cards', cardsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    const status = err.statusCode || (err.$metadata?.httpStatusCode === 400 ? 400 : 500);
    res.status(status).json({
      error: status === 500 ? 'Internal server error' : err.message,
      message: config.nodeEnv === 'development' ? err.message : undefined,
    });
  });

  return app;
}
