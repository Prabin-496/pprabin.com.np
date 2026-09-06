import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

const STATES = ['', 'new', 'learn', 'relearn', 'review', 'suspended', 'buried'];
const PAGE = 50;

export default function Browser({ deck, guard, onChanged }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [q, setQ] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.browse({ deck: deck.deckId, q, state, limit: PAGE, offset });
      setRows(res.cards);
      setTotal(res.total);
    } catch {
      /* surfaced by parent guard on write paths only */
    } finally {
      setLoading(false);
    }
  }, [deck.deckId, q, state, offset]);

  useEffect(() => {
    load();
  }, [load]);

  // Any filter change restarts pagination at the first page.
  useEffect(() => {
    setOffset(0);
  }, [q, state]);

  const act = async (card, action) => {
    try {
      await guard(() => api.updateCard({ deckId: deck.deckId, cardId: card.cardId, action }));
      await load();
      onChanged();
    } catch {
      /* handled */
    }
  };

  const remove = async (card) => {
    if (!confirm(`Delete "${card.expression}"? This cannot be undone.`)) return;
    try {
      await guard(() => api.deleteCard(deck.deckId, card.cardId));
      await load();
      onChanged();
    } catch {
      /* handled */
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await guard(() =>
        api.updateCard({
          deckId: deck.deckId,
          cardId: editing.cardId,
          expression: editing.expression,
          reading: editing.reading,
          meaning: editing.meaning,
          notes: editing.notes,
          exampleSentence: editing.exampleSentence,
          tags: editing.tags,
        })
      );
      setEditing(null);
      await load();
    } catch {
      /* handled */
    }
  };

  return (
    <section className="stack" aria-label="Card browser">
      <div className="panel toolbar">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search expression, reading, meaning, tags…"
          aria-label="Search cards"
          className="grow"
        />
        <select value={state} onChange={(e) => setState(e.target.value)} aria-label="Filter by state">
          {STATES.map((s) => (
            <option key={s || 'all'} value={s}>{s ? s : 'All states'}</option>
          ))}
        </select>
        <span className="muted small">{total} matching</span>
      </div>

      {loading ? <p className="muted">Loading…</p> : null}

      <div className="table-wrap">
        <table className="cards-table">
          <thead>
            <tr>
              <th>Expression</th><th>Reading</th><th>Meaning</th>
              <th>State</th><th>Due</th><th>Reps</th><th>Ease</th><th />
            </tr>
          </thead>
          <tbody>
            {rows.map((card) => (
              <tr key={card.cardId} className={card.queue === 'suspended' ? 'row--suspended' : ''}>
                <td lang="ja" className="cell-expression">{card.expression}</td>
                <td lang="ja" className="muted">{card.reading}</td>
                <td>{card.meaning}</td>
                <td><span className={`badge badge--${card.queue}`}>{card.queue}</span></td>
                <td className="muted small">
                  {card.queue === 'new'
                    ? '—'
                    : card.due
                      ? new Date(card.due).toLocaleDateString()
                      : '—'}
                </td>
                <td className="muted small">{card.reps}</td>
                <td className="muted small">{card.ease ? `${Math.round(card.ease * 100)}%` : '—'}</td>
                <td className="cell-actions">
                  <button type="button" className="link-btn" onClick={() => setEditing({ ...card, tags: (card.tags || []).join(' ') })}>Edit</button>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => act(card, card.queue === 'suspended' ? 'unsuspend' : 'suspend')}
                  >
                    {card.queue === 'suspended' ? 'Unsuspend' : 'Suspend'}
                  </button>
                  <button type="button" className="link-btn" onClick={() => act(card, 'reset')}>Reset</button>
                  <button type="button" className="link-btn danger" onClick={() => remove(card)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > PAGE ? (
        <div className="row-gap pager">
          <button type="button" className="btn" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
            ← Previous
          </button>
          <span className="muted small">{offset + 1}–{Math.min(offset + PAGE, total)} of {total}</span>
          <button type="button" className="btn" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>
            Next →
          </button>
        </div>
      ) : null}

      {editing ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit card">
          <form className="modal modal--wide" onSubmit={saveEdit}>
            <h2>Edit card</h2>
            {['expression', 'reading', 'meaning', 'exampleSentence', 'notes', 'tags'].map((field) => (
              <label key={field}>
                {field === 'exampleSentence' ? 'Example sentence' : field[0].toUpperCase() + field.slice(1)}
                <input
                  value={editing[field] || ''}
                  onChange={(e) => setEditing({ ...editing, [field]: e.target.value })}
                />
              </label>
            ))}
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn primary">Save</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
