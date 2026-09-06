# Setup — running the whole site on free plans

Everything (portfolio, contact form, flashcards, Voice AI) runs on **one Vercel
Hobby deployment** plus **one DynamoDB table** and the **Gemini free tier**.
There is no EC2 box, no nginx, and no second hosting account any more.

---

## 0. Revoke the leaked Gemini key — do this first

A real API key was committed to this repo in `apps/voice-transcriber/.env.local.example`
and is present in commits `8b75fd1`, `8762cd0`, and `50846c1`. It has been removed
from the working tree, but **git history still contains it**, so it must be
treated as compromised.

1. Delete it at <https://aistudio.google.com/apikey>
2. Create a new key
3. Use the new key for `GEMINI_API_KEY` below — never commit it

Scrubbing history (`git filter-repo`) is optional; revoking is what actually
closes the exposure.

---

## 1. Create the DynamoDB table

One table backs flashcards, contact messages, and voice recordings. The old
`Japanese_Flashcard` table has the wrong shape (`CardID` key, no index) — the
API needs `PK`/`SK` plus a `GSI1` index.

```bash
./scripts/create-dynamodb-table.sh            # AnkiFlashcards / ap-southeast-2
```

`PAY_PER_REQUEST` billing keeps an idle table at $0, inside the perpetual free
tier (25 GB storage, 25 RCU/WCU).

## 2. Create an IAM user

