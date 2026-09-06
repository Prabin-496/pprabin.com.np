/** GET /api/study?deck=<deckId> — next card plus live queue counts. */

import { handler, methodNotAllowed, notFound, badRequest } from './_lib/http.js';
import { getDeck, getGlobalConfig, cardHistory } from './_lib/repo.js';
import { buildQueueState } from './_lib/queue.js';
import { buildQuiz } from './_lib/quiz.js';

export default handler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const deckId = req.query?.deck;
  if (!deckId) throw badRequest('deck query parameter is required');

  const deck = await getDeck(deckId);
  if (!deck) throw notFound(`Deck ${deckId} not found`);

  const config = await getGlobalConfig();
  const state = await buildQueueState(deck, config, new Date());

  // The study screen shows a card's recent grades, so fetch them alongside.
  const history = state.card ? await cardHistory(state.card.cardId, { limit: 8 }) : [];

  // Quiz mode swaps self-grading for four options generated from sibling cards.
  const quiz =
    state.card && req.query?.mode === 'quiz'
      ? await buildQuiz(state.card, deckId)
      : null;

  res.status(200).json({
    quiz,
    deck: { deckId: deck.deckId, name: deck.name },
    ...state,
    history: history.map((h) => ({ at: h.at, rating: h.rating, ivl: h.ivl })),
  });
});
