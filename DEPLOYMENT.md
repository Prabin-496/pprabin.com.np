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
| `DOCS_PASSCODE` | No | Unlocks the private document vault. **Unset = vault stays locked.** |
| `DOCS_TOKEN_SECRET` | No | Signs vault access tokens; set a long random value |
| `PRIVATE_DOCS_BUCKET` | No | Private S3 bucket holding the vault documents |
| `PRIVATE_DOCS_REGION` | No | Defaults to `ap-southeast-2` |
| `PRIVATE_DOCS_ACCESS_KEY_ID` | No | IAM key scoped to that bucket |
| `PRIVATE_DOCS_SECRET_ACCESS_KEY` | No | IAM secret |

The document-vault variables are all optional: with `DOCS_PASSCODE` unset the
vault reports "not configured" and the rest of the site is unaffected. See
[docs/private-documents.md](docs/private-documents.md) for the full setup, and
read it before putting identity documents anywhere near this repo.

Without `RESEND_API_KEY` the contact form still works — messages are stored in
DynamoDB and readable at `/api/contact?key=<STUDY_PASSCODE>`.

## IAM

Do **not** reuse a broad admin key. Create a dedicated IAM user with only the
policy in [`api/_iam/anki-dynamodb-policy.json`](api/_iam/anki-dynamodb-policy.json),
which grants access to the `AnkiFlashcards` table and its `GSI1` index and
nothing else.

## Certificates

**To add a certificate: put the file in `public/certificates/` and push.**

That is the whole procedure. The build derives a title, an issuer and a category
from the filename, so a new file appears on the page grouped with its subject
without anyone editing a manifest.

```
public/certificates/CertificateOfCompletion_Learning Kubernetes.pdf
        │
        ├─ title     "Learning Kubernetes"      (download noise stripped, title-cased)
        ├─ issuer    "LinkedIn Learning"        (from the filename prefix)
        └─ category  "Cloud & Infrastructure"   (keyword match)
```

Accepted extensions: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`. Anything else in
the folder is ignored.

### When the guess is wrong

Add an entry to `src/content/certificate-overrides.ts`, keyed by filename. Every
field is optional — what you leave out keeps its derived value:

```ts
'microsoft-ai-skills-fest-badge.png': {
  title: 'Microsoft AI Skills Fest — Guinness World Record Attempt',
},
```

To teach the categoriser a new subject instead, add a keyword to `RULES` in
`scripts/certificate-meta.mjs`. Rule order matters and the first match wins —
the comment there explains the cases that depend on it.

### Warnings the build prints

| Message | Meaning |
|---|---|
| `did not match any category rule` | Filed under **Other**. Add a keyword or an override. |
| `same derived title for 2 files` | Two cards will look identical. Delete one, or retitle it. |
| `override … has no matching file` | Leftover override; safe to delete. |

These are warnings, not errors — a certificate never gets dropped silently, it
just lands in **Other** where you will notice it.

### Commands

```bash
npm run generate:certificates  # re-derive the manifest (build does this for you)
npm run check:certificates     # fail if the committed manifest is stale
npm run sync:certificates      # bulk-import from the messy download folder
```

`sync:certificates` copies from `portfolio/certificates/linkedin learning and
all/` (git-ignored, local only), skipping byte-identical duplicates and tidying
filenames. It never deletes anything already in `public/certificates/`.

`src/content/certificates.generated.ts` is written by these scripts. It is
committed so a fresh clone type-checks, but the build always regenerates it —
never edit it by hand.

The company/identity documents work completely differently: never committed,
never in `public/`. See [docs/private-documents.md](docs/private-documents.md).

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
npm run build
```

which runs, in order:

1. `generate:certificates` — re-derive the manifest from `public/certificates/`
2. `typecheck` — `tsc --noEmit`
3. `build:flashcards` → `public/flashcards`
4. `build:voice-ai` → `public/voice-ai`
5. `vite build` → `dist/`

Order matters: the sub-apps must build into `public/` before the root build
copies `public/` into `dist/`. Step 1 is what picks up a newly committed
certificate; step 2 is a gate that fails the build rather than shipping a type
error.
