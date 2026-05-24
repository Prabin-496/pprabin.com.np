import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/voice-ai/',
  build: {
    outDir: path.resolve(__dirname, '../../../public/voice-ai'),
    emptyOutDir: true,
  },
  server: {
    port: 5175,
    proxy: {
      '/api': { target: 'http://localhost:4100', changeOrigin: true },
      '/health': { target: 'http://localhost:4100', changeOrigin: true },
    },
  },
});
