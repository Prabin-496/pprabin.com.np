import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.resolve(__dirname, 'public');
const apiRoot = path.resolve(__dirname, 'api');

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

/**
 * Run `api/*.js` as request handlers during `vite dev` / `vite preview`.
 *
 * In production Vercel executes these files as Serverless Functions. Vite knows
 * nothing about that convention, so without this plugin it resolves `/api/health`
 * to `api/health.js` and serves the module *source* as `text/javascript` — the
 * client then tries to JSON.parse `import { handler } ...` and fails.
 *
 * This mounts the same handlers in-process and adapts Node's req/res to the
 * small Vercel-style surface they expect (`req.query`, `req.body`,
 * `res.status().json()`), so local dev matches deployed behaviour.
 */
function apiFunctions(): Plugin {
  const handleApi = async (req: any, res: any, next: () => void) => {
    const rawUrl: string = req.url ?? '';
    if (!rawUrl.startsWith('/api/')) return next();

    const url = new URL(rawUrl, 'http://localhost');
    // Strip the /api/ prefix and any trailing slash to get the module name.
    const name = url.pathname.slice(5).replace(/\/+$/, '');

    // Never expose shared modules (api/_lib/**) as routes.
    if (!name || name.startsWith('_') || name.includes('..')) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const file = path.join(apiRoot, `${name}.js`);
    if (!fs.existsSync(file)) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: `No API route /api/${name}` }));
      return;
    }

    req.query = Object.fromEntries(url.searchParams);

    let raw = '';
    for await (const chunk of req) raw += chunk;
    if (raw) {
      try {
        req.body = JSON.parse(raw);
      } catch {
        req.body = raw;
      }
    }

    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (payload: unknown) => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(payload));
      return res;
    };

    try {
      // Cache-bust so edits to api/ take effect without restarting the server.
      const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
      await mod.default(req, res);
    } catch (err) {
      const error = err as Error;
      console.error(`[api] ${rawUrl}`, error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: error.message }));
      }
    }
  };

  return {
    name: 'api-functions',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(handleApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApi);
    },
  };
}

export default defineConfig({
  plugins: [apiFunctions(), publicSubappRewrites(), react()],
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
});
