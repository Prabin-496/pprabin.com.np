import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

/**
 * Multiple-choice study mode.
 *
 * Answering correctly grades the card "good"; answering wrong grades it
 * "again", which sends it back to the first learning step — so a missed word
 * returns within about a minute and keeps returning until it sticks, while a
 * known word's interval grows. That is the same SM-2 engine the classic mode
 * uses; only the question format differs.
 */
export default function Quiz({ deck, guard, onDeckChanged, onSwitchMode }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [streak, setStreak] = useState(0);
  const [tally, setTally] = useState({ right: 0, wrong: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.study(deck.deckId, 'quiz');
      setState(res);
      setPicked(null);
    } finally {
      setLoading(false);
    }
  }, [deck.deckId]);

  useEffect(() => {
    load();
  }, [load]);

  const choose = useCallback(
    async (index) => {
      if (picked !== null || busy || !state?.quiz) return;
      const correct = index === state.quiz.answerIndex;
      setPicked(index);
      setStreak((s) => (correct ? s + 1 : 0));
      setTally((t) => ({ right: t.right + (correct ? 1 : 0), wrong: t.wrong + (correct ? 0 : 1) }));

      setBusy(true);
      try {
        const res = await guard(() =>
          api.answer({
            deckId: deck.deckId,
            cardId: state.card.cardId,
            rating: correct ? 'good' : 'again',
            mode: 'quiz',
          })
        );
        // Hold the feedback on screen; `next` advances to the queued question.
        setState((prev) => ({ ...prev, _next: res }));
        onDeckChanged();
      } catch {
        setPicked(null);
      } finally {
        setBusy(false);
      }
    },
    [picked, busy, state, guard, deck.deckId, onDeckChanged]
  );

  const next = useCallback(() => {
    const queued = state?._next;
    if (!queued) return;
    setState(queued);
    setPicked(null);
  }, [state]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches?.('input, textarea')) return;
      if (picked !== null) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          next();
        }
        return;
      }
      const index = Number(e.key) - 1;
      if (index >= 0 && index < (state?.quiz?.options.length ?? 0)) {
        e.preventDefault();
        choose(index);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picked, next, choose, state]);

  if (loading) return <p className="muted">Loading…</p>;
  if (!state) return null;

  const { quiz, card, counts } = state;

  if (!card || !quiz) {
    return (
      <div className="done-card">
        <h2>All done for today</h2>
        <p className="muted">
          {tally.right + tally.wrong > 0
            ? `${tally.right} right · ${tally.wrong} wrong this session.`
            : 'Nothing is due in this deck right now.'}
        </p>
        <div className="row-gap">
          <button type="button" className="btn" onClick={load}>Check again</button>
          <button type="button" className="btn" onClick={onSwitchMode}>Classic cards</button>
        </div>
      </div>
    );
  }

  const answered = picked !== null;
  const correct = answered && picked === quiz.answerIndex;
  const remaining = counts.new + counts.learn + counts.review;

  return (
    <section className="quiz" aria-label="Quiz">
      <div className="quiz-top">
        <div className="quiz-bar" aria-hidden>
          <span
            className="quiz-bar-fill"
            style={{ width: `${Math.min(100, (tally.right / Math.max(1, tally.right + remaining)) * 100)}%` }}
          />
        </div>
        <div className="quiz-meta">
          <span className="muted small">{remaining} left today</span>
          {streak >= 2 ? <span className="streak">🔥 {streak} in a row</span> : null}
          <button type="button" className="link-btn" onClick={onSwitchMode}>Classic mode</button>
        </div>
      </div>

      <p className="quiz-instruction">{quiz.instruction}</p>

      <div className="quiz-prompt">
        <p className="quiz-prompt-main" lang="ja">{quiz.prompt.main}</p>
        {quiz.prompt.sub ? (
          <p className="quiz-prompt-sub" lang="ja">{quiz.prompt.sub}</p>
        ) : null}
      </div>

      <div className="quiz-options" role="group" aria-label="Answer options">
        {quiz.options.map((option, i) => {
          let tone = '';
          if (answered) {
            if (i === quiz.answerIndex) tone = 'is-correct';
            else if (i === picked) tone = 'is-wrong';
            else tone = 'is-dim';
          }
          return (
            <button
              key={`${option.text}-${i}`}
              type="button"
              className={`quiz-option ${tone}`}
              onClick={() => choose(i)}
              disabled={answered}
            >
              <span className="quiz-option-key">{i + 1}</span>
              <span className="quiz-option-body">
                <span className="quiz-option-text" lang="ja">{option.text}</span>
                {option.sub ? <span className="quiz-option-sub" lang="ja">{option.sub}</span> : null}
              </span>
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className={`quiz-feedback ${correct ? 'is-correct' : 'is-wrong'}`} role="status">
          <p className="quiz-verdict">
            {correct ? 'Correct' : 'Not quite — you will see this again shortly'}
          </p>

          <div className="quiz-reveal">
            <p className="quiz-reveal-word" lang="ja">{quiz.reveal.expression}</p>
            {quiz.reveal.reading && quiz.reveal.reading !== quiz.reveal.expression ? (
              <p className="quiz-reveal-reading" lang="ja">{quiz.reveal.reading}</p>
            ) : null}
            {quiz.reveal.romaji ? <p className="quiz-reveal-romaji">{quiz.reveal.romaji}</p> : null}
            <p className="quiz-reveal-meaning">{quiz.reveal.meaning}</p>
            {quiz.reveal.mnemonic ? (
              <p className="quiz-reveal-hook">
                <span className="mnemonic-tag">memory hook</span>
                {quiz.reveal.mnemonic}
              </p>
            ) : null}
            {quiz.reveal.exampleSentence ? (
              <p className="quiz-reveal-example" lang="ja">
                {quiz.reveal.exampleSentence}
                {quiz.reveal.exampleMeaning ? (
                  <span className="muted"> — {quiz.reveal.exampleMeaning}</span>
                ) : null}
              </p>
            ) : null}
          </div>

          <button type="button" className="btn primary quiz-next" onClick={next} disabled={busy}>
            {busy ? 'Saving…' : 'Continue'}
          </button>
          <p className="muted small">Press Enter to continue</p>
        </div>
      ) : (
        <p className="muted small quiz-hint">Tap an answer, or press 1–4</p>
      )}
    </section>
  );
}
