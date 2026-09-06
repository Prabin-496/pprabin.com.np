/**
 * GET /api/health — is the API wired up, and if not, why?
 *
 * This used to query DynamoDB at the top level, so a misconfigured deployment
 * answered every call with an opaque 500 and no way to tell a missing AWS key
 * from a wrong table name. It now always answers 200 and reports what it
 * found: which environment variables are present (never their values) and the
 * error AWS returned if the table could not be read.
 */

import { handler, authConfigured } from './_lib/http.js';
import { TABLE, REGION, dayKey, timezone } from './_lib/ddb.js';
import { listDecks } from './_lib/repo.js';

export default handler(async (_req, res) => {
  let deckCount = null;
  let db = { connected: true };

  try {
    deckCount = (await listDecks()).length;
  } catch (err) {
    db = {
      connected: false,
      error: err.name || 'Error',
      message: String(err.message || '').slice(0, 200),
      hint: hintFor(err),
    };
  }

  res.status(200).json({
    ok: db.connected,
    service: 'anki-flashcards-api',
    table: TABLE,
    region: REGION,
    timezone,
    today: dayKey(),
    deckCount,
    passcodeEnabled: authConfigured(),
    db,
    // Presence only — never the values.
    env: {
      ANKI_AWS_ACCESS_KEY_ID: Boolean(process.env.ANKI_AWS_ACCESS_KEY_ID),
      ANKI_AWS_SECRET_ACCESS_KEY: Boolean(process.env.ANKI_AWS_SECRET_ACCESS_KEY),
      AWS_REGION_ANKI: Boolean(process.env.AWS_REGION_ANKI),
      ANKI_TABLE_NAME: Boolean(process.env.ANKI_TABLE_NAME),
    },
  });
});

function hintFor(err) {
  const name = err.name || '';
  if (name.includes('Credentials') || name === 'UnrecognizedClientException') {
    return 'Set ANKI_AWS_ACCESS_KEY_ID and ANKI_AWS_SECRET_ACCESS_KEY in the Vercel project settings, then redeploy.';
  }
  if (name === 'ResourceNotFoundException') {
    return `No table "${TABLE}" in ${REGION}. Check ANKI_TABLE_NAME and AWS_REGION_ANKI.`;
  }
  if (name === 'AccessDeniedException') {
    return 'The IAM user cannot reach the table. Attach infra/dynamodb-policy.json to it.';
  }
  return 'See SETUP.md § Environment variables.';
}
