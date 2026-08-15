# Voice AI — Personal Transcriber & Summarizer

**Isolated module.** Does not modify portfolio React code, routes, or dependencies.

| Layer | Path | Deploy |
|-------|------|--------|
| Frontend (PWA) | `frontend/` → `public/voice-ai/` | Vercel (static) |
| Backend (API) | `backend/` | Railway / EC2 / Docker |
| Data | `voice-ai-data/` | Same host as backend (SQLite + audio) |

## Architecture (non-breaking)

```
pprabin.com.np/                    ← existing portfolio (unchanged)
public/
  transcriber.html                 ← legacy page (unchanged)
  voice-ai/                        ← NEW built static app
apps/voice-transcriber/            ← NEW source (this folder)
  frontend/
  backend/
  voice-ai-data/                   ← gitignored runtime data
```

- Portfolio **footer** can link to `/voice-ai/` in a new tab (optional; not edited by default).
- **No** changes to `src/App.tsx`, `vite.config.ts` root deps, or `vercel.json` required.
- Optional root scripts: `npm run build:voice-ai`, `npm run dev:voice-ai`.

## Quick start

```bash
# 1. Env (never commit)
cp apps/voice-transcriber/.env.local.example apps/voice-transcriber/.env.local
# Edit: GEMINI_API_KEY=...

# 2. Backend
cd apps/voice-transcriber/backend && npm install && npm run dev

# 3. Frontend (new terminal)
cd apps/voice-transcriber/frontend && npm install && npm run dev
# Open http://localhost:5175/voice-ai/  — or http://localhost:5174/voice-ai/ via `npm run dev`
```

## Full guide

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for DynamoDB-free SQLite setup, EC2/Railway, Vercel env vars, PWA install, and testing checklist.
