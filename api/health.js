import { handler } from './_lib/http.js';
import { authConfigured } from './_lib/http.js';
import { TABLE, REGION, dayKey, timezone } from './_lib/ddb.js';
import { listDecks } from './_lib/repo.js';

export default handler(async (_req, res) => {
  const decks = await listDecks();
  res.status(200).json({
    ok: true,
    service: 'anki-flashcards-api',
    table: TABLE,
    region: REGION,
    timezone,
    today: dayKey(),
    deckCount: decks.length,
    passcodeEnabled: authConfigured(),
  });
});
