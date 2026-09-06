# Japanese Flashcards

Standalone study app (not part of the main portfolio React bundle).

- **Study:** multiple-choice quiz or classic flip cards, keyboard shortcuts
  (Space, 1-4, U to undo), Anki-compatible SM-2 scheduling
- **Learned:** every word already studied, across decks or one at a time —
  searchable, filtered by how well it is known (still learning / getting
  there / known well), with each word's recall strength and next review. A
  word can be put back into today's queue without losing its history.
- **Add cards:** word, meaning, optional hint & pronunciation
- **Storage:** AWS DynamoDB `AnkiFlashcards` (ap-southeast-2), single table
  with a `GSI1` index for the study queues

`GET /api/health` reports whether the table is reachable and, when it is not,
names the missing environment variable — start there if the deployed app shows
"Storage unavailable".

## Quick start

```bash
# Backend
cd flashcards/backend && npm install && cp .env.example .env && npm run dev

# Frontend (another terminal)
cd flashcards/frontend && npm install && npm run dev
```

From repo root:

```bash
npm run dev:flashcards-api
npm run dev:flashcards
```

## Production build (included in portfolio deploy)

```bash
npm run build:flashcards   # outputs to public/flashcards/
```

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for EC2, DynamoDB, Vercel, and testing.