Create a programmatic-access IAM user and attach `infra/dynamodb-policy.json`
as an inline policy. It grants exactly the six DynamoDB actions the code uses
(`GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `BatchWriteItem`)
on the table **and its index**.

> The older `flashcards/backend/iam/dynamodb-policy.json` is missing `Query`,
> `UpdateItem`, and `BatchWriteItem` — do not use it.

Save the access key ID and secret; they go in the next step.

---

## 3. Environment variables

The fastest route — reads the AWS key pair from `~/.aws/credentials` and pipes
it into Vercel, so the secret is never typed into a terminal or pasted
anywhere:

```bash
npx vercel login                 # once
./scripts/setup-vercel-env.sh    # sets all four, offers a passcode + deploy
```

It also offers to set `STUDY_PASSCODE`. Do set one: without it, anyone who
opens the deployed site can edit or delete your decks.

To check what a deployment actually has, call `GET /api/health` — it reports
which of these variables are present (never their values) and the exact AWS
error if the table cannot be read.

### Or set them by hand (Vercel → Settings → Environment Variables)

### Required — flashcards, contact form, voice
| Variable | Value | Where to get it |
|---|---|---|
| `ANKI_AWS_ACCESS_KEY_ID` | from step 2 | AWS IAM |
| `ANKI_AWS_SECRET_ACCESS_KEY` | from step 2 | AWS IAM |
| `AWS_REGION_ANKI` | `ap-southeast-2` | — |
| `ANKI_TABLE_NAME` | `AnkiFlashcards` | step 1 |
| `GEMINI_API_KEY` | your **new** key | <https://aistudio.google.com/apikey> |

### Recommended
| Variable | Value | Notes |
|---|---|---|
| `STUDY_PASSCODE` | any string you pick | Gates all flashcard **writes** and reading stored contact messages. If unset the API is open. |
| `CONTACT_TO_EMAIL` | your inbox | Where contact-form mail is delivered |
| `RESEND_API_KEY` | <https://resend.com> | Free: 3,000 emails/month |

### Optional
| Variable | Default | Notes |
|---|---|---|
| `CONTACT_FROM_EMAIL` | `Portfolio <onboarding@resend.dev>` | Needs a verified domain in Resend to customise |
| `GEMINI_MODEL` | `gemini-2.5-flash` | — |
| `ANKI_TIMEZONE` | `Asia/Tokyo` | Controls the study-day rollover |
| `ANKI_ROLLOVER_HOUR` | `4` | Anki-style 4am day boundary |

### Do **not** set
`VITE_FLASHCARDS_API_URL` and `VITE_VOICE_AI_API_URL` must stay **empty**. Both
frontends now call the same origin. Setting them bakes a cross-origin host into
the committed bundles in `public/` — which is exactly how the dead EC2 URL got
shipped before.

The contact form degrades gracefully: without `RESEND_API_KEY` it still stores
every message in DynamoDB and returns success, so nothing is lost.

---

## 4. Deploy

```bash
npm run build     # builds flashcards + voice-ai into public/, then the portfolio
git add -A && git commit -m "..." && git push
```

`api/`, `src/sections/`, and `vercel.json` were previously **untracked**, which
is why production served an old commit with no API at all. They must be
committed for any of this to go live.

### Verify

```bash
curl -s https://www.pprabin.com.np/api/health      | head -c 200
curl -s https://www.pprabin.com.np/api/voice/health | head -c 200
```

Both must return **JSON**. HTML means the functions did not deploy and the SPA
catch-all is answering instead.

---

## Local development

```bash
npx vercel dev     # serves the site AND the api/ functions on one port
```

Plain `npm run dev` runs the portfolio only — `/api/*` will 404, because there
is no dev proxy. Put the same variables in a local `.env` for `vercel dev`.

---

## Architecture notes

**Voice AI was ported off EC2.** The Express + `better-sqlite3` backend needed a
persistent disk, which serverless does not have. Two things made the port clean:

- Stored audio was never served back to the browser — it was read once, handed
  to Gemini, and forgotten. So audio is now streamed straight through and never
  persisted at all.
- Uploads are base64 JSON instead of multipart, removing `multer` and the need
  to spool to disk. A 45-second Opus chunk is ~200 KB (~270 KB base64), far
  under Vercel's 4.5 MB request-body limit.

All `/api/recordings/*` routes are handled by the single `api/voice.js`
function. Vercel Hobby allows **12 serverless functions per deployment**; the
project now uses **10**. Splitting the voice routes across five files would have
put it at 13 and broken the deploy.

`apps/voice-transcriber/backend/` is now unused in production. It still works
for local development; delete it if you would rather not maintain two copies.

## Free-tier limits worth knowing

| Service | Limit |
|---|---|
| Vercel Hobby | 100 GB bandwidth/mo, 12 functions, 60s max duration |
| DynamoDB | 25 GB storage, perpetual; 25 RCU/WCU only in **provisioned** mode |
| Gemini API | free-tier rate limits per minute/day |
| Resend | 3,000 emails/mo, 100/day |

### What the flashcards actually cost

The `AnkiFlashcards` table is in **on-demand** mode. Storage (4.8 MB against a
25 GB perpetual allowance) is free; requests are not — on-demand has no
always-free request allowance, so reads are billed per use. The volume is what
matters, and the volume is tiny:

| Operation | Read units | Note |
|---|---|---|
| Answer a card | ~1.5 | was ~100 — the new-card count is now bounded by the daily cap instead of walking all 1,905 N2 cards |
| Load the deck screen | ~270 | counts every deck's unseen pile exactly, because the deck cards and the exam countdown both display it |
| Open the Learned screen | proportional to words **studied**, not deck size |

At a normal study pace that lands in the low tens of thousands of read units a
month, against pricing quoted per *million*. Removing the N3/N4/N5/kana decks
would cut the deck-screen figure by about half, but it is not worth doing for
cost reasons. If you want to anyway:

```bash
curl -X DELETE "https://www.pprabin.com.np/api/decks?deckId=jlpt-n3" \
  -H "X-Study-Key: <your STUDY_PASSCODE>"
```

They can always be reinstalled from the Decks screen — the vocabulary ships in
`api/_lib/data/`, and cards are keyed by word so nothing duplicates.

Switching the table to provisioned 25 RCU/25 WCU would make it literally $0,
but the deck screen's ~270-unit burst would throttle against a 25 RCU ceiling.
On-demand is the right mode here.
