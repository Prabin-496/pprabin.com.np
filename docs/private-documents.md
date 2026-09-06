# Private document vault

The certificates section has two halves:

| | Where the files live | Who can read them |
|---|---|---|
| **Certificates** (51) | `public/certificates/`, committed | Anyone |
| **Company & legal documents** (13) | A private S3 bucket, never committed | Anyone with the passcode |

The second half holds a National ID, two PAN cards, a signature image and
company share records. This section is about keeping them that way.

## Why they are not in the repo

`github.com/Prabin-496/pprabin.com.np` is a **public** repository, and
`public/` is served by CDN with no authentication. A file in either place is
readable by anyone who knows or guesses the path, so a passcode in front of it
would be decoration, not protection. Git also keeps history: a document
committed once stays reachable after it is deleted.

So `.gitignore` excludes the source folder, and `/api/documents` reaches the
bytes at runtime instead.

## How access works

```
browser                         /api/documents                    S3
   │  POST { passcode }               │                            │
   ├─────────────────────────────────>│  constant-time compare     │
   │                                  │  rate limit per IP         │
   │<─── { token, expiresAt } ────────┤  (10 tries / 15 min)       │
   │                                  │                            │
   │  GET ?file=<key>&t=<token>       │                            │
   ├─────────────────────────────────>│  verify HMAC + expiry      │
   │                                  ├── presign (5 min) ────────>│
   │<─── 302 to presigned URL ────────┤                            │
```

- The passcode only ever travels in a **POST body**, so it never lands in an
  access log, browser history, or a `Referer` header.
- The token is an HMAC over its own expiry — it cannot be forged, and it grants
  nothing except "the passcode was correct recently".
- Presigned URLs expire in minutes, so a link that leaks is quickly useless.
- Attempts are counted in DynamoDB, because Vercel Functions are stateless and
  a four-digit code is only 10,000 guesses.

## Local development

No bucket needed. With `PRIVATE_DOCS_BUCKET` empty, `/api/documents` streams
straight from `portfolio/certificates/MMNT docs IMP need passport/`, so the UI
can be built and tested offline. `.env` already has:

```dotenv
DOCS_PASSCODE=<the code you chose>
DOCS_TOKEN_SECRET=<random hex>
PRIVATE_DOCS_BUCKET=
```

`.env` is gitignored and holds the real value. It is deliberately not written
down here — this file is committed to a public repository, so a passcode in it
would be published alongside the design that explains what it unlocks.

## Production setup

Until these steps are done the vault answers "not configured" and stays locked.
Nothing else on the site is affected.

**1. Create a private bucket**

```bash
aws s3api create-bucket \
  --bucket pprabin-private-docs \
  --region ap-southeast-2 \
  --create-bucket-configuration LocationConstraint=ap-southeast-2

aws s3api put-public-access-block \
  --bucket pprabin-private-docs \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

Blocking public access is the point of the exercise — do not skip it.

**2. Create an IAM user limited to that bucket**

Attach only `api/_iam/private-docs-policy.json`. It grants `s3:GetObject` and
`s3:PutObject` on that one bucket and nothing else.

**3. Upload**

```bash
PRIVATE_DOCS_BUCKET=pprabin-private-docs \
PRIVATE_DOCS_ACCESS_KEY_ID=AKIA... \
PRIVATE_DOCS_SECRET_ACCESS_KEY=... \
npm run upload:private-docs
```

Use `node scripts/upload-private-docs.mjs --dry-run` first to see the plan.

**4. Set the Vercel environment variables**

| Variable | Value |
|---|---|
| `DOCS_PASSCODE` | the code you chose (see `.env`) |
| `DOCS_TOKEN_SECRET` | a long random string (`openssl rand -hex 32`) |
| `PRIVATE_DOCS_BUCKET` | `pprabin-private-docs` |
| `PRIVATE_DOCS_REGION` | `ap-southeast-2` |
| `PRIVATE_DOCS_ACCESS_KEY_ID` | the IAM key |
| `PRIVATE_DOCS_SECRET_ACCESS_KEY` | the IAM secret |

`DOCS_PASSCODE` is intentionally absent from the code. Setting it in Vercel is
what turns the vault on.

## Changing the passcode

Change `DOCS_PASSCODE` in Vercel and redeploy. Nothing in the repo needs
touching. Rotating `DOCS_TOKEN_SECRET` at the same time invalidates any tokens
already handed out.

## A note on the threat model

Four digits is a convenience lock, not a security boundary. It is fine for
"don't show this to a casual visitor" and it is backed by rate limiting, but
anyone determined and patient can still get through 10,000 combinations across
enough time and IP addresses. For documents this sensitive, consider a longer
passcode — the implementation does not care how long it is.
