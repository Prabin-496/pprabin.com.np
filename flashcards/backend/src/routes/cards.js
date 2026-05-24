import { Router } from 'express';
import { createCard, deleteCard, getCard, listCards } from '../services/dynamodb.js';

const router = Router();

function validateCreateBody(body) {
  const errors = [];
  if (!body?.word || typeof body.word !== 'string' || !body.word.trim()) {
    errors.push('word is required');
  }
  if (!body?.meaning || typeof body.meaning !== 'string' || !body.meaning.trim()) {
    errors.push('meaning is required');
  }
  if (body.hint != null && typeof body.hint !== 'string') errors.push('hint must be a string');
  if (body.pronunciation != null && typeof body.pronunciation !== 'string') {
    errors.push('pronunciation must be a string');
  }
  return errors;
}

router.get('/', async (_req, res, next) => {
  try {
    const cards = await listCards();
    res.json({ cards });
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

    const card = await createCard(req.body);
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
