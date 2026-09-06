/**
 * Anki-compatible SM-2 scheduler.
 *
 * Mirrors Anki's scheduler v2: learning steps, graduating/easy intervals,
 * ease-factor adjustment, lapse handling with relearning steps, leech
 * detection, interval fuzz, and late-review delay bonuses.
 *
 * Pure functions only — no I/O — so the same code drives both the real
 * answer path and the interval previews shown on the answer buttons.
 */

export const RATINGS = ['again', 'hard', 'good', 'easy'];

export const DEFAULT_CONFIG = {
  newPerDay: 20,
  revPerDay: 200,
  learnSteps: [1, 10], // minutes
  relearnSteps: [10], // minutes
  graduatingInterval: 1, // days
  easyInterval: 4, // days
  startingEase: 2.5,
  easyBonus: 1.3,
  hardInterval: 1.2,
  intervalModifier: 1.0,
  lapseMultiplier: 0.0,
  minimumInterval: 1, // days
  maximumInterval: 36500, // days
  leechThreshold: 8,
  leechAction: 'suspend', // 'suspend' | 'tag'
  // Exam planning — drives the countdown and the required-pace calculation.
  examDate: null, // ISO date string, e.g. '2026-12-06'
  examDeckId: null,
};

const MIN_EASE = 1.3;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function withDefaults(config = {}) {
  const merged = { ...DEFAULT_CONFIG, ...config };
  // Steps must be non-empty ascending positive numbers.
  merged.learnSteps = sanitizeSteps(merged.learnSteps, DEFAULT_CONFIG.learnSteps);
  merged.relearnSteps = sanitizeSteps(merged.relearnSteps, DEFAULT_CONFIG.relearnSteps);
  return merged;
}

function sanitizeSteps(steps, fallback) {
  if (!Array.isArray(steps)) return [...fallback];
  const clean = steps.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  return clean.length ? clean : [...fallback];
}

/** A brand new card, not yet studied. */
export function newCardState(position = 0) {
  return {
    type: 'new',
    queue: 'new',
    due: null,
    pos: position,
    ivl: 0,
    ease: DEFAULT_CONFIG.startingEase,
    reps: 0,
    lapses: 0,
    left: 0,
    lastReviewedAt: null,
  };
}

function constrainInterval(days, previousIvl, config) {
  const capped = Math.min(config.maximumInterval, days);
  const floored = Math.max(config.minimumInterval, capped);
  // Anki guarantees a review interval always grows by at least a day.
  const grown = previousIvl > 0 ? Math.max(previousIvl + 1, floored) : floored;
  return Math.round(Math.min(config.maximumInterval, grown));
}

/**
 * Anki's interval fuzz — spreads reviews out so cards learned together
 * don't clump onto the same future day forever.
 */
export function fuzzInterval(ivl, rng = Math.random) {
  if (ivl < 2) return ivl;
  if (ivl === 2) return rng() < 0.5 ? 2 : 3;

  let ratio;
  let min;
  if (ivl < 7) {
    ratio = 0.25;
    min = 1;
  } else if (ivl < 30) {
    ratio = 0.15;
    min = 2;
  } else {
    ratio = 0.05;
    min = 4;
  }
  const delta = Math.max(min, Math.round(ivl * ratio));
  const offset = Math.round((rng() * 2 - 1) * delta);
  return Math.max(1, ivl + offset);
}

/** Days a review card was answered later than its due date (0 if on time). */
function lateDays(card, now) {
  if (card.type !== 'review' || !card.due) return 0;
  const overdue = (now.getTime() - new Date(card.due).getTime()) / DAY_MS;
  return Math.max(0, overdue);
}

function stepDelayMinutes(steps, index, rating) {
  const idx = Math.min(Math.max(index, 0), steps.length - 1);
  if (rating === 'hard') {
    // Anki: first step hard = step * 1.5; otherwise average of this and previous.
    if (idx === 0) return steps[0] * 1.5;
    return (steps[idx - 1] + steps[idx]) / 2;
  }
  return steps[idx];
}

/**
 * Apply a rating to a card and return the next state.
 * `applyFuzz` is disabled for previews so button labels stay deterministic.
 */
