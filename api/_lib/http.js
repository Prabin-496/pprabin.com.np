/** Shared request helpers: auth gate, JSON body parsing, error envelope. */

/**
 * Writes are gated by STUDY_PASSCODE when it is set. If the env var is absent
 * the API stays open, so a fresh deploy works before the secret is configured.
 */
export function requireWriteAccess(req, res) {
  const expected = process.env.STUDY_PASSCODE;
  if (!expected) return true;

  const provided = req.headers['x-study-key'] || '';
  if (provided === expected) return true;

  res.status(401).json({ error: 'Passcode required', code: 'PASSCODE_REQUIRED' });
  return false;
}

export function authConfigured() {
  return Boolean(process.env.STUDY_PASSCODE);
}

export function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json({ error: `Method not allowed. Use ${allowed.join(', ')}.` });
}

/** Wraps a handler so unexpected throws become clean JSON instead of a 500 page. */
export function handler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      const status = err.statusCode || 500;
      console.error('[anki-api]', req.url, err);
      res.status(status).json({
        error: status === 500 ? 'Internal server error' : err.message,
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  };
}

export function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

export function notFound(message = 'Not found') {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}
