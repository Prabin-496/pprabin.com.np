/**
 * Multiple-choice question builder — the Duolingo-style layer over the
 * existing SM-2 scheduler.
 *
 * The scheduler still decides *when* a card comes back. This module only
 * decides *how* it is asked: a prompt plus four options drawn from other
 * cards in the same deck, so the wrong answers are plausible.
 */

import { queryQueue } from './repo.js';

const OPTION_COUNT = 4;

/** True when the card is a single kana/character rather than a word. */
function isKanaCard(card) {
  return Boolean(card.romaji) && card.expression === card.reading;
}

/** Reading is only worth asking about when it differs from the written form. */
function hasDistinctReading(card) {
  return Boolean(card.reading) && card.reading !== card.expression;
}

function questionTypesFor(card) {
  if (isKanaCard(card)) return ['kana_to_romaji', 'romaji_to_kana'];

  const types = ['meaning', 'production'];
  if (hasDistinctReading(card)) types.push('reading');
  return types;
}

const SPECS = {
  // Show the Japanese, pick the English.
  meaning: {
    instruction: 'What does this mean?',
    prompt: (c) => ({ main: c.expression, sub: c.reading || '' }),
    option: (c) => c.meaning,
  },
  // Show the English, pick the Japanese.
  production: {
    instruction: 'Which word means this?',
    prompt: (c) => ({ main: c.meaning, sub: '' }),
    option: (c) => c.expression,
    optionSub: (c) => c.reading || '',
  },
  // Show the kanji, pick the kana reading.
  reading: {
    instruction: 'How is this read?',
    prompt: (c) => ({ main: c.expression, sub: '' }),
    option: (c) => c.reading,
  },
  kana_to_romaji: {
    instruction: 'Which sound is this?',
    prompt: (c) => ({ main: c.expression, sub: '' }),
    option: (c) => c.romaji,
  },
  romaji_to_kana: {
    instruction: 'Which character makes this sound?',
    prompt: (c) => ({ main: c.romaji, sub: '' }),
    option: (c) => c.expression,
  },
};

/**
 * Bias the question type toward whatever the card has been failed on, and
 * toward recognition early in a card's life (production is harder).
 */
function chooseType(card, rng) {
  const types = questionTypesFor(card);
  if (card.reps < 2) return types[0];
  return types[Math.floor(rng() * types.length)];
}

export async function buildQuiz(card, deckId, { rng = Math.random } = {}) {
  const type = chooseType(card, rng);
  const spec = SPECS[type];

  const pool = await samplePool(deckId, card.cardId);
  const correct = spec.option(card);

  // Distractors must be non-empty and textually distinct from the answer.
  const seen = new Set([normalise(correct)]);
  const distractors = [];
  for (const other of shuffle(pool, rng)) {
    if (distractors.length >= OPTION_COUNT - 1) break;
    const text = spec.option(other);
    if (!text) continue;
    const key = normalise(text);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(other);
  }

  const entries = shuffle(
    [
      { card, text: correct, correct: true },
      ...distractors.map((d) => ({ card: d, text: spec.option(d), correct: false })),
    ],
    rng
  );

  return {
    type,
    instruction: spec.instruction,
    prompt: spec.prompt(card),
    options: entries.map((e) => ({
      text: e.text,
      sub: spec.optionSub ? spec.optionSub(e.card) : '',
    })),
    answerIndex: entries.findIndex((e) => e.correct),
    // Shown after answering, so the full card is always reinforced.
    reveal: {
      expression: card.expression,
      reading: card.reading || '',
      romaji: card.romaji || '',
      meaning: card.meaning,
      mnemonic: card.mnemonic || '',
      exampleSentence: card.exampleSentence || '',
      exampleMeaning: card.exampleMeaning || '',
    },
  };
}

/**
 * Pull a modest set of sibling cards for distractors. Queue queries are used
 * rather than a full deck scan so this stays cheap on a 2,000-card deck.
 */
async function samplePool(deckId, excludeCardId) {
  const queues = ['review', 'new', 'learn', 'relearn'];
  const collected = [];

  for (const queue of queues) {
    if (collected.length >= 40) break;
    const cards = await queryQueue(deckId, queue, { limit: 40 });
    collected.push(...cards);
  }

  const seen = new Set();
  return collected.filter((c) => {
    if (c.cardId === excludeCardId || seen.has(c.cardId)) return false;
    seen.add(c.cardId);
    return true;
  });
}

function normalise(text) {
  return String(text || '').trim().toLowerCase();
}

function shuffle(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