export function answerCard(card, rating, config = DEFAULT_CONFIG, now = new Date(), { applyFuzz = true, rng = Math.random } = {}) {
  const cfg = withDefaults(config);
  if (!RATINGS.includes(rating)) throw new Error(`Unknown rating: ${rating}`);

  const next = { ...card };
  const nowMs = now.getTime();
  next.reps = (Number(card.reps) || 0) + 1;
  next.lastReviewedAt = now.toISOString();

  const type = card.type === 'new' ? 'learn' : card.type;
  const isLearning = type === 'learn' || type === 'relearn';

  if (isLearning) {
    const steps = type === 'relearn' ? cfg.relearnSteps : cfg.learnSteps;
    // A brand-new card starts before the first step.
    let stepIdx = card.type === 'new' ? 0 : Number(card.left) || 0;

    if (rating === 'again') {
      stepIdx = 0;
      next.type = type;
      next.queue = type;
      next.left = 0;
      next.due = new Date(nowMs + steps[0] * MINUTE_MS).toISOString();
      if (card.type === 'new') next.ease = cfg.startingEase;
      return finalize(next, card, cfg, rating, now);
    }

    if (rating === 'hard') {
      next.type = type;
      next.queue = type;
      next.left = stepIdx;
      next.due = new Date(nowMs + stepDelayMinutes(steps, stepIdx, 'hard') * MINUTE_MS).toISOString();
      if (card.type === 'new') next.ease = cfg.startingEase;
      return finalize(next, card, cfg, rating, now);
    }

    if (rating === 'easy') {
      // Easy graduates immediately, skipping the remaining steps.
      return graduate(next, card, cfg, type, 'easy', now, { applyFuzz, rng }, rating);
    }

    // rating === 'good' — advance one step, graduating past the last one.
    stepIdx += 1;
    if (stepIdx >= steps.length) {
      return graduate(next, card, cfg, type, 'good', now, { applyFuzz, rng }, rating);
    }
    next.type = type;
    next.queue = type;
    next.left = stepIdx;
    next.due = new Date(nowMs + steps[stepIdx] * MINUTE_MS).toISOString();
    if (card.type === 'new') next.ease = cfg.startingEase;
    return finalize(next, card, cfg, rating, now);
  }

  // ---- Review card ----
  const ease = Number(card.ease) || cfg.startingEase;
  const ivl = Number(card.ivl) || 0;
  const delay = lateDays(card, now);

  if (rating === 'again') {
    next.lapses = (Number(card.lapses) || 0) + 1;
    next.ease = Math.max(MIN_EASE, ease - 0.2);
    const lapsed = constrainInterval(Math.round(ivl * cfg.lapseMultiplier), 0, cfg);
    next.ivl = lapsed;

    if (cfg.relearnSteps.length) {
      next.type = 'relearn';
      next.queue = 'relearn';
      next.left = 0;
      next.due = new Date(nowMs + cfg.relearnSteps[0] * MINUTE_MS).toISOString();
    } else {
      next.type = 'review';
      next.queue = 'review';
      next.due = new Date(nowMs + lapsed * DAY_MS).toISOString();
    }

    // Leech handling: a card lapsing this often is not being learned.
    if (next.lapses >= cfg.leechThreshold) {
      const tags = new Set(Array.isArray(card.tags) ? card.tags : []);
      tags.add('leech');
      next.tags = [...tags];
      next.isLeech = true;
      if (cfg.leechAction === 'suspend') next.queue = 'suspended';
    }
    return finalize(next, card, cfg, rating, now);
  }

  let nextIvl;
  if (rating === 'hard') {
    next.ease = Math.max(MIN_EASE, ease - 0.15);
    nextIvl = ivl * cfg.hardInterval * cfg.intervalModifier;
  } else if (rating === 'good') {
    next.ease = ease;
    nextIvl = (ivl + delay / 2) * ease * cfg.intervalModifier;
  } else {
    next.ease = ease + 0.15;
    nextIvl = (ivl + delay) * ease * cfg.intervalModifier * cfg.easyBonus;
  }

  let constrained = constrainInterval(nextIvl, ivl, cfg);
  if (applyFuzz) constrained = Math.min(cfg.maximumInterval, fuzzInterval(constrained, rng));

  next.type = 'review';
  next.queue = 'review';
  next.ivl = constrained;
  next.left = 0;
  next.due = new Date(nowMs + constrained * DAY_MS).toISOString();
  return finalize(next, card, cfg, rating, now);
}

function graduate(next, card, cfg, fromType, rating, now, { applyFuzz, rng }, originalRating) {
  const nowMs = now.getTime();
  let ivl;

  if (fromType === 'relearn') {
    // Relearning returns to the (already reduced) interval it lapsed to.
    ivl = Math.max(cfg.minimumInterval, Number(card.ivl) || cfg.minimumInterval);
    if (rating === 'easy') ivl = Math.max(ivl + 1, Math.round(ivl * cfg.easyBonus));
  } else {
    ivl = rating === 'easy' ? cfg.easyInterval : cfg.graduatingInterval;
  }

  if (applyFuzz) ivl = fuzzInterval(ivl, rng);
  ivl = Math.max(cfg.minimumInterval, Math.min(cfg.maximumInterval, Math.round(ivl)));

  next.type = 'review';
  next.queue = 'review';
  next.ivl = ivl;
  next.left = 0;
  next.ease = Number(card.ease) || cfg.startingEase;
  next.due = new Date(nowMs + ivl * DAY_MS).toISOString();
  return finalize(next, card, cfg, originalRating, now);
}

function finalize(next, previous, cfg, rating, now) {
  next.ease = Math.max(MIN_EASE, Number(next.ease) || cfg.startingEase);
  next.ivl = Math.max(0, Number(next.ivl) || 0);
  next.lapses = Number(next.lapses) || 0;
  next.updatedAt = now.toISOString();
  next.previousQueue = previous.queue;
  next.previousIvl = Number(previous.ivl) || 0;
  next.lastRating = rating;
  return next;
}

/**
 * What each answer button will do — the numbers Anki prints under
 * Again / Hard / Good / Easy. Computed without fuzz so they stay stable.
 */
export function previewIntervals(card, config = DEFAULT_CONFIG, now = new Date()) {
  const cfg = withDefaults(config);
  const out = {};
  for (const rating of RATINGS) {
    const projected = answerCard(card, rating, cfg, now, { applyFuzz: false });
    out[rating] = describeDelay(projected, now);
  }
  return out;
}

function describeDelay(card, now) {
  if (!card.due) return '—';
  const ms = new Date(card.due).getTime() - now.getTime();
  return formatDuration(ms);
}

export function formatDuration(ms) {
  const minutes = ms / MINUTE_MS;
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;

  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;

  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d`;

  const months = days / 30.4;
  if (months < 12) return `${round1(months)}mo`;

  return `${round1(days / 365)}y`;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/** True when a card is waiting to be studied at `now`. */
export function isDue(card, now = new Date()) {
  if (card.queue === 'suspended' || card.queue === 'buried') return false;
  if (card.queue === 'new') return true;
  if (!card.due) return true;
  return new Date(card.due).getTime() <= now.getTime();
}
