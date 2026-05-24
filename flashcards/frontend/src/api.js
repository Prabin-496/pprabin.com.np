const API_BASE =
  import.meta.env.VITE_FLASHCARDS_API_URL?.replace(/\/$/, '') || '';

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
  listCards: () => request('/api/cards').then((d) => d.cards),
  createCard: (payload) =>
    request('/api/cards', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCard: (CardID) => request(`/api/cards/${CardID}`, { method: 'DELETE' }),
};
