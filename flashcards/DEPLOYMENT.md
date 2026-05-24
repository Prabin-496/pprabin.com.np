# Japanese Flashcards — Deployment Guide (AWS Free Tier)

This app is **separate from your portfolio**. It has two parts:

| Part | Folder | Host |
|------|--------|------|
| Frontend (UI) | `flashcards/frontend/` → builds to `public/flashcards/` | **Vercel** (same repo as portfolio) |
| Backend (REST API) | `flashcards/backend/` | **EC2** t2.micro/t3.micro (free tier) |

**DynamoDB table (already created):**

`arn:aws:dynamodb:ap-southeast-2:417007889308:table/Japanese_Flashcard`

---

## 1. Verify DynamoDB table schema

In **AWS Console → DynamoDB → Tables → Japanese_Flashcard**:

1. **Partition key** must be: `CardID` (String).
2. No sort key required.
3. Billing: **On-demand** (pay per request) stays within free tier for personal use.

Optional attributes (created by the API when you add cards):

| Attribute | Type | Required |
|-----------|------|----------|
| `CardID` | String | Yes (auto UUID) |
| `word` | String | Yes |
| `meaning` | String | Yes |
| `hint` | String | No |
| `pronunciation` | String | No |
| `createdAt` | String | Auto (ISO date) |

If your table uses a different partition key name, update `flashcards/backend/src/services/dynamodb.js` `Key: { CardID }` to match.

---

## 2. IAM permissions (EC2 — recommended)

Do **not** put long-lived keys in code. On EC2, attach an **IAM role** to the instance.

1. IAM → **Roles** → Create role → **EC2**.
2. Attach inline policy (replace if your table name differs):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-southeast-2:417007889308:table/Japanese_Flashcard"
    }
  ]
}
```

3. When launching EC2, choose this role → leave `AWS_ACCESS_KEY_ID` empty in `.env`.

**Local development only:** copy `flashcards/backend/.env.example` to `.env` and use an IAM user with the same policy.

---

## 3. Deploy backend on EC2 (24/7, free tier)

### 3.1 Launch instance

1. **Region:** `ap-southeast-2` (same as DynamoDB).
2. **AMI:** Amazon Linux 2023.
3. **Instance type:** `t2.micro` or `t3.micro` (free tier eligible).
4. **Security group inbound:**
   - SSH `22` — your IP only
   - Custom TCP `4000` — `0.0.0.0/0` (or restrict to your IP while testing)
5. Attach the IAM role from step 2.
6. Create/use a key pair for SSH.

### 3.2 Install Node.js on EC2

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

sudo dnf install -y nodejs npm git
node -v   # should be 18+
```

### 3.3 Upload backend

**Option A — Git clone (easiest if repo is private/public):**

```bash
cd ~
git clone https://github.com/YOUR_USER/pprabin.com.np.git
cd pprabin.com.np/flashcards/backend
npm ci
cp .env.example .env
nano .env
```

**Option B — SCP from your Mac:**

```bash
scp -i your-key.pem -r flashcards/backend ec2-user@YOUR_EC2_IP:~/flashcards-backend
```

### 3.4 Configure `.env` on EC2

```env
PORT=4000
NODE_ENV=production
AWS_REGION=ap-southeast-2
DYNAMODB_TABLE_NAME=Japanese_Flashcard
CORS_ORIGINS=https://www.pprabin.com.np,https://pprabin.com.np
```

Do **not** set access keys if the instance has an IAM role.

### 3.5 Run with PM2 (keeps API running after logout)

```bash
sudo npm install -g pm2
cd ~/pprabin.com.np/flashcards/backend   # or your path
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # run the command it prints (sudo ...)
```

Check:

```bash
curl http://localhost:4000/health
```

From your laptop:

```bash
curl http://YOUR_EC2_PUBLIC_IP:4000/health
```

---

## 4. Connect frontend to API

### 4.1 Production (Vercel)

1. In **Vercel → Project → Settings → Environment Variables**, add:

   `VITE_FLASHCARDS_API_URL` = `http://YOUR_EC2_PUBLIC_IP:4000`

   (Use `https://api.yourdomain.com` if you add Nginx + SSL later.)

2. Rebuild and redeploy (push to GitHub or redeploy in Vercel).

3. Root build runs: `npm run build` → includes `build:flashcards`.

### 4.2 Local development

Terminal 1 — API:

```bash
cd flashcards/backend
cp .env.example .env
# add AWS credentials for local only
npm install
npm run dev
```

Terminal 2 — UI:

```bash
cd flashcards/frontend
npm install
npm run dev
```

Open `http://localhost:5174/flashcards/` — Vite proxies `/api` and `/health` to port 4000.

---

## 5. Portfolio footer link

Already added in `Portfolio.tsx`:

- **Japanese Flashcards** → `/flashcards/` (new tab)

After deploy, visit: `https://www.pprabin.com.np/flashcards/`

---

## 6. Auto-deploy on Git push

| What | How |
|------|-----|
| Frontend + static flashcards | Connect repo to **Vercel** — each push runs `npm run build` and deploys `dist/` including `public/flashcards/` |
| Backend on EC2 | **Manual or script:** SSH and `git pull && npm ci && pm2 restart flashcards-api` |

Optional: GitHub Action on `main` that SSHs to EC2 and restarts PM2 (store `EC2_HOST`, `SSH_KEY` as secrets).

---

## 7. Test checklist

1. `GET http://EC2_IP:4000/health` → `{ "ok": true, "table": "Japanese_Flashcard" }`
2. Open `/flashcards/` → status pill shows **API connected**
3. **Add card** → word + meaning → appears in Study and Deck
4. **Tap card** → flips to meaning / hint
5. AWS Console → DynamoDB → Explore items → see new `CardID` rows

---

## 8. Costs (free tier reminders)

- **DynamoDB:** 25 GB storage + on-demand read/write free tier monthly
- **EC2:** 750 hours/month of t2.micro (one instance 24/7 ≈ one month)
- **Data transfer:** first 100 GB out/month free (varies by region)
- **Vercel:** hobby tier for static frontend

Stop EC2 when not needed to save hours if you exceed free tier.

---

## 9. Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error in browser | Add your exact site URL to `CORS_ORIGINS` on EC2, restart PM2 |
| `AccessDeniedException` | IAM role policy + same region `ap-southeast-2` |
| API offline on site | Check security group port 4000, PM2 status (`pm2 list`) |
| Empty deck but no error | Table name mismatch in `.env` |
| Build missing flashcards | Run `npm run build:flashcards` before `vite build` |

---

## 10. Optional: HTTPS API (recommended later)

1. Point subdomain `api.pprabin.com.np` to EC2 IP.
2. Install Nginx + Let's Encrypt (Certbot).
3. Proxy `443` → `localhost:4000`.
4. Set `VITE_FLASHCARDS_API_URL=https://api.pprabin.com.np`.

---

## Folder structure

```
flashcards/
  DEPLOYMENT.md          ← this guide
  backend/               ← Express + AWS SDK (deploy to EC2)
    src/
    ecosystem.config.cjs
    .env.example
  frontend/              ← React UI (build → public/flashcards/)
public/
  flashcards/            ← generated by build (do not edit by hand)
```
