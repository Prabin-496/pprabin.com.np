/**
 * API client. The backend now runs as Vercel functions on the same origin,
 * so there is no cross-origin base URL, no CORS preflight, and no mixed
 * content when the site is served over HTTPS.
 */

const BASE = import.meta.env.VITE_FLASHCARDS_API_URL?.replace(/\/$/, '') || '';

const KEY_STORAGE = 'anki:passcode';

export function getPasscode() {
  try {
    return localStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setPasscode(value) {
  try {
    if (value) localStorage.setItem(KEY_STORAGE, value);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* private browsing — fall back to in-memory only */
  }
}

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const passcode = getPasscode();
  if (passcode) headers['X-Study-Key'] = passcode;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code;
    try {
      const payload = await res.json();
      message = payload.error || message;
      code = payload.code;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status, code);
  }

  if (res.status === 204) return null;
  return res.json();
}

const qs = (params) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

export const api = {
  health: () => request('/health'),

  listDecks: () => request('/decks'),
  createDeck: (deck) => request('/decks', { method: 'POST', body: deck }),
  updateDeck: (patch) => request('/decks', { method: 'PATCH', body: patch }),
  deleteDeck: (deckId) => request(`/decks?${qs({ deckId })}`, { method: 'DELETE' }),

  study: (deckId, mode) => request(`/study?${qs({ deck: deckId, mode })}`),
  answer: (payload) => request('/review', { method: 'POST', body: payload }),
  undo: (deckId) => request('/review', { method: 'POST', body: { deckId, action: 'undo' } }),

  browse: (params) => request(`/cards?${qs(params)}`),
  getCard: (deckId, cardId) => request(`/cards?${qs({ deck: deckId, cardId, history: 1 })}`),
  createCards: (deckId, cards) =>
    request('/cards', { method: 'POST', body: { deckId, cards } }),
  updateCard: (payload) => request('/cards', { method: 'PATCH', body: payload }),
  deleteCard: (deckId, cardId) =>
    request(`/cards?${qs({ deck: deckId, cardId })}`, { method: 'DELETE' }),

  /** Words already studied, across every deck or one of them. */
  learned: (params) => request(`/learned?${qs(params)}`),

  stats: (deckId, days = 120) => request(`/stats?${qs({ deck: deckId, days })}`),
  seed: (level, offset = 0, force = false) =>
    request('/seed', { method: 'POST', body: { level, offset, force } }),
};
