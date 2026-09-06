/** GET list decks with live counts · POST create · PATCH rename/config · DELETE */

import { handler, readBody, requireWriteAccess, methodNotAllowed, badRequest, notFound } from './_lib/http.js';
import {
  listDecks, getDeck, putDeck, deleteDeck, countQueue, getCounts,
  getGlobalConfig, putGlobalConfig, slugify,
} from './_lib/repo.js';
import { withDefaults } from './_lib/scheduler.js';

export default handler(async (req, res) => {
  if (req.method === 'GET') return getDecks(req, res);
  if (!requireWriteAccess(req, res)) return;
  if (req.method === 'POST') return createDeck(req, res);
  if (req.method === 'PATCH') return patchDeck(req, res);
  if (req.method === 'DELETE') return removeDeck(req, res);
  return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE']);
});

async function getDecks(req, res) {
  const now = new Date().toISOString();
  const decks = await listDecks();
  const globalConfig = await getGlobalConfig();

  const withCounts = await Promise.all(
    decks.map(async (deck) => {
      const cfg = withDefaults({ ...globalConfig, ...(deck.config || {}) });
      const [newTotal, learn, relearn, reviewDue, suspended, today] = await Promise.all([
        countQueue(deck.deckId, 'new'),
        countQueue(deck.deckId, 'learn', { dueBefore: now }),
        countQueue(deck.deckId, 'relearn', { dueBefore: now }),
        countQueue(deck.deckId, 'review', { dueBefore: now }),
        countQueue(deck.deckId, 'suspended'),
        getCounts(deck.deckId),
      ]);

      // Daily caps are what the user actually sees on the deck screen.
      const newLeft = Math.max(0, Math.min(newTotal, cfg.newPerDay - today.newDone));
      const revLeft = Math.max(0, Math.min(reviewDue, cfg.revPerDay - today.revDone));

      return {
        ...deck,
        config: cfg,
        counts: {
          new: newLeft,
          learn: learn + relearn,
          review: revLeft,
          newTotal,
          reviewDue,
          suspended,
        },
        today,
      };
    })
  );

  res.status(200).json({ decks: withCounts, config: globalConfig });
}

async function createDeck(req, res) {
  const body = readBody(req);
  if (!body.name?.trim()) throw badRequest('name is required');
  const deckId = slugify(body.deckId || body.name);
  if (await getDeck(deckId)) throw badRequest(`Deck "${deckId}" already exists`);
  const deck = await putDeck({ ...body, deckId });
  res.status(201).json({ deck });
}

async function patchDeck(req, res) {
  const body = readBody(req);

  // No deckId means the caller is editing the global default config.
  if (!body.deckId) {
    if (!body.config) throw badRequest('deckId or config is required');
    const config = await putGlobalConfig(body.config);
    return res.status(200).json({ config });
  }

  const existing = await getDeck(body.deckId);
  if (!existing) throw notFound(`Deck ${body.deckId} not found`);
  const deck = await putDeck({
    ...existing,
    name: body.name ?? existing.name,
    description: body.description ?? existing.description,
    order: body.order ?? existing.order,
    config: body.config ? withDefaults({ ...existing.config, ...body.config }) : existing.config,
  });
  res.status(200).json({ deck });
}

async function removeDeck(req, res) {
  const deckId = req.query?.deckId || readBody(req).deckId;
  if (!deckId) throw badRequest('deckId is required');
  if (!(await getDeck(deckId))) throw notFound(`Deck ${deckId} not found`);
  const removed = await deleteDeck(deckId);
  res.status(200).json({ deleted: true, cardsRemoved: removed });
}
