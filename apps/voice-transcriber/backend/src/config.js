import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseOrigins = (value) =>
  (value || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const dataDirEnv = process.env.DATA_DIR;
const dataDir = dataDirEnv
  ? path.isAbsolute(dataDirEnv)
    ? dataDirEnv
    : path.resolve(__dirname, '../../', dataDirEnv)
  : path.resolve(__dirname, '../../voice-ai-data');

export const config = {
  port: Number(process.env.PORT) || 4100,
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  dataDir,
  dbPath: path.join(dataDir, 'voice-ai.db'),
  audioDir: path.join(dataDir, 'audio'),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 60,
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 50,
};
