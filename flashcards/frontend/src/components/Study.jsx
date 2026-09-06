import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';

const RATINGS = [
  { key: 'again', label: 'Again', hint: '1', className: 'again' },
  { key: 'hard', label: 'Hard', hint: '2', className: 'hard' },
  { key: 'good', label: 'Good', hint: '3', className: 'good' },
  { key: 'easy', label: 'Easy', hint: '4', className: 'easy' },
];

export default function Study({ deck, guard, onDeckChanged, onSwitchMode }) {
  const [state, setState] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const shownAt = useRef(Date.now());

  const applyState = useCallback((next) => {
    setState(next);
    setRevealed(false);
    shownAt.current = Date.now();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.study(deck.deckId);
      applyState(res);
    } catch (e) {
      await guard(() => Promise.reject(e)).catch(() => {});
    } finally {
      setLoading(false);
    }
  }, [deck.deckId, applyState, guard]);

  useEffect(() => {
    load();
  }, [load]);

  const answer = useCallback(
    async (rating) => {
      if (!state?.card || busy || !revealed) return;
      setBusy(true);
      try {
        const res = await guard(() =>
          api.answer({
            deckId: deck.deckId,
            cardId: state.card.cardId,
            rating,
            timeTakenMs: Date.now() - shownAt.current,
          })
        );
        setLastResult({ ...res.scheduled, expression: state.card.expression });
        applyState(res);
        onDeckChanged();
      } catch {
        /* guard surfaced it */
      } finally {
        setBusy(false);
      }
    },
    [state, busy, revealed, guard, deck.deckId, applyState, onDeckChanged]
  );

  const undo = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await guard(() => api.undo(deck.deckId));
      setLastResult(null);
      applyState(res);
      onDeckChanged();
    } catch {
      /* handled */
    } finally {
      setBusy(false);
    }
  }, [busy, guard, deck.deckId, applyState, onDeckChanged]);

  // Keyboard: space reveals, 1-4 grade, u undoes — Anki's muscle memory.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches?.('input, textarea')) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!revealed) setRevealed(true);
        else answer('good');
        return;
      }
      if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        undo();
        return;
      }
      const index = Number(e.key) - 1;
      if (revealed && index >= 0 && index < RATINGS.length) {
        e.preventDefault();
        answer(RATINGS[index].key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, answer, undo]);

  if (loading) return <p className="muted">Loading card…</p>;
  if (!state) return null;

  const { card, counts, previews, learnAhead } = state;

  if (!card) {
    return (
      <section className="stack" aria-label="Session complete">
        <div className="done-card">
          <h2>Deck finished for today</h2>
          <p className="muted">
            {counts.newTotal > 0
              ? `${counts.newTotal} cards are still unseen — they unlock at ${state.config.newPerDay}/day.`
              : 'Every card in this deck is scheduled.'}
          </p>
          {learnAhead ? (
            <p className="muted small">
              Next learning card unlocks in {Math.ceil(learnAhead.inMs / 60000)} min.
            </p>
          ) : null}
          <div className="row-gap">
            <button type="button" className="btn" onClick={undo} disabled={busy}>Undo last answer</button>
            <button type="button" className="btn" onClick={load}>Refresh</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="study" aria-label="Study">
      <div className="study-counts" role="status">
        <span className="count count--new"><b>{counts.new}</b> new</span>
        <span className="count count--learn"><b>{counts.learn}</b> learning</span>
        <span className="count count--review"><b>{counts.review}</b> due</span>
        {card.isLeech ? <span className="count count--leech">leech</span> : null}
        <button type="button" className="link-btn" onClick={onSwitchMode}>Quiz mode</button>
      </div>

      {lastResult ? (
        <p className="last-result muted small">
          {lastResult.expression} → {lastResult.rating}
          {lastResult.to ? ` · next in ${lastResult.to}d` : ''}
          {' · '}
          <button type="button" className="link-btn" onClick={undo} disabled={busy}>undo (u)</button>
        </p>
      ) : null}

      <button
        type="button"
        className={`card ${revealed ? 'card--revealed' : ''}`}
        onClick={() => setRevealed(true)}
        aria-live="polite"
      >
        <div className="card-front">
          <p className="card-expression" lang="ja">{card.expression}</p>
          {!revealed ? <p className="card-prompt muted">Click or press Space to reveal</p> : null}
        </div>

        {revealed ? (
          <div className="card-back">
            {card.reading && card.reading !== card.expression ? (
              <p className="card-reading" lang="ja">{card.reading}</p>
            ) : null}
            {card.romaji ? <p className="card-romaji muted">{card.romaji}</p> : null}
            <p className="card-meaning">{card.meaning}</p>
            {card.mnemonic ? (
              <p className="card-mnemonic">
                <span className="mnemonic-tag">memory hook</span> {card.mnemonic}
              </p>
            ) : null}
            {card.kanjiBreakdown ? (
              <p className="card-breakdown muted small">{card.kanjiBreakdown}</p>
            ) : null}
            {card.exampleSentence ? (
              <p className="card-example" lang="ja">
                {card.exampleSentence}
                {card.exampleMeaning ? <span className="muted"> — {card.exampleMeaning}</span> : null}
              </p>
            ) : null}
            {card.notes ? <p className="card-notes muted small">{card.notes}</p> : null}
            <p className="card-stats muted small">
              {card.type} · {card.reps} reviews · {card.lapses} lapses · ease {Math.round(card.ease * 100)}%
              {card.ivl ? ` · interval ${card.ivl}d` : ''}
            </p>
          </div>
        ) : null}
      </button>

      <div className="answers" role="group" aria-label="Grade this card">
        {RATINGS.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`answer answer--${r.className}`}
            disabled={!revealed || busy}
            onClick={() => answer(r.key)}
          >
            <span className="answer-interval">{previews?.[r.key] ?? '—'}</span>
            <span className="answer-label">{r.label}</span>
            <span className="answer-key">{r.hint}</span>
          </button>
        ))}
      </div>

      <p className="muted small keyboard-hint">
        Space reveal / Good · 1 Again · 2 Hard · 3 Good · 4 Easy · U undo
      </p>
    </section>
  );
}
