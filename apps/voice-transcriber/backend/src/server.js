import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { createApp } = await import('./app.js');
const { config } = await import('./config.js');

const app = createApp();

app.listen(config.port, () => {
  console.log(`Voice Transcriber API on port ${config.port}`);
  console.log(`Data: ${config.dataDir}`);
  console.log(`Gemini: ${config.geminiApiKey ? 'configured' : 'MISSING GEMINI_API_KEY'}`);
});
