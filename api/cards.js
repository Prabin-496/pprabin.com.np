/**
 * Card browser + editor.
 *
 * GET    /api/cards?deck=x&q=&state=&tag=&limit=&offset=   browse / search
 * GET    /api/cards?deck=x&cardId=y&history=1              one card + its log
 * POST   /api/cards                                        create one or many
 * PATCH  /api/cards                                        edit / suspend / bury / reset
 * DELETE /api/cards?deck=x&cardId=y                        delete
 */

import {
  handler, readBody, requireWriteAccess, methodNotAllowed, badRequest, notFound,
} from './_lib/http.js';
import {
  getDeck, getCard, putCard, deleteCard, allCardsInDeck, makeCard,
  batchPutCards, countQueue, cardHistory, normalizeTags,
} from './_lib/repo.js';
import { newCardState } from './_lib/scheduler.js';

export default handler(async (req, res) => {
  if (req.method === 'GET') return browse(req, res);
  if (!requireWriteAccess(req, res)) return;
  if (req.method === 'POST') return create(req, res);
  if (req.method === 'PATCH') return update(req, res);
  if (req.method === 'DELETE') return remove(req, res);
  return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE']);
});

async function browse(req, res) {
  const { deck: deckId, cardId, q, state, tag, limit = '50', offset = '0', history } = req.query || {};
  if (!deckId) throw badRequest('deck query parameter is required');

  if (cardId) {
    const card = await getCard(deckId, cardId);
    if (!card) throw notFound(`Card ${cardId} not found`);
    const log = history ? await cardHistory(cardId, { limit: 50 }) : [];
    return res.status(200).json({ card, history: log });
  }

  const all = await allCardsInDeck(deckId);
  const needle = String(q || '').trim().toLowerCase();

  const filtered = all.filter((card) => {
    if (state && card.queue !== state && card.type !== state) return false;
    if (tag && !(card.tags || []).includes(tag)) return false;
    if (!needle) return true;
    return [card.expression, card.reading, card.meaning, card.notes, (card.tags || []).join(' ')]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(needle));
  });

  // New cards by introduction order; everything else by soonest due.
  filtered.sort((a, b) => {
    if (a.queue === 'new' && b.queue === 'new') return (a.pos ?? 0) - (b.pos ?? 0);
    if (a.queue === 'new') return 1;
    if (b.queue === 'new') return -1;
    return String(a.due || '').localeCompare(String(b.due || ''));
  });

  const start = Math.max(0, Number(offset) || 0);
  const size = Math.min(500, Math.max(1, Number(limit) || 50));

  res.status(200).json({
    cards: filtered.slice(start, start + size),
    total: filtered.length,
    deckTotal: all.length,
    offset: start,
    limit: size,
    tags: [...new Set(all.flatMap((c) => c.tags || []))].sort().slice(0, 100),
  });
}

async function create(req, res) {
  const body = readBody(req);
  const deckId = body.deckId;
  if (!deckId) throw badRequest('deckId is required');
  if (!(await getDeck(deckId))) throw notFound(`Deck ${deckId} not found`);

  const incoming = Array.isArray(body.cards) ? body.cards : [body];
  const valid = incoming.filter((c) => (c.expression || c.word || c.front) && (c.meaning || c.back));
  if (!valid.length) throw badRequest('each card needs an expression and a meaning');

  // Append after the current end of the new queue so ordering stays stable.
  const startPos = await countQueue(deckId, 'new');
  const cards = valid.map((input, i) => makeCard(deckId, input, startPos + i));

  if (cards.length === 1) {
    await putCard(cards[0]);
    return res.status(201).json({ card: cards[0], created: 1 });
  }
  await batchPutCards(cards);
  res.status(201).json({ created: cards.length });
}

async function update(req, res) {
  const body = readBody(req);
  const { deckId, cardId, action } = body;
  if (!deckId || !cardId) throw badRequest('deckId and cardId are required');

  const card = await getCard(deckId, cardId);
  if (!card) throw notFound(`Card ${cardId} not found`);

  let next = { ...card, updatedAt: new Date().toISOString() };

  if (action === 'suspend') {
    next.queue = 'suspended';
  } else if (action === 'unsuspend') {
    // Return the card to the queue implied by its scheduling type.
    next.queue = card.type === 'new' ? 'new' : card.type;
    next.isLeech = false;
    next.tags = (card.tags || []).filter((t) => t !== 'leech');
  } else if (action === 'bury') {
    next.queue = 'buried';
    next.buriedUntil = startOfNextDay().toISOString();
  } else if (action === 'reset') {
    // Forget everything the scheduler knows and send it back to new.
    next = { ...next, ...newCardState(card.pos ?? 0) };
  } else {
    const fields = ['expression', 'reading', 'meaning', 'partOfSpeech', 'exampleSentence',
      'exampleMeaning', 'notes', 'mnemonic', 'kanjiBreakdown', 'romaji'];
    for (const field of fields) {
      if (body[field] != null) next[field] = String(body[field]).trim();
    }
    if (body.tags != null) next.tags = normalizeTags(body.tags);
    if (!next.expression || !next.meaning) throw badRequest('expression and meaning cannot be empty');
  }

  await putCard(next);
  res.status(200).json({ card: next });
}

async function remove(req, res) {
  const deckId = req.query?.deck || readBody(req).deckId;
  const cardId = req.query?.cardId || readBody(req).cardId;
  if (!deckId || !cardId) throw badRequest('deck and cardId are required');
  await deleteCard(deckId, cardId);
  res.status(200).json({ deleted: true });
}

function startOfNextDay() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}
