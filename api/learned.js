/**
 * GET /api/learned — every word you have actually studied.
 *
 * "Learned" means a card that has left the new pile: you answered it at least
 * once, so the scheduler is now tracking when it should come back. Cards are
 * read through GSI1 one queue at a time rather than by scanning the deck, so
 * asking the 1,905-card N2 deck what you know costs a query over the handful
 * of words you have touched instead of all 1,905.
 *
 * Query parameters
 *   deck    all | <deckId>                                    (default: all)
 *   stage   all | learning | young | mature | suspended       (default: all)
 *   q       free-text search over expression/reading/meaning/romaji/tags
 *   sort    recent | strength | interval | due | alpha        (default: recent)
 *   limit   1–500 (default 60)   offset  0+
 */

import { handler, methodNotAllowed, badRequest, notFound } from './_lib/http.js';
import { listDecks, getDeck, allInQueue, getCounts } from './_lib/repo.js';

/** Queues a card can only reach by being answered. */
const STUDIED_QUEUES = ['learn', 'relearn', 'review', 'buried'];
/** Parked cards are listed separately — they were learned, but are on hold. */
const PARKED_QUEUE = 'suspended';

const SORTS = ['recent', 'strength', 'interval', 'due', 'alpha'];
const STAGES = ['learning', 'young', 'mature', 'suspended'];

export default handler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const {
    deck: deckParam = 'all',
    stage = 'all',
    q = '',
    sort = 'recent',
    limit = '60',
    offset = '0',
  } = req.query || {};

  if (stage !== 'all' && !STAGES.includes(stage)) {
    throw badRequest(`stage must be all or one of: ${STAGES.join(', ')}`);
  }
  const order = SORTS.includes(sort) ? sort : 'recent';

  const decks = await resolveDecks(deckParam);

  const perDeck = await Promise.all(decks.map((d) => collectDeck(d)));
  const words = perDeck.flatMap((d) => d.words);

  const needle = String(q).trim().toLowerCase();
  const filtered = words.filter((w) => {
    if (stage !== 'all' && w.stage !== stage) return false;
    if (!needle) return true;
    return [w.expression, w.reading, w.romaji, w.meaning, (w.tags || []).join(' ')]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(needle));
  });

  filtered.sort(comparator(order));

  const start = Math.max(0, Number(offset) || 0);
  const size = Math.min(500, Math.max(1, Number(limit) || 60));

  res.status(200).json({
    words: filtered.slice(start, start + size),
    total: filtered.length,
    offset: start,
    limit: size,
    sort: order,
    stage,
    summary: summarise(perDeck, words),
    // Every deck, so the filter dropdown works even when one has no words yet.
    decks: (await listDecks()).map((d) => ({ deckId: d.deckId, name: d.name })),
  });
});

async function resolveDecks(deckParam) {
  if (!deckParam || deckParam === 'all') return listDecks();
  const deck = await getDeck(deckParam);
  if (!deck) throw notFound(`Deck ${deckParam} not found`);
  return [deck];
}

/** Read one deck's studied cards and shape them for the words list. */
async function collectDeck(deck) {
  const [studied, parked, today] = await Promise.all([
    Promise.all(STUDIED_QUEUES.map((queue) => allInQueue(deck.deckId, queue))),
    allInQueue(deck.deckId, PARKED_QUEUE),
    getCounts(deck.deckId),
  ]);

  // `reps > 0` is the real test. A never-answered card can be suspended by
  // hand, and it should not count as something you have learned.
  const cards = [...studied.flat(), ...parked].filter((c) => Number(c.reps) > 0);
  const words = cards.map((card) => toWord(card, deck));

  return {
    deckId: deck.deckId,
    name: deck.name,
    words,
    today: { newDone: today.newDone || 0, revDone: today.revDone || 0, day: today.day },
  };
}

function toWord(card, deck) {
  const stage = stageOf(card);
  return {
    cardId: card.cardId,
    deckId: deck.deckId,
    deckName: deck.name,
    expression: card.expression,
    reading: card.reading || '',
    romaji: card.romaji || '',
    meaning: card.meaning,
    partOfSpeech: card.partOfSpeech || '',
    mnemonic: card.mnemonic || '',
    kanjiBreakdown: card.kanjiBreakdown || '',
    exampleSentence: card.exampleSentence || '',
    exampleMeaning: card.exampleMeaning || '',
    notes: card.notes || '',
    tags: card.tags || [],
    stage,
    strength: strengthOf(card, stage),
    queue: card.queue,
    ivl: Number(card.ivl) || 0,
    ease: Number(card.ease) || 0,
    reps: Number(card.reps) || 0,
    lapses: Number(card.lapses) || 0,
    due: card.due || null,
    lastReviewedAt: card.lastReviewedAt || null,
    isLeech: Boolean(card.isLeech),
  };
}

/**
 * Anki's own vocabulary: a card is *mature* once the scheduler is willing to
 * wait 21 days before asking again, *young* while it still comes back sooner,
 * and *learning* while it is on the minutes-scale steps.
 */
function stageOf(card) {
  if (card.queue === PARKED_QUEUE) return 'suspended';
  if (card.type === 'review') return Number(card.ivl) >= 21 ? 'mature' : 'young';
  return 'learning';
}

/**
 * A 0–100 "how well do I know this" figure.
 *
 * Anki stores no such field, so it is derived from the two things that do
 * track memory: how long the scheduler will wait before asking again, and how
 * often the word has been forgotten. The interval is read on a log scale
 * because memory strength grows that way — going from 1 to 7 days means far
 * more than going from 300 to 306.
 */
function strengthOf(card, stage) {
  if (stage === 'learning') return Math.min(25, 5 + (Number(card.reps) || 0) * 5);
  const ivl = Math.max(1, Number(card.ivl) || 1);
  const base = 30 + (Math.log(ivl) / Math.log(365)) * 70;
  const penalty = Math.min(20, (Number(card.lapses) || 0) * 4);
  return Math.max(5, Math.min(100, Math.round(base - penalty)));
}

function comparator(order) {
  if (order === 'strength') return (a, b) => b.strength - a.strength || byExpression(a, b);
  if (order === 'interval') return (a, b) => b.ivl - a.ivl || byExpression(a, b);
  if (order === 'due') return (a, b) => String(a.due || '9').localeCompare(String(b.due || '9'));
  if (order === 'alpha') return byExpression;
  // recent — most recently answered first; never-dated cards sink to the end.
  return (a, b) => String(b.lastReviewedAt || '').localeCompare(String(a.lastReviewedAt || ''));
}

function byExpression(a, b) {
  return String(a.expression).localeCompare(String(b.expression), 'ja');
}

function summarise(perDeck, words) {
  const count = (list, stage) => list.filter((w) => w.stage === stage).length;

  return {
    learned: words.filter((w) => w.stage !== 'suspended').length,
    learning: count(words, 'learning'),
    young: count(words, 'young'),
    mature: count(words, 'mature'),
    suspended: count(words, 'suspended'),
    leeches: words.filter((w) => w.isLeech).length,
    newToday: perDeck.reduce((sum, d) => sum + d.today.newDone, 0),
    reviewsToday: perDeck.reduce((sum, d) => sum + d.today.revDone + d.today.newDone, 0),
    decks: perDeck
      .map((d) => ({
        deckId: d.deckId,
        name: d.name,
        learned: d.words.filter((w) => w.stage !== 'suspended').length,
        learning: count(d.words, 'learning'),
        young: count(d.words, 'young'),
        mature: count(d.words, 'mature'),
      }))
      .sort((a, b) => b.learned - a.learned),
  };
}
