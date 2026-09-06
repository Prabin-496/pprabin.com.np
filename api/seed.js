/**
 * POST /api/seed — install the bundled JLPT decks.
 *
 * Body: { level: 'n5'|'n4'|'n3', offset?, limit? }
 *
 * Seeding is chunked and resumable: the response returns `nextOffset` until
 * the deck is fully written, so a 3,500-card import never trips the
 * serverless execution timeout.
 *
 * Vocabulary source: github.com/jamsinclair/open-anki-jlpt-decks (MIT).
 */

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  handler, readBody, requireWriteAccess, methodNotAllowed, badRequest,
} from './_lib/http.js';
import { getDeck, putDeck, makeCard, batchPutCards, countQueue, allCardsInDeck } from './_lib/repo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Installable decks. `file` names the bundled dataset; `deckId` is stable so
 * re-seeding updates existing cards instead of duplicating them.
 */
const LEVELS = {
  hiragana: {
    deckId: 'hiragana', file: 'hiragana.json', name: 'Hiragana', order: 1,
    description: 'All 104 hiragana with mnemonics — basics, dakuten and combos.',
    newPerDay: 15,
  },
  katakana: {
    deckId: 'katakana', file: 'katakana.json', name: 'Katakana', order: 2,
    description: 'All 104 katakana with mnemonics, including the シ/ツ and ソ/ン traps.',
    newPerDay: 15,
  },
  'it-workplace': {
    deckId: 'it-workplace', file: 'it-workplace.json', name: 'IT & Workplace Japanese', order: 3,
    description: 'Japanese PC settings, cloud/infrastructure and business communication.',
    newPerDay: 8,
  },
  n2: {
    deckId: 'jlpt-n2', file: 'jlpt-n2.json', name: 'JLPT N2', order: 4,
    description: 'The N2 exam vocabulary — 1,905 words.',
    newPerDay: 25,
  },
  n3: {
    deckId: 'jlpt-n3', file: 'jlpt-n3.json', name: 'JLPT N3', order: 5,
    description: 'Intermediate vocabulary — the foundation N2 builds on.',
  },
  n4: {
    deckId: 'jlpt-n4', file: 'jlpt-n4.json', name: 'JLPT N4', order: 6,
    description: 'Everyday vocabulary building on N5.',
  },
  n5: {
    deckId: 'jlpt-n5', file: 'jlpt-n5.json', name: 'JLPT N5', order: 7,
    description: 'Foundation vocabulary — the first ~700 words.',
  },
};

const CHUNK = 400;

export default handler(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!requireWriteAccess(req, res)) return;

  const body = readBody(req);
  const level = String(body.level || '').toLowerCase();
  if (!LEVELS[level]) throw badRequest(`level must be one of: ${Object.keys(LEVELS).join(', ')}`);

  const meta = LEVELS[level];
  const deckId = meta.deckId;

  const words = JSON.parse(
    await readFile(path.join(__dirname, '_lib', 'data', meta.file), 'utf8')
  );

  const offset = Math.max(0, Number(body.offset) || 0);
  const limit = Math.min(CHUNK, Math.max(1, Number(body.limit) || CHUNK));

  // First chunk creates the deck and checks whether it is already populated.
  if (offset === 0) {
    if (!(await getDeck(deckId))) {
      await putDeck({
        deckId,
        name: meta.name,
        description: meta.description,
        order: meta.order,
        // Some decks want a different daily pace than the global default.
        config: meta.newPerDay ? { newPerDay: meta.newPerDay } : {},
      });
    }
    const existing = await allCardsInDeck(deckId, { limit: 1 });
    if (existing.length && !body.force) {
      const total = await countQueue(deckId, 'new');
      return res.status(200).json({
        deckId,
        skipped: true,
        message: `${meta.name} already has cards. Pass force:true to add the rest.`,
        existingNewCards: total,
      });
    }
  }

  const slice = words.slice(offset, offset + limit);
  if (!slice.length) {
    return res.status(200).json({ deckId, done: true, seeded: 0, total: words.length });
  }

  const cards = slice.map((word, i) =>
    makeCard(deckId, { ...word, cardId: seedId(deckId, word) }, offset + i)
  );
  await batchPutCards(cards);

  const nextOffset = offset + slice.length;
  const done = nextOffset >= words.length;

  res.status(200).json({
    deckId,
    deckName: meta.name,
    seeded: slice.length,
    offset,
    nextOffset: done ? null : nextOffset,
    total: words.length,
    done,
  });
});

/**
 * Deterministic id per (deck, word) so re-running a seed overwrites the same
 * rows instead of creating duplicates.
 */
function seedId(deckId, word) {
  const digest = createHash('sha1')
    .update(`${deckId}|${word.expression}|${word.reading}`)
    .digest('hex');
  return [
    digest.slice(0, 8), digest.slice(8, 12), digest.slice(12, 16),
    digest.slice(16, 20), digest.slice(20, 32),
  ].join('-');
}
