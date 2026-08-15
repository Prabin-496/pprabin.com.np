import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.resolve(__dirname, 'public');

const SUBAPP_INDEX: Record<string, string> = {
  '/voice-ai': 'voice-ai/index.html',
  '/voice-ai/': 'voice-ai/index.html',
  '/flashcards': 'flashcards/index.html',
  '/flashcards/': 'flashcards/index.html',
};

/**
 * Rewrite /voice-ai/ and /flashcards/ to their index.html BEFORE Vite SPA fallback.
 */
function publicSubappRewrites(): Plugin {
  const rewrite = (req: { url?: string }) => {
    const raw = req.url ?? '';
    const q = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
    const pathname = raw.split('?')[0];
    const rel = SUBAPP_INDEX[pathname];
    if (!rel) return;
    const filePath = path.join(publicRoot, rel);
    if (!fs.existsSync(filePath)) return;
    req.url = `/${rel}${q}`;
  };

  const middleware = (
    req: { url?: string },
    _res: unknown,
    next: () => void
  ) => {
    rewrite(req);
    next();
  };

  return {
    name: 'public-subapp-rewrites',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [publicSubappRewrites(), react()],
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
});
