# Voice AI — Deployment & Setup Guide

## Prerequisites

- Node.js 18+
- [Google AI Studio](https://aistudio.google.com/) API key → ``
- Hosting: **Vercel** (frontend) + **Railway** or **EC2** (backend)

---

## 1. Environment variables

Create `apps/voice-transcriber/.env.local`:

```env
GEMINI_API_KEY=your_key_here
```

Backend also reads `apps/voice-transcriber/backend/.env` if you prefer.

**Never** put the key in frontend code or commit `.env.local`.

---

## 2. Local development

```bash
# Terminal A — API (port 4100)
cd apps/voice-transcriber/backend
npm install
npm run dev

# Terminal B — UI (port 5175, proxies /api → 4100)
cd apps/voice-transcriber/frontend
npm install
npm run dev
```

Open: http://localhost:5175/voice-ai/

---

## 3. Build frontend for portfolio deploy

```bash
cd apps/voice-transcriber/frontend
npm run build
```

Output: `public/voice-ai/` (served by Vercel with your portfolio).

From repo root (optional):

```bash
npm run build:voice-ai
```

**Note:** Main `npm run build` does **not** include voice-ai by default so portfolio builds stay unchanged. Add to CI when ready:

```json
"build": "npm run build:voice-ai && vite build"
```

---

## 4. Deploy backend on Railway (recommended, free tier friendly)

1. Push repo to GitHub.
2. Railway → New Project → Deploy from repo.
3. Root directory: `apps/voice-transcriber/backend`
4. Start command: `npm start`
5. Variables:
   - `GEMINI_API_KEY`
   - `PORT` (Railway sets automatically)
   - `CORS_ORIGINS=https://www.pprabin.com.np,https://pprabin.com.np`
6. Copy public URL → e.g. `https://voice-api-production.up.railway.app`

---

## 5. Deploy backend on EC2 (24/7 free tier)

1. Launch **t2.micro** in your preferred region.
2. Security group: inbound **4100** (or 80/443 behind Nginx).
3. Attach IAM role **not required** (no AWS services — SQLite is local disk).
4. SSH in:

```bash
sudo dnf install -y nodejs npm git
git clone <your-repo>
cd pprabin.com.np/apps/voice-transcriber/backend
npm ci
cp .env.example .env
nano .env   # GEMINI_API_KEY, CORS_ORIGINS
sudo npm install -g pm2
pm2 start src/server.js --name voice-ai
pm2 save && pm2 startup
```

5. Test: `curl http://YOUR_IP:4100/health`

---

## 6. Connect Vercel frontend to API

Vercel → Project → Environment Variables:

| Name | Value |
|------|--------|
| `VITE_VOICE_AI_API_URL` | `https://your-railway-or-ec2-url` |

Redeploy. Visit `https://www.pprabin.com.np/voice-ai/`

---

## 7. Portfolio footer link (optional)

Add without changing portfolio logic — only a new link in `Portfolio.tsx` footer:

```html
<a href="/voice-ai/" target="_blank" rel="noopener noreferrer">Voice AI</a>
```

Existing `/transcriber.html` stays as-is.

---

## 8. PWA (iPhone)

1. Open `/voice-ai/` in Safari.
2. Share → **Add to Home Screen**.
3. Service worker caches shell for offline UI (API still needs network).

**iOS limitation:** Recording stops when Safari is backgrounded. Keep screen active; chunks save every ~45s.

---

## 9. Testing checklist

- [ ] `GET /health` → `geminiConfigured: true`
- [ ] Record 10s → chunk uploads
- [ ] Stop → transcript + summary appear
- [ ] Japanese / English / Nepali sample (auto-detect)
- [ ] History search works
- [ ] Export TXT / JSON
- [ ] Delete recording
- [ ] PWA installs on iPhone
- [ ] No API key in browser Network tab (only calls your backend)

---

## 10. Docker (optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY apps/voice-transcriber/backend/package*.json ./
RUN npm ci --omit=dev
COPY apps/voice-transcriber/backend/ .
ENV PORT=4100
EXPOSE 4100
VOLUME ["/app/voice-ai-data"]
CMD ["node", "src/server.js"]
```

Mount volume for `voice-ai-data` persistence.

---

## Data location

- SQLite: `apps/voice-transcriber/voice-ai-data/voice-ai.db`
- Audio: `apps/voice-transcriber/voice-ai-data/audio/<recording-id>/`

Backed up with your server volume — not in git.
