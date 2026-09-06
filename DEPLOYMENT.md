# Deployment

The whole site — portfolio, flashcards, and voice AI — deploys as **one Vercel
project**. There is no separate API server: `/api/*` runs as Vercel Functions
in the same deployment, on the same origin.

```
pprabin.com.np/
  /                  portfolio (React + Vite)
  /flashcards        Anki-style study app  ──┐
  /voice-ai/         voice transcriber       ├─→ /api/* (Vercel Functions)
  /api/*             serverless API  ────────┘        │
                                                      └─→ DynamoDB: AnkiFlashcards
                                                          (ap-southeast-2)
```

Because the API is same-origin there is no CORS, no mixed-content problem, and
nothing to keep running between deploys.

## Required environment variables

Set these in **Vercel → Project → Settings → Environment Variables**.

| Variable | Required | Purpose |
|---|---|---|
| `ANKI_AWS_ACCESS_KEY_ID` | **Yes** | IAM user key for DynamoDB |
| `ANKI_AWS_SECRET_ACCESS_KEY` | **Yes** | IAM user secret |
| `AWS_REGION_ANKI` | No | Defaults to `ap-southeast-2` |
| `ANKI_TABLE_NAME` | No | Defaults to `AnkiFlashcards` |
| `ANKI_TIMEZONE` | No | Defaults to `Asia/Tokyo` |
| `ANKI_ROLLOVER_HOUR` | No | Study-day rollover hour, defaults to `4` |
| `STUDY_PASSCODE` | Recommended | Gates all writes. **If unset, anyone can edit your decks.** |
| `RESEND_API_KEY` | No | Enables contact-form email delivery |
| `CONTACT_TO_EMAIL` | No | Where contact messages are emailed |
| `CONTACT_FROM_EMAIL` | No | Verified sender address |

Without `RESEND_API_KEY` the contact form still works — messages are stored in
DynamoDB and readable at `/api/contact?key=<STUDY_PASSCODE>`.

## IAM

Do **not** reuse a broad admin key. Create a dedicated IAM user with only the
policy in [`api/_iam/anki-dynamodb-policy.json`](api/_iam/anki-dynamodb-policy.json),
which grants access to the `AnkiFlashcards` table and its `GSI1` index and
nothing else.

## Data model

Single-table design on `AnkiFlashcards` (`PK`/`SK`, plus `GSI1` for queue and
due lookups):

| Entity | PK | SK | GSI1PK | GSI1SK |
|---|---|---|---|---|
| Deck | `DECKS` | `DECK#<id>` | — | — |
| Card | `DECK#<id>` | `CARD#<id>` | `Q#<deck>#<queue>` | due / position |
| Review log | `LOG#<cardId>` | `<iso>#<nonce>` | `DAY#<date>` | `<iso>#<cardId>` |
| Daily counts | `STATS#<deck>` | `DAY#<date>` | — | — |
| Config | `CONFIG` | `GLOBAL` | — | — |
| Contact message | `CONTACT` | `<iso>#<id>` | — | — |

`GSI1` is what keeps the study queue off full-table scans — due cards come back
already sorted from a range query.

## Local development

```bash
npm install
npm run dev          # portfolio on :5174, /flashcards and /voice-ai rewritten
```

The frontends call `/api/*` on the same origin. To exercise the functions
locally, run `vercel dev` (which serves `api/` as functions) instead of
`npm run dev`.

## Build

```bash
npm run build        # flashcards → public/flashcards, voice-ai → public/voice-ai, then vite build
```

Order matters: the sub-apps must build into `public/` before the root build
copies `public/` into `dist/`.
