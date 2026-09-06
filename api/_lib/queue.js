/**
 * Study-queue assembly — decides which card to show next.
 *
 * Priority follows Anki: cards mid-learning come first (they are on a
 * minutes-scale timer), then due reviews and new cards are interleaved so a
 * session doesn't front-load every review before any new material.
 */

import { previewIntervals, withDefaults } from './scheduler.js';
import { queryQueue, countQueue, getCounts } from './repo.js';

const LEARN_AHEAD_MS = 20 * 60 * 1000;

export async function buildQueueState(deck, config, now = new Date(), { excludeCardId } = {}) {
  const cfg = withDefaults({ ...config, ...(deck.config || {}) });
  const nowIso = now.toISOString();
  const deckId = deck.deckId;

  const [learn, relearn, reviewDue, reviewDueCount, today] = await Promise.all([
    queryQueue(deckId, 'learn', { dueBefore: nowIso, limit: 20 }),
    queryQueue(deckId, 'relearn', { dueBefore: nowIso, limit: 20 }),
    queryQueue(deckId, 'review', { dueBefore: nowIso, limit: 60 }),
    countQueue(deckId, 'review', { dueBefore: nowIso }),
    getCounts(deckId),
  ]);

  // How many new cards today's cap still allows. Counting the whole unseen
  // pile here would read all 1,905 N2 cards on every single answer to produce
  // a number that is then clamped to at most `newPerDay`, so the count stops
  // at the cap. The exact pile size is only fetched below, when the deck runs
  // out and the finished screen actually shows it.
  const newCap = Math.max(0, cfg.newPerDay - (today.newDone || 0));
  const newLeft = await countQueue(deckId, 'new', { limit: newCap });
  const revLeft = Math.max(0, Math.min(reviewDueCount, cfg.revPerDay - today.revDone));

  // GSI1 is eventually consistent, so a card answered a moment ago can still
  // appear in its old queue. Drop it rather than showing it twice in a row.
  const notJustAnswered = (c) => c.cardId !== excludeCardId;
  const learning = [...learn, ...relearn].filter(notJustAnswered).sort(byDue);
  const reviews = reviewDue.filter(notJustAnswered).slice(0, revLeft);

  const counts = {
    new: newLeft,
    learn: learning.length,
    review: revLeft,
    reviewDue: reviewDueCount,
  };

  const card = await pickNext({ deckId, learning, reviews, newLeft, counts, today, now, cfg, excludeCardId });

  // Only the "deck finished" screen reports the size of the unseen pile, so
  // that is the only time it is worth paying to count it.
  counts.newTotal = card ? null : await countQueue(deckId, 'new');

  return {
    config: cfg,
    counts,
    today,
    card,
    previews: card ? previewIntervals(card, cfg, now) : null,
    done: !card,
    learnAhead: card ? null : await peekLearnAhead(deckId, now),
  };
}

async function pickNext({ deckId, learning, reviews, newLeft, counts, today, cfg, excludeCardId }) {
  // 1. Anything mid-learning and already due wins — its timer has elapsed.
  if (learning.length) return learning[0];

  const hasReview = reviews.length > 0;
  const hasNew = newLeft > 0;

  if (!hasReview && !hasNew) return null;
  if (hasReview && !hasNew) return reviews[0];
  if (hasNew && !hasReview) return firstNew(deckId, excludeCardId);

  // 2. Both available — interleave so new cards are spread through the session
  //    instead of arriving only after every review is cleared.
  const answered = (today.newDone || 0) + (today.revDone || 0);
  const ratio = Math.max(1, Math.round(counts.review / Math.max(1, counts.new)));
  const wantsNew = answered % (ratio + 1) === ratio;
  return (wantsNew ? await firstNew(deckId, excludeCardId) : reviews[0]) || reviews[0] || null;
}

async function firstNew(deckId, excludeCardId) {
  const cards = await queryQueue(deckId, 'new', { limit: 2 });
  return cards.find((c) => c.cardId !== excludeCardId) || null;
}

/** Nothing due now, but something may unlock within the learn-ahead window. */
async function peekLearnAhead(deckId, now) {
  const soon = new Date(now.getTime() + LEARN_AHEAD_MS).toISOString();
  const [learn, relearn] = await Promise.all([
    queryQueue(deckId, 'learn', { dueBefore: soon, limit: 1 }),
    queryQueue(deckId, 'relearn', { dueBefore: soon, limit: 1 }),
  ]);
  const next = [...learn, ...relearn].sort(byDue)[0];
  if (!next) return null;
  return { cardId: next.cardId, due: next.due, inMs: new Date(next.due).getTime() - now.getTime() };
}

function byDue(a, b) {
  return String(a.due || '').localeCompare(String(b.due || ''));
}
