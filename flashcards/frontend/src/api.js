import { getApiBaseUrl } from '@shared/getApiBaseUrl';

const API_BASE = getApiBaseUrl(import.meta.env.VITE_FLASHCARDS_API_URL);

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || body.message || message;
      if (body.details?.length) message += `: ${body.details.join(', ')}`;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request('/health'),
  listCards: ({ limit = 200, cursor } = {}) =>
    request(`/api/cards?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
  getSummary: () => request('/api/cards/summary'),
  bootstrap: () => request('/api/cards/bootstrap', { method: 'POST' }),
  startSession: (count = 22) =>
    request('/api/cards/session/start', { method: 'POST', body: JSON.stringify({ count }) }),
  nextQuestion: ({ sessionCardIds, seenCardIds }) =>
    request('/api/cards/session/next', {
      method: 'POST',
      body: JSON.stringify({ sessionCardIds, seenCardIds }),
    }),
  reviewCard: ({ cardId, grade, questionType, mistakeTypes, userAnswer }) =>
    request(`/api/cards/${cardId}/review`, {
      method: 'POST',
      body: JSON.stringify({ grade, questionType, mistakeTypes, userAnswer }),
    }),
  createCard: (payload) =>
    request('/api/cards', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCard: (CardID) => request(`/api/cards/${CardID}`, { method: 'DELETE' }),
};
