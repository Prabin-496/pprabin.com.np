import { useMemo, useState } from 'react';
import { api } from '../api';

/**
 * Exam countdown and pace check.
 *
 * Compares the new-cards-per-day setting against what the deadline actually
 * requires, so an unrealistic pace is visible before it becomes a problem.
 */
export default function ExamPlan({ decks, config, guard, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(config?.examDate || '');
  const [deckId, setDeckId] = useState(config?.examDeckId || 'jlpt-n2');

  const plan = useMemo(() => {
    if (!config?.examDate || !config?.examDeckId) return null;
    const deck = decks.find((d) => d.deckId === config.examDeckId);
    if (!deck) return null;

    const msPerDay = 86400000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(`${config.examDate}T00:00:00`);
    const daysLeft = Math.ceil((exam - today) / msPerDay);

    const unseen = deck.counts.newTotal;
    const total = unseen + (deck.counts.reviewDue || 0);
    const seen = Math.max(0, total - unseen);
    const requiredPerDay = daysLeft > 0 ? Math.ceil(unseen / daysLeft) : Infinity;
    const currentPace = deck.config.newPerDay;
    const finishInDays = currentPace > 0 ? Math.ceil(unseen / currentPace) : Infinity;

    return {
      deck, daysLeft, unseen, seen, total,
      requiredPerDay, currentPace, finishInDays,
      onTrack: Number.isFinite(requiredPerDay) && currentPace >= requiredPerDay,
      // Steady-state reviews land near 8-10x the daily new-card rate under SM-2.
      estimatedReviews: Math.round(currentPace * 9),
      estimatedMinutes: Math.round((currentPace * 9 * 6 + currentPace * 12) / 60),
    };
  }, [config, decks]);

  const save = async () => {
    try {
      await guard(() => api.updateDeck({ config: { examDate: date || null, examDeckId: deckId || null } }));
      setEditing(false);
      onChanged();
    } catch {
      /* handled upstream */
    }
  };

  if (!plan || editing) {
    return (
      <div className="panel exam-panel">
        <h3>Exam plan</h3>
        <p className="muted small">
          Set your exam date and target deck to get a countdown and a required daily pace.
        </p>
        <div className="row-gap">
          <label className="inline">
            Exam date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="inline">
            Deck
            <select value={deckId} onChange={(e) => setDeckId(e.target.value)}>
              {decks.map((d) => (
                <option key={d.deckId} value={d.deckId}>{d.name}</option>
              ))}
            </select>
          </label>
          <button type="button" className="btn primary" onClick={save} disabled={!date}>Save plan</button>
          {plan ? <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`panel exam-panel ${plan.onTrack ? 'exam-panel--ok' : 'exam-panel--warn'}`}>
      <div className="exam-head">
        <div>
          <h3>{plan.deck.name} · exam in {plan.daysLeft} days</h3>
          <p className="muted small">{new Date(`${config.examDate}T00:00:00`).toDateString()}</p>
        </div>
        <button type="button" className="link-btn" onClick={() => setEditing(true)}>Change</button>
      </div>

      <div className="exam-metrics">
        <Metric label="Words left" value={plan.unseen} />
        <Metric label="Needed / day" value={Number.isFinite(plan.requiredPerDay) ? plan.requiredPerDay : '—'} />
        <Metric label="Current pace" value={`${plan.currentPace}/day`} />
        <Metric label="Finishes in" value={Number.isFinite(plan.finishInDays) ? `${plan.finishInDays}d` : '—'} />
      </div>

      <div className="exam-progress" aria-hidden>
        <span
          className="exam-progress-fill"
          style={{ width: `${plan.total ? (plan.seen / plan.total) * 100 : 0}%` }}
        />
      </div>

      <p className={plan.onTrack ? 'exam-verdict ok' : 'exam-verdict warn'}>
        {plan.onTrack
          ? `On track — ${plan.currentPace}/day finishes the deck ${Math.max(0, plan.daysLeft - plan.finishInDays)} days before the exam.`
          : `Behind — at ${plan.currentPace}/day you need ${plan.finishInDays} days but only have ${plan.daysLeft}. Raise new cards/day to ${plan.requiredPerDay} in Settings.`}
      </p>
      <p className="muted small">
        Expect roughly {plan.estimatedReviews} reviews/day at steady state — about {plan.estimatedMinutes} minutes daily.
      </p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="exam-metric">
      <span className="muted small">{label}</span>
      <b>{value}</b>
    </div>
  );
}
