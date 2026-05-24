# Japanese Flashcards

Standalone study app (not part of the main portfolio React bundle).

- **Study:** tap card to flip, keyboard shortcuts (Space, arrows)
- **Add cards:** word, meaning, optional hint & pronunciation
- **Storage:** AWS DynamoDB `Japanese_Flashcard` (ap-southeast-2)

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
