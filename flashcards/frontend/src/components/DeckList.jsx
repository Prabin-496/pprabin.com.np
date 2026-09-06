import { useState } from 'react';
import { api } from '../api';
import ExamPlan from './ExamPlan';
import QuickAdd from './QuickAdd';

const SEED_LEVELS = [
  { level: 'n2', label: 'JLPT N2', words: 1905 },
  { level: 'it-workplace', label: 'IT & Workplace', words: 108 },
  { level: 'hiragana', label: 'Hiragana', words: 104 },
  { level: 'katakana', label: 'Katakana', words: 104 },
  { level: 'n3', label: 'JLPT N3', words: 2140 },
  { level: 'n4', label: 'JLPT N4', words: 668 },
  { level: 'n5', label: 'JLPT N5', words: 718 },
];

export default function DeckList({ decks, config, onOpen, onRefresh, guard }) {
  const [seeding, setSeeding] = useState('');
  const [progress, setProgress] = useState(null);
  const [newDeckName, setNewDeckName] = useState('');

  /** Seeding is chunked server-side; loop until it reports done. */
  const seed = async (level) => {
    setSeeding(level);
    setProgress({ done: 0, total: 0 });
    try {
      await guard(async () => {
        let offset = 0;
        for (;;) {
          const res = await api.seed(level, offset, offset > 0);
          if (res.skipped) break;
          setProgress({ done: res.nextOffset ?? res.total, total: res.total });
          if (res.nextOffset == null) break;
          offset = res.nextOffset;
        }
      });
      await onRefresh();
    } catch {
      /* guard() already surfaced the error */
    } finally {
      setSeeding('');
      setProgress(null);
    }
  };

  const createDeck = async (e) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    try {
      await guard(() => api.createDeck({ name: newDeckName.trim() }));
      setNewDeckName('');
      await onRefresh();
    } catch {
      /* handled */
    }
  };

  const totalDue = decks.reduce((sum, d) => sum + d.counts.new + d.counts.learn + d.counts.review, 0);

  return (
    <section className="stack" aria-label="Decks">
      <QuickAdd decks={decks} guard={guard} onAdded={onRefresh} />

      <ExamPlan decks={decks} config={config} guard={guard} onChanged={onRefresh} />

      {totalDue > 0 ? (
        <div className="callout">
          <strong>{totalDue}</strong> cards waiting across all decks today.
        </div>
      ) : decks.length ? (
        <div className="callout callout--calm">
          Nothing due right now. Come back tomorrow, or add new cards.
        </div>
      ) : null}

      <div className="deck-grid">
        {decks.map((deck) => {
          const { counts } = deck;
          const ready = counts.new + counts.learn + counts.review;
          return (
            <article key={deck.deckId} className="deck-card">
              <header>
                <h2>{deck.name}</h2>
                <p className="muted small">{deck.description || `${counts.newTotal} cards`}</p>
              </header>

              <div className="count-row">
                <span className="count count--new" title="New cards available today">
                  <b>{counts.new}</b> new
                </span>
                <span className="count count--learn" title="Cards in learning, due now">
                  <b>{counts.learn}</b> learning
                </span>
                <span className="count count--review" title="Reviews due today">
                  <b>{counts.review}</b> due
                </span>
              </div>

              <div className="deck-meta muted small">
                {counts.newTotal} unseen · {counts.reviewDue} scheduled
                {counts.suspended ? ` · ${counts.suspended} suspended` : ''}
              </div>

              <div className="deck-actions">
                <button
                  type="button"
                  className="btn primary"
                  disabled={!ready}
                  onClick={() => onOpen(deck, 'study')}
                >
                  {ready ? 'Study' : 'Done for today'}
                </button>
                <button type="button" className="btn" onClick={() => onOpen(deck, 'browse')}>Browse</button>
                <button type="button" className="btn" onClick={() => onOpen(deck, 'stats')}>Stats</button>
                <button type="button" className="btn" onClick={() => onOpen(deck, 'add')}>Add</button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="panel">
        <h3>Install a JLPT deck</h3>
        <p className="muted small">
          Graded vocabulary decks. Re-running a install is safe — cards are keyed by word,
          so nothing duplicates.
        </p>
        <div className="row-gap">
          {SEED_LEVELS.map((s) => (
            <button
              key={s.level}
              type="button"
              className="btn"
              disabled={Boolean(seeding)}
              onClick={() => seed(s.level)}
            >
              {seeding === s.level
                ? `Installing… ${progress?.done ?? 0}/${progress?.total ?? s.words}`
                : `${s.label} · ${s.words} words`}
            </button>
          ))}
        </div>
      </div>

      <form className="panel" onSubmit={createDeck}>
        <h3>New deck</h3>
        <div className="row-gap">
          <input
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="e.g. Workplace Japanese"
            aria-label="New deck name"
          />
          <button type="submit" className="btn primary" disabled={!newDeckName.trim()}>Create</button>
        </div>
      </form>
    </section>
  );
}
