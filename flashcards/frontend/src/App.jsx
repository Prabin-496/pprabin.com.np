import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import Flashcard from './components/Flashcard';
import AddCardForm from './components/AddCardForm';

const MISTAKE_TYPES = [
  'Meaning mistake',
  'Reading mistake',
  'Kanji mistake',
  'Grammar mistake',
  'Context mistake',
  'Production mistake',
  'Similar-word confusion',
];

export default function App() {
  const [cards, setCards] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [summary, setSummary] = useState(null);
  const [apiOk, setApiOk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('today');

  const [sessionCardIds, setSessionCardIds] = useState([]);
  const [seenCardIds, setSeenCardIds] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [mistakeTypes, setMistakeTypes] = useState([]);
  const [sessionRecap, setSessionRecap] = useState({ learned: 0, strengthened: 0, needsReview: 0, mistakes: [] });
  const [sessionDone, setSessionDone] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);

  const loadDeck = useCallback(async () => {
    const { cards: list, nextCursor: cursor } = await api.listCards({ limit: 200 });
    setCards(list);
    setNextCursor(cursor);
  }, []);

  const loadSummary = useCallback(async () => {
    const res = await api.getSummary();
    setSummary(res);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadDeck(), loadSummary()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [loadDeck, loadSummary]);

  useEffect(() => {
    api.health().then(() => setApiOk(true)).catch(() => setApiOk(false));
    loadAll();
  }, [loadAll]);

  const hydrateStarter = async () => {
    try {
      await api.bootstrap();
      await loadAll();
    } catch (e) {
      setError(e.message);
    }
  };

  const loadNextQuestion = useCallback(async (overrideSeen, overrideSessionIds) => {
    const seen = overrideSeen ?? seenCardIds;
    const activeSessionIds = overrideSessionIds ?? sessionCardIds;
    const res = await api.nextQuestion({ sessionCardIds: activeSessionIds, seenCardIds: seen });
    if (res.done) {
      setSessionDone(true);
      setCurrentCard(null);
      setCurrentQuestion(null);
      setRemaining(0);
      return;
    }

    setCurrentCard(res.card);
    setCurrentQuestion(res.question);
    setRemaining(res.remaining);
    setSessionTotal(res.total);
    setRevealed(false);
    setUserAnswer('');
    setMistakeTypes([]);
  }, [seenCardIds, sessionCardIds]);

  const startReview = async () => {
    setError('');
    setSessionDone(false);
    setSessionRecap({ learned: 0, strengthened: 0, needsReview: 0, mistakes: [] });
    try {
      const session = await api.startSession(22);
      setSessionCardIds(session.sessionCardIds);
      setSeenCardIds([]);
      setSummary((prev) => ({ ...prev, summary: session.summary, unlockLevel: session.unlockLevel }));
      setView('today');
      if (session.sessionCardIds.length) {
        const seen = [];
        setSeenCardIds(seen);
        await loadNextQuestion(seen, session.sessionCardIds);
      } else {
        setSessionDone(true);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleMistake = (type) => {
    setMistakeTypes((prev) => (prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]));
  };

  const answerCard = useCallback(async (grade) => {
    if (!currentCard || !currentQuestion) return;
    try {
      const res = await api.reviewCard({
        cardId: currentCard.CardID,
        grade,
        questionType: currentQuestion.questionType,
        mistakeTypes,
        userAnswer,
      });

      const nextSeen = [...seenCardIds, currentCard.CardID];
      setSeenCardIds(nextSeen);
      setSessionRecap((prev) => ({
        learned: prev.learned + (res.impact.learned ? 1 : 0),
        strengthened: prev.strengthened + (res.impact.strengthened ? 1 : 0),
        needsReview: prev.needsReview + (res.impact.needsReview ? 1 : 0),
        mistakes: [...prev.mistakes, ...(res.impact.mistakes || [])].slice(-20),
      }));

      await loadSummary();
      await loadDeck();
      await loadNextQuestion(nextSeen);
    } catch (e) {
      setError(e.message);
    }
  }, [currentCard, currentQuestion, mistakeTypes, userAnswer, seenCardIds, loadSummary, loadDeck, loadNextQuestion]);

  const handleCreated = (card) => {
    setCards((prev) => [card, ...prev]);
    setView('deck');
    loadSummary();
  };

  const handleDelete = async (CardID) => {
    if (!confirm('Delete this flashcard?')) return;
    try {
      await api.deleteCard(CardID);
      await loadAll();
    } catch (e) {
      setError(e.message);
    }
  };

  const overview = useMemo(() => {
    if (!summary) return null;
    return [
      { label: 'Due', value: summary.summary?.due ?? 0 },
      { label: 'Weak', value: summary.summary?.weak ?? 0 },
      { label: 'New', value: summary.summary?.new ?? 0 },
      { label: 'Mastered', value: summary.summary?.mastered ?? 0 },
    ];
  }, [summary]);


  useEffect(() => {
    const onKey = (e) => {
      if (view !== 'today' || !currentQuestion) return;
      if (e.key.toLowerCase() === 'r') setRevealed(true);
      if (!revealed) return;
      if (e.key === '1') answerCard('again');
      if (e.key === '2') answerCard('hard');
      if (e.key === '3') answerCard('good');
      if (e.key === '4') answerCard('easy');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, currentQuestion, revealed, answerCard]);
  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Secondary product inside portfolio</p>
          <h1>Japanese Cognitive Flashcards</h1>
          <p className="subtitle">JLPT-focused review with workplace Japanese for cloud/infrastructure work. Active recall first, reveal after thinking.</p>
        </div>
        <div className={`api-pill ${apiOk === false ? 'api-pill--err' : apiOk ? 'api-pill--ok' : ''}`}>
          {apiOk === null && 'Connecting…'}
          {apiOk === true && 'API connected'}
          {apiOk === false && 'API offline'}
        </div>
      </header>

      <nav className="tabs" aria-label="Views">
        <button type="button" className={view === 'today' ? 'tab active' : 'tab'} onClick={() => setView('today')}>Today</button>
        <button type="button" className={view === 'add' ? 'tab active' : 'tab'} onClick={() => setView('add')}>Add card</button>
        <button type="button" className={view === 'deck' ? 'tab active' : 'tab'} onClick={() => setView('deck')}>Deck ({cards.length})</button>
        <button type="button" className={view === 'progress' ? 'tab active' : 'tab'} onClick={() => setView('progress')}>Progress</button>
      </nav>

      {error && (
        <div className="banner banner--error" role="alert">
          {error}
          <button type="button" className="link-btn" onClick={loadAll}>Retry</button>
        </div>
      )}

      {view === 'today' && (
        <section className="study" aria-label="Today's review">
          {loading ? <p className="muted">Loading…</p> : null}

          {overview ? (
            <div className="stats-grid">
              {overview.map((row) => (
                <div key={row.label} className="stat-card">
                  <p className="stat-label">{row.label}</p>
                  <p className="stat-value">{row.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="panel actions-row">
            <div>
              <h2>Today's Review</h2>
              <p className="muted">Unlock level: {summary?.unlockLevel ?? 1}. Weakness-first prioritization is automatic.</p>
            </div>
            <div className="row-gap">
              <button type="button" className="btn primary" onClick={startReview}>Start review</button>
              {!cards.length ? <button type="button" className="btn" onClick={hydrateStarter}>Load starter vocabulary</button> : null}
            </div>
          </div>

          {currentQuestion && currentCard && !sessionDone ? (
            <>
              <div className="progress-row">
                <span>{sessionTotal - remaining + 1} / {sessionTotal} · Remaining {remaining - 1 >= 0 ? remaining - 1 : 0}</span>
                <div className="progress-bar" aria-hidden>
                  <div className="progress-fill" style={{ width: `${Math.round(((sessionTotal - remaining + 1) / Math.max(1, sessionTotal)) * 100)}%` }} />
                </div>
              </div>

              <Flashcard card={currentCard} question={currentQuestion} revealed={revealed} onReveal={() => setRevealed(true)} />

              <div className="panel">
                <label>
                  Your answer (optional)
                  <textarea value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} rows={2} placeholder="Type your recall attempt before grading" />
                </label>

                <div className="mistake-grid" role="group" aria-label="Mistake types">
                  {MISTAKE_TYPES.map((type) => (
                    <button
                      type="button"
                      key={type}
                      className={mistakeTypes.includes(type) ? 'pill active' : 'pill'}
                      onClick={() => toggleMistake(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <p className="muted small">Shortcuts: R reveal · 1 Again · 2 Hard · 3 Good · 4 Easy</p>
                <div className="controls">
                  <button type="button" className="btn danger" disabled={!revealed} onClick={() => answerCard('again')}>Again</button>
                  <button type="button" className="btn" disabled={!revealed} onClick={() => answerCard('hard')}>Hard</button>
                  <button type="button" className="btn primary" disabled={!revealed} onClick={() => answerCard('good')}>Good</button>
                  <button type="button" className="btn primary alt" disabled={!revealed} onClick={() => answerCard('easy')}>Easy</button>
                </div>
              </div>
            </>
          ) : null}

          {sessionDone ? (
            <div className="panel recap">
              <h3>Session recap</h3>
              <div className="stats-grid mini">
                <div className="stat-card"><p className="stat-label">Learned</p><p className="stat-value">{sessionRecap.learned}</p></div>
                <div className="stat-card"><p className="stat-label">Strengthened</p><p className="stat-value">{sessionRecap.strengthened}</p></div>
                <div className="stat-card"><p className="stat-label">Needs review</p><p className="stat-value">{sessionRecap.needsReview}</p></div>
                <div className="stat-card"><p className="stat-label">Tomorrow due</p><p className="stat-value">{summary?.summary?.due ?? 0}</p></div>
              </div>
              <p className="muted small">Mistakes tracked: {sessionRecap.mistakes.slice(-8).join(', ') || 'None in this session'}</p>
            </div>
          ) : null}
        </section>
      )}

      {view === 'add' && <AddCardForm onCreated={handleCreated} onCancel={() => setView('today')} />}

      {view === 'deck' && (
        <section className="deck" aria-label="All cards">
          <ul className="deck-list">
            {cards.map((c) => (
              <li key={c.CardID} className="deck-item">
                <div className="deck-main">
                  <span className="deck-word">{c.word}</span>
                  <span className="deck-meaning">{c.meaning}</span>
                  <span className="muted small">{c.learningState} · Lv {c.level} · {c.jlptLevel} · next {c.nextReviewAt ? new Date(c.nextReviewAt).toLocaleDateString() : 'now'}</span>
                </div>
                <button type="button" className="btn danger small" onClick={() => handleDelete(c.CardID)} aria-label={`Delete ${c.word}`}>Delete</button>
              </li>
            ))}
          </ul>
          {nextCursor ? <p className="muted small">More cards exist. Increase API page size for full export views.</p> : null}
        </section>
      )}

      {view === 'progress' && (
        <section className="panel" aria-label="Progress dashboard">
          <h2>Learning history</h2>
          <p className="muted">Per-card review performance with mastery and next review schedule.</p>
          <div className="progress-table" role="table" aria-label="Card progress table">
            <div className="progress-head" role="row">
              <span>Card</span><span>State</span><span>Accuracy</span><span>Reviews</span><span>Last</span><span>Next</span>
            </div>
            {cards.map((c) => {
              const accuracy = c.reviews ? Math.round((c.correct / c.reviews) * 100) : 0;
              return (
                <div className="progress-row-item" role="row" key={`${c.CardID}-progress`}>
                  <span>{c.word}</span>
                  <span>{c.learningState}</span>
                  <span>{accuracy}%</span>
                  <span>{c.reviews}</span>
                  <span>{c.lastReviewedAt ? new Date(c.lastReviewedAt).toLocaleDateString() : '-'}</span>
                  <span>{c.nextReviewAt ? new Date(c.nextReviewAt).toLocaleDateString() : '-'}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer className="footer">
        <a href="/" className="back-link">← Back to portfolio</a>
        <p className="muted small">Persistent data: AWS DynamoDB · SRS + history enabled</p>
      </footer>
    </div>
  );
}
