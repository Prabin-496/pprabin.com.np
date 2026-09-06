/**
 * POST /api/review — answer a card, or undo the last answer.
 *
 * Body: { deckId, cardId, rating, timeTakenMs }  → schedules the card
 *        { deckId, action: 'undo' }              → restores the previous state
 *
 * Returns the updated card AND the next queue state, so the study loop needs
 * one round trip per card instead of two.
 */

import {
  handler, readBody, requireWriteAccess, methodNotAllowed, badRequest, notFound,
} from './_lib/http.js';
import {
  getDeck, getCard, putCard, getGlobalConfig, logReview, bumpCounts, reviewsOnDay, dayKey,
} from './_lib/repo.js';
import { answerCard, withDefaults, RATINGS } from './_lib/scheduler.js';
import { buildQueueState } from './_lib/queue.js';
import { buildQuiz } from './_lib/quiz.js';
import { ddb, TABLE } from './_lib/ddb.js';
import { DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export default handler(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!requireWriteAccess(req, res)) return;

  const body = readBody(req);
  const deckId = body.deckId;
  if (!deckId) throw badRequest('deckId is required');

  const deck = await getDeck(deckId);
  if (!deck) throw notFound(`Deck ${deckId} not found`);

  const config = withDefaults({ ...(await getGlobalConfig()), ...(deck.config || {}) });

  if (body.action === 'undo') return undoLast(deck, config, res);
  return gradeCard(deck, config, body, res);
});

async function gradeCard(deck, config, body, res) {
  const { cardId, rating } = body;
  if (!cardId) throw badRequest('cardId is required');
  if (!RATINGS.includes(rating)) {
    throw badRequest(`rating must be one of: ${RATINGS.join(', ')}`);
  }

  const card = await getCard(deck.deckId, cardId);
  if (!card) throw notFound(`Card ${cardId} not found`);

  const now = new Date();
  const wasNew = card.type === 'new';

  // Snapshot the scheduling fields so undo can put them back exactly.
  const before = pickSchedulingFields(card);
  const updated = { ...card, ...answerCard(card, rating, config, now) };

  await putCard(updated);
  await logReview({
    cardId,
    deckId: deck.deckId,
    rating,
    at: now.toISOString(),
    ivl: updated.ivl,
    lastIvl: card.ivl || 0,
    ease: updated.ease,
    type: before.type,
    timeTakenMs: Number(body.timeTakenMs) || 0,
    wasNew,
    before,
  });
  await bumpCounts(deck.deckId, { isNew: wasNew });

  const state = await buildQueueState(deck, config, new Date(), { excludeCardId: cardId });

  const quiz =
    state.card && body.mode === 'quiz' ? await buildQuiz(state.card, deck.deckId) : null;

  // `...state` supplies the NEXT card, counts and previews. The card that was
  // just graded is returned separately as `answered` so neither shadows the other.
  res.status(200).json({
    ...state,
    quiz,
    answered: updated,
    scheduled: {
      rating,
      from: card.ivl || 0,
      to: updated.ivl,
      due: updated.due,
      queue: updated.queue,
      isLeech: Boolean(updated.isLeech),
    },
  });
}

async function undoLast(deck, config, res) {
  // Look at today first, then yesterday, so an undo just after rollover works.
  const days = [dayKey(), dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000))];
  let last = null;

  for (const day of days) {
    const entries = await reviewsOnDay(day);
    const forDeck = entries
      .filter((e) => e.deckId === deck.deckId && e.before && e.logId)
      .sort((a, b) => String(b.at).localeCompare(String(a.at)));
    if (forDeck.length) {
      last = forDeck[0];
      break;
    }
  }

  if (!last) throw badRequest('Nothing to undo');

  const card = await getCard(deck.deckId, last.cardId);
  if (!card) throw notFound('Card for the last review no longer exists');

  const restored = { ...card, ...last.before, updatedAt: new Date().toISOString() };
  await putCard(restored);

  await ddb.send(
    new DeleteCommand({ TableName: TABLE, Key: { PK: `LOG#${last.cardId}`, SK: last.logId } })
  );

  // Roll the daily counter back so the undone answer stops counting.
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `STATS#${deck.deckId}`, SK: `DAY#${dayKey(new Date(last.at))}` },
      UpdateExpression: 'SET newDone = if_not_exists(newDone, :z) - :n, revDone = if_not_exists(revDone, :z) - :r',
      ExpressionAttributeValues: { ':z': 0, ':n': last.wasNew ? 1 : 0, ':r': last.wasNew ? 0 : 1 },
    })
  );

  const state = await buildQueueState(deck, config, new Date());
  const quiz = state.card ? await buildQuiz(state.card, deck.deckId) : null;
  res.status(200).json({ ...state, quiz, undone: true, restored });
}

function pickSchedulingFields(card) {
  const { type, queue, due, ivl, ease, reps, lapses, left, pos, tags, isLeech, lastReviewedAt } = card;
  return { type, queue, due, ivl, ease, reps, lapses, left, pos, tags, isLeech, lastReviewedAt };
}
