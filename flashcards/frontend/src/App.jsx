import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import Flashcard from './components/Flashcard';
import AddCardForm from './components/AddCardForm';

export default function App() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiOk, setApiOk] = useState(null);
  const [view, setView] = useState('study');

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await api.listCards();
      setCards(list);
      setIndex((i) => (list.length ? Math.min(i, list.length - 1) : 0));
      setFlipped(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.health()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    const onKey = (e) => {
      if (view !== 'study' || !cards.length) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.key === 'ArrowRight') {
        setFlipped(false);
        setIndex((i) => (i + 1) % cards.length);
      }
      if (e.key === 'ArrowLeft') {
        setFlipped(false);
        setIndex((i) => (i - 1 + cards.length) % cards.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, cards.length]);

  const current = cards[index] || null;

  const progress = useMemo(() => {
    if (!cards.length) return 0;
    return Math.round(((index + 1) / cards.length) * 100);
  }, [cards.length, index]);

  const goNext = () => {
    if (!cards.length) return;
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  };

  const goPrev = () => {
    if (!cards.length) return;
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  };

  const shuffle = () => {
    setCards((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setIndex(0);
    setFlipped(false);
  };

  const handleCreated = (card) => {
    setCards((prev) => [card, ...prev]);
    setIndex(0);
    setFlipped(false);
    setView('study');
  };

  const handleDelete = async (CardID) => {
    if (!confirm('Delete this flashcard?')) return;
    try {
      await api.deleteCard(CardID);
      await loadCards();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">独立アプリ · Standalone study tool</p>
          <h1>Japanese Flashcards</h1>
          <p className="subtitle">Tap the card to reveal the meaning. Build your own deck and memorize at your pace.</p>
        </div>
        <div className={`api-pill ${apiOk === false ? 'api-pill--err' : apiOk ? 'api-pill--ok' : ''}`}>
          {apiOk === null && 'Connecting…'}
          {apiOk === true && 'API connected'}
          {apiOk === false && 'API offline — check backend URL'}
        </div>
      </header>

      <nav className="tabs" aria-label="Views">
        <button type="button" className={view === 'study' ? 'tab active' : 'tab'} onClick={() => setView('study')}>
          Study
        </button>
        <button type="button" className={view === 'add' ? 'tab active' : 'tab'} onClick={() => setView('add')}>
          Add card
        </button>
        <button type="button" className={view === 'deck' ? 'tab active' : 'tab'} onClick={() => setView('deck')}>
          Deck ({cards.length})
        </button>
      </nav>

      {error && (
        <div className="banner banner--error" role="alert">
          {error}
          <button type="button" className="link-btn" onClick={loadCards}>
            Retry
          </button>
        </div>
      )}

      {view === 'add' && (
        <AddCardForm onCreated={handleCreated} onCancel={() => setView('study')} />
      )}

      {view === 'study' && (
        <section className="study" aria-label="Study mode">
          {loading ? (
            <p className="muted center">Loading cards…</p>
          ) : !cards.length ? (
            <div className="empty">
              <p>No cards yet. Add your first Japanese word!</p>
              <button type="button" className="btn primary" onClick={() => setView('add')}>
                Add a card
              </button>
            </div>
          ) : (
            <>
              <div className="progress-row">
                <span>
                  Card {index + 1} / {cards.length}
                </span>
                <div className="progress-bar" aria-hidden>
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <Flashcard card={current} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

              <p className="hint center">Tap card to flip · Space = flip · Arrow keys = navigate</p>

              <div className="controls">
                <button type="button" className="btn" onClick={goPrev}>
                  Previous
                </button>
                <button type="button" className="btn" onClick={() => setFlipped((f) => !f)}>
                  Flip
                </button>
                <button type="button" className="btn primary" onClick={goNext}>
                  Next
                </button>
                <button type="button" className="btn ghost" onClick={shuffle}>
                  Shuffle
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {view === 'deck' && (
        <section className="deck" aria-label="All cards">
          {loading ? (
            <p className="muted">Loading…</p>
          ) : (
            <ul className="deck-list">
              {cards.map((c, i) => (
                <li key={c.CardID} className="deck-item">
                  <button
                    type="button"
                    className="deck-main"
                    onClick={() => {
                      setIndex(i);
                      setFlipped(false);
                      setView('study');
                    }}
                  >
                    <span className="deck-word">{c.word}</span>
                    <span className="deck-meaning">{c.meaning}</span>
                  </button>
                  <button
                    type="button"
                    className="btn danger small"
                    onClick={() => handleDelete(c.CardID)}
                    aria-label={`Delete ${c.word}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <footer className="footer">
        <a href="/" className="back-link">
          ← Back to portfolio
        </a>
        <p className="muted small">Data stored in AWS DynamoDB · ap-southeast-2</p>
      </footer>
    </div>
  );
}
