/**
 * Passcode-gated access to the private document vault.
 *
 *   POST /api/documents  { passcode }        -> { token, expiresAt, available }
 *   GET  /api/documents?file=<key>&t=<token> -> the document itself
 *
 * Two steps rather than one because the second URL has to be usable directly as
 * an `<iframe>` or `<img>` source. The passcode is only ever sent in a POST
 * body, so it never reaches an access log, browser history, or a Referer
 * header; what does travel in the URL is a signed token that expires in
 * minutes and grants nothing else.
 *
 * In production the GET redirects to a presigned S3 URL. Locally, where no
 * bucket is configured, it streams from the original download folder, so the UI
 * can be built and tested without touching AWS.
 */

import fs from 'node:fs';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  KEY_MAP,
  URL_TTL_SECONDS,
  contentTypeFor,
  isKnownKey,
  localPathFor,
  presign,
  s3Configured,
} from './_lib/privateDocs.js';
import { handler, readBody, methodNotAllowed } from './_lib/http.js';
import { clientId, hit } from './_lib/rateLimit.js';

/**
 * Never hardcoded: this repo is public, so a literal here would be the same as
 * having no passcode at all. Set DOCS_PASSCODE in Vercel and in `.env` locally.
 */
const PASSCODE = process.env.DOCS_PASSCODE || '';

/**
 * Signing key for access tokens. A per-boot random fallback keeps tokens
 * unforgeable when the env var is missing; the cost is that tokens stop working
 * across cold starts, which is a visible annoyance rather than a silent hole.
 */
const TOKEN_SECRET = process.env.DOCS_TOKEN_SECRET || randomBytes(32).toString('hex');

const TOKEN_TTL_SECONDS = Number(process.env.DOCS_TOKEN_TTL || 900);

function sign(expiry) {
  const mac = createHmac('sha256', TOKEN_SECRET).update(String(expiry)).digest('base64url');
  return `${expiry}.${mac}`;
}

function tokenValid(token) {
  const [expiry, mac] = String(token ?? '').split('.');
  if (!expiry || !mac) return false;
  if (!/^\d+$/.test(expiry) || Number(expiry) < Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(
    createHmac('sha256', TOKEN_SECRET).update(expiry).digest('base64url'),
    'utf8'
  );
  const given = Buffer.from(mac, 'utf8');
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

/** Constant-time compare so response timing cannot leak the passcode. */
function passcodeMatches(provided) {
  const a = Buffer.from(String(provided ?? ''), 'utf8');
  const b = Buffer.from(PASSCODE, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function vaultUnavailable(res) {
  res.status(503).json({
    error: 'The document vault is not configured on this deployment.',
    code: 'VAULT_NOT_CONFIGURED',
  });
}

export default handler(async (req, res) => {
  // Nothing in this route should ever be cached or indexed.
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method === 'GET') return serveDocument(req, res);
  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);

  if (!PASSCODE) return vaultUnavailable(res);

  const gate = await hit('docs-passcode', clientId(req), { limit: 10, windowSeconds: 900 });
  if (!gate.allowed) {
    res.setHeader('Retry-After', String(gate.retryAfter));
    res.status(429).json({
      error: 'Too many attempts. Try again in a few minutes.',
      code: 'RATE_LIMITED',
      retryAfter: gate.retryAfter,
    });
    return;
  }

  const body = readBody(req);
  if (!passcodeMatches(body.passcode)) {
    res.status(401).json({
      error: 'Incorrect passcode.',
      code: 'BAD_PASSCODE',
      attemptsRemaining: gate.remaining,
    });
    return;
  }

  // Report only the keys this deployment can actually serve, so the UI can grey
  // out anything not yet uploaded instead of offering a link that 404s.
  const available = Object.keys(KEY_MAP).filter((key) => s3Configured() || localPathFor(key));
  const expiry = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;

  res.status(200).json({
    ok: true,
    token: sign(expiry),
    expiresAt: expiry * 1000,
    available,
    source: s3Configured() ? 's3' : 'local',
    urlTtlSeconds: URL_TTL_SECONDS,
  });
});

async function serveDocument(req, res) {
  if (!PASSCODE) return vaultUnavailable(res);

  const { file, t } = req.query ?? {};

  if (!tokenValid(t)) {
    res.status(401).json({ error: 'Session expired. Unlock again.', code: 'TOKEN_EXPIRED' });
    return;
  }

  if (!file || !isKnownKey(file)) {
    res.status(404).json({ error: 'Unknown document.', code: 'NOT_FOUND' });
    return;
  }

  if (s3Configured()) {
    res.statusCode = 302;
    res.setHeader('Location', await presign(file));
    res.end();
    return;
  }

  const source = localPathFor(file);
  if (!source) {
    res.status(404).json({
      error: 'This document has not been uploaded to the vault yet.',
      code: 'NOT_UPLOADED',
    });
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', contentTypeFor(file));
  res.setHeader('Content-Length', String(fs.statSync(source).size));
  res.setHeader('Content-Disposition', 'inline');
  fs.createReadStream(source).pipe(res);
}
