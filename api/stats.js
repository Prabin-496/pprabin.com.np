/**
 * GET /api/stats?deck=<deckId>&days=365
 *
 * Anki's statistics screen: review heatmap, upcoming forecast, card-state
 * breakdown, retention (share of reviews not answered "Again"), and the
 * ease/interval distribution.
 */

import { handler, methodNotAllowed, badRequest, notFound } from './_lib/http.js';
import { getDeck, allCardsInDeck, reviewsOnDay, dayKey } from './_lib/repo.js';

export default handler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const deckId = req.query?.deck;
  if (!deckId) throw badRequest('deck query parameter is required');
  const deck = await getDeck(deckId);
  if (!deck) throw notFound(`Deck ${deckId} not found`);

  const historyDays = Math.min(365, Math.max(7, Number(req.query?.days) || 120));
  const now = new Date();

  const cards = await allCardsInDeck(deckId);

  // Heatmap: one bucket per day. Days are queried in parallel batches so a
  // long window doesn't serialise hundreds of round trips.
  const dayKeys = Array.from({ length: historyDays }, (_, i) =>
    dayKey(new Date(now.getTime() - i * 86400000))
  );
  const reviewsByDay = await mapLimit(dayKeys, 12, async (day) => {
    const entries = await reviewsOnDay(day);
    const mine = entries.filter((e) => e.deckId === deckId);
    return {
      day,
      count: mine.length,
      again: mine.filter((e) => e.rating === 'again').length,
      newCards: mine.filter((e) => e.wasNew).length,
      timeMs: mine.reduce((sum, e) => sum + (Number(e.timeTakenMs) || 0), 0),
    };
  });

  const totalReviews = reviewsByDay.reduce((s, d) => s + d.count, 0);
  const totalAgain = reviewsByDay.reduce((s, d) => s + d.again, 0);
  const totalTime = reviewsByDay.reduce((s, d) => s + d.timeMs, 0);

  // Forecast: how many reviews each of the next 30 days already owes.
  const forecast = Array.from({ length: 30 }, (_, i) => {
    const dayStart = new Date(now.getTime() + i * 86400000);
    const key = dayKey(dayStart);
    const count = cards.filter(
      (c) => c.queue === 'review' && c.due && dayKey(new Date(c.due)) === key
    ).length;
    return { day: key, count };
  });

  const states = {
    new: cards.filter((c) => c.queue === 'new').length,
    learn: cards.filter((c) => c.queue === 'learn' || c.queue === 'relearn').length,
    young: cards.filter((c) => c.queue === 'review' && c.ivl < 21).length,
    mature: cards.filter((c) => c.queue === 'review' && c.ivl >= 21).length,
    suspended: cards.filter((c) => c.queue === 'suspended').length,
    buried: cards.filter((c) => c.queue === 'buried').length,
  };

  const studied = cards.filter((c) => c.reps > 0);
  const reviewCards = cards.filter((c) => c.queue === 'review');

  res.status(200).json({
    deck: { deckId: deck.deckId, name: deck.name },
    totals: {
      cards: cards.length,
      studied: studied.length,
      reviews: totalReviews,
      retention: totalReviews ? round(1 - totalAgain / totalReviews, 3) : null,
      timeMs: totalTime,
      avgSecondsPerCard: totalReviews ? round(totalTime / totalReviews / 1000, 1) : null,
      streakDays: currentStreak(reviewsByDay),
      leeches: cards.filter((c) => c.isLeech).length,
    },
    states,
    heatmap: reviewsByDay.slice().reverse(),
    forecast,
    intervals: histogram(reviewCards.map((c) => c.ivl), [1, 7, 21, 60, 180, 365]),
    ease: histogram(reviewCards.map((c) => Math.round(c.ease * 100)), [150, 200, 250, 300, 350]),
    hardest: studied
      .filter((c) => c.lapses > 0)
      .sort((a, b) => b.lapses - a.lapses)
      .slice(0, 12)
      .map((c) => ({
        cardId: c.cardId,
        expression: c.expression,
        reading: c.reading,
        meaning: c.meaning,
        lapses: c.lapses,
        reps: c.reps,
        ease: c.ease,
        isLeech: Boolean(c.isLeech),
      })),
  });
});

/** Consecutive days ending today (or yesterday) with at least one review. */
function currentStreak(days) {
  let streak = 0;
  for (let i = 0; i < days.length; i += 1) {
    if (days[i].count > 0) streak += 1;
    else if (i > 0) break;
  }
  return streak;
}

function histogram(values, edges) {
  const buckets = edges.map((edge, i) => ({
    label: i === 0 ? `<${edge}` : `${edges[i - 1]}–${edge}`,
    from: i === 0 ? 0 : edges[i - 1],
    to: edge,
    count: 0,
  }));
  buckets.push({ label: `${edges[edges.length - 1]}+`, from: edges[edges.length - 1], to: Infinity, count: 0 });

  for (const value of values) {
    const bucket = buckets.find((b) => value >= b.from && value < b.to) || buckets[buckets.length - 1];
    bucket.count += 1;
  }
  return buckets.map(({ label, count }) => ({ label, count }));
}

/** Run an async mapper with bounded concurrency. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      out[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return out;
}

function round(n, places) {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}
