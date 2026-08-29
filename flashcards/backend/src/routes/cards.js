import { Router } from 'express';
import {
  bootstrapVocabulary,
  buildQuestion,
  buildStudySession,
  createCard,
  deleteCard,
  getAllCards,
  getCard,
  getTodaySummary,
  listCards,
  reviewCard,
  summarizeCard,
} from '../services/dynamodb.js';

const router = Router();

function normalizeCsv(input) {
  if (Array.isArray(input)) return input;
  if (typeof input !== 'string') return [];
  return input
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function validateCreateBody(body) {
  const errors = [];
  if (!body || typeof body !== 'object') errors.push('request body must be an object');

  const word = body?.word || body?.kanji || body?.hiragana || body?.katakana;
  if (!word || typeof word !== 'string' || !word.trim()) {
    errors.push('word (or one of kanji/hiragana/katakana) is required');
  }

  const meaning = body?.meaning || body?.englishMeaning;
  if (!meaning || typeof meaning !== 'string' || !meaning.trim()) {
    errors.push('meaning (or englishMeaning) is required');
  }

  const textFields = [
    'kanji', 'hiragana', 'katakana', 'reading', 'pronunciation', 'englishMeaning', 'japaneseMeaning',
    'partOfSpeech', 'exampleSentence', 'exampleSentenceReading', 'exampleSentenceMeaning', 'workplaceRelevance',
    'jlptLevel', 'category', 'topic', 'mnemonic', 'hint',
  ];

  for (const field of textFields) {
    if (body?.[field] != null && typeof body[field] !== 'string') {
      errors.push(`${field} must be a string`);
    }
  }

  const arrayFields = ['similarWords', 'relatedWords', 'collocations'];
  for (const field of arrayFields) {
    if (body?.[field] != null && !Array.isArray(body[field]) && typeof body[field] !== 'string') {
      errors.push(`${field} must be an array or comma-separated string`);
    }
  }

  if (body?.difficulty != null && Number.isNaN(Number(body.difficulty))) {
    errors.push('difficulty must be a number');
  }
  if (body?.level != null && Number.isNaN(Number(body.level))) {
    errors.push('level must be a number');
  }

  return errors;
}

router.get('/', async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 200;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const { cards, nextCursor } = await listCards({ limit, cursor });
    res.json({ cards, nextCursor });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', async (_req, res, next) => {
  try {
    const cards = await getAllCards();
    const unlockLevel = Math.max(1, Math.min(7, 1 + Math.floor(cards.filter((c) => c.learningState === 'Mastered').length / 8)));
    res.json({
      summary: getTodaySummary(cards),
      total: cards.length,
      unlockLevel,
      states: {
        New: cards.filter((c) => c.learningState === 'New').length,
        Learning: cards.filter((c) => c.learningState === 'Learning').length,
        Familiar: cards.filter((c) => c.learningState === 'Familiar').length,
        Reviewing: cards.filter((c) => c.learningState === 'Reviewing').length,
        Strong: cards.filter((c) => c.learningState === 'Strong').length,
        Mastered: cards.filter((c) => c.learningState === 'Mastered').length,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/bootstrap', async (_req, res, next) => {
  try {
    const created = await bootstrapVocabulary();
    res.status(201).json({ createdCount: created.length, created });
  } catch (err) {
    next(err);
  }
});

router.post('/session/start', async (req, res, next) => {
  try {
    const cards = await getAllCards();
    const count = Number(req.body?.count || 22);
    const session = buildStudySession(cards, count);
    res.json({
      unlockLevel: session.unlockLevel,
      summary: session.summary,
      sessionCardIds: session.cards.map((card) => card.CardID),
      queueSize: session.cards.length,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/session/next', async (req, res, next) => {
  try {
    const sessionCardIds = Array.isArray(req.body?.sessionCardIds) ? req.body.sessionCardIds : [];
    const seenCardIds = Array.isArray(req.body?.seenCardIds) ? req.body.seenCardIds : [];

    const cards = await getAllCards();
    const byId = new Map(cards.map((c) => [c.CardID, c]));

    const source = sessionCardIds.length
      ? sessionCardIds.map((id) => byId.get(id)).filter(Boolean)
      : buildStudySession(cards, 22).cards;

    const unseen = source.filter((c) => !seenCardIds.includes(c.CardID));
    if (!unseen.length) {
      const recap = {
        summary: getTodaySummary(cards, source),
        completed: source.length,
      };
      return res.json({ done: true, recap });
    }

    const card = unseen[0];
    const question = buildQuestion(card, source);

    res.json({
      done: false,
      cardId: card.CardID,
      question,
      card: summarizeCard(card),
      remaining: unseen.length,
      total: source.length,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:CardID/review', async (req, res, next) => {
  try {
    const grade = req.body?.grade;
    const questionType = req.body?.questionType;
    const mistakeTypes = normalizeCsv(req.body?.mistakeTypes);
    const userAnswer = typeof req.body?.userAnswer === 'string' ? req.body.userAnswer : '';

    const result = await reviewCard({
      cardId: req.params.CardID,
      grade,
      questionType,
      mistakeTypes,
      userAnswer,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:CardID', async (req, res, next) => {
  try {
    const card = await getCard(req.params.CardID);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json({ card });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const errors = validateCreateBody(req.body);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

    const payload = {
      ...req.body,
      similarWords: normalizeCsv(req.body.similarWords),
      relatedWords: normalizeCsv(req.body.relatedWords),
      collocations: normalizeCsv(req.body.collocations),
    };

    const card = await createCard(payload);
    res.status(201).json({ card });
  } catch (err) {
    next(err);
  }
});

router.delete('/:CardID', async (req, res, next) => {
  try {
    await deleteCard(req.params.CardID);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
