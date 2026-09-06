import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

/**
 * The words you already know.
 *
 * Everything else in this app is about what to study *next*; this screen is
 * the opposite — a searchable record of what has stuck, drawn from the same
 * scheduling state the study loop writes. It spans decks, so IT & Workplace
 * and JLPT N2 vocabulary can be reviewed together or one at a time.
 */

const STAGES = [
  { key: 'all', label: 'All' },
  { key: 'mature', label: 'Known well', hint: 'Interval of 21 days or more' },
  { key: 'young', label: 'Getting there', hint: 'Graduated, but still comes back within 3 weeks' },
  { key: 'learning', label: 'Still learning', hint: 'On the minute-scale learning steps' },
  { key: 'suspended', label: 'Paused', hint: 'Learned, then suspended' },
];

const SORTS = [
  { key: 'recent', label: 'Recently studied' },
  { key: 'strength', label: 'Strongest first' },
  { key: 'interval', label: 'Longest interval' },
  { key: 'due', label: 'Next review' },
  { key: 'alpha', label: 'A–Z' },
];

const PAGE = 60;

export default function Learned({ decks, initialDeckId = 'all', guard, onChanged }) {
  const [deckId, setDeckId] = useState(initialDeckId || 'all');
  const [stage, setStage] = useState('all');
  const [sort, setSort] = useState('recent');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [data, setData] = useState(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [busyCard, setBusyCard] = useState('');

  // Typing shouldn't fire a query per keystroke — the server filters over
  // every studied card in the deck.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.learned({
        deck: deckId,
        stage,
        sort,
        q: debouncedQ,
        limit: PAGE,
        offset,
      });
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [deckId, stage, sort, debouncedQ, offset]);

  useEffect(() => {
    load();
  }, [load]);

  // Any filter change restarts pagination at the first page.
  useEffect(() => {
    setOffset(0);
  }, [deckId, stage, sort, debouncedQ]);

  const act = async (word, action) => {
    setBusyCard(word.cardId);
    try {
      await guard(() =>
        api.updateCard({ deckId: word.deckId, cardId: word.cardId, action })
      );
      await load();
      onChanged?.();
    } catch {
      /* guard surfaced it */
    } finally {
      setBusyCard('');
    }
  };

  const summary = data?.summary;
  // Decks with nothing learned yet are noise on this screen.
  const deckBreakdown = (summary?.decks || []).filter((d) => d.learned > 0);
  const deckOptions = useMemo(
    () => data?.decks || decks.map((d) => ({ deckId: d.deckId, name: d.name })),
    [data, decks]
  );

  return (
    <section className="stack" aria-label="Words learned">
      <div className="learned-summary">
        <Tile label="Words learned" value={summary?.learned} tone="accent" />
        <Tile label="Known well" value={summary?.mature} tone="mature" />
        <Tile label="Getting there" value={summary?.young} tone="young" />
        <Tile label="Still learning" value={summary?.learning} tone="learn" />
        <Tile label="Answered today" value={summary?.reviewsToday} />
      </div>

      {deckBreakdown.length ? (
        <div className="panel">
          <h3>By deck</h3>
          <ul className="learned-deck-list">
            {deckBreakdown.map((d) => (
              <li key={d.deckId}>
                <button
                  type="button"
                  className={`learned-deck ${deckId === d.deckId ? 'is-active' : ''}`}
                  onClick={() => setDeckId(deckId === d.deckId ? 'all' : d.deckId)}
                >
                  <span className="learned-deck-name">{d.name}</span>
                  <span className="learned-deck-count"><b>{d.learned}</b> learned</span>
                  <span className="learned-deck-split muted small">
                    {d.mature} known well · {d.young} getting there · {d.learning} learning
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="panel toolbar">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a word, reading, meaning or tag…"
          aria-label="Search learned words"
          className="grow"
        />
        <select value={deckId} onChange={(e) => setDeckId(e.target.value)} aria-label="Deck">
          <option value="all">All decks</option>
          {deckOptions.map((d) => (
            <option key={d.deckId} value={d.deckId}>{d.name}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="stage-filter" role="group" aria-label="Filter by how well you know the word">
        {STAGES.map((s) => (
          <button
            key={s.key}
            type="button"
            title={s.hint || ''}
            className={`stage-pill ${stage === s.key ? 'is-active' : ''} stage-pill--${s.key}`}
            onClick={() => setStage(s.key)}
          >
            {s.label}
            {summary && s.key !== 'all' ? (
              <span className="stage-pill-count">{summary[s.key] ?? 0}</span>
            ) : null}
          </button>
        ))}
      </div>

      {error ? (
        <div className="banner banner--error" role="alert">
          <span>{error}</span>
          <button type="button" className="link-btn" onClick={load}>Retry</button>
        </div>
      ) : null}

      {loading ? <p className="muted">Loading your words…</p> : null}

      {!loading && data && data.total === 0 ? (
        <div className="callout callout--calm">
          {debouncedQ
            ? `No learned word matches “${debouncedQ}”.`
            : 'No words here yet — study a deck and every word you answer shows up on this screen.'}
        </div>
      ) : null}

      <ul className="word-list">
        {(data?.words || []).map((word) => {
          const open = expanded === word.cardId;
          return (
            <li key={word.cardId} className={`word-row word-row--${word.stage}`}>
              <button
                type="button"
                className="word-main"
                aria-expanded={open}
                onClick={() => setExpanded(open ? null : word.cardId)}
              >
                <span className="word-lead">
                  <span className="word-expression" lang="ja">{word.expression}</span>
                  {word.reading && word.reading !== word.expression ? (
                    <span className="word-reading" lang="ja">{word.reading}</span>
                  ) : null}
                  {word.romaji ? <span className="word-romaji">{word.romaji}</span> : null}
                </span>

                <span className="word-meaning">
                  {word.meaning}
                  {deckId === 'all' ? (
                    <span className="word-deck muted small">{word.deckName}</span>
                  ) : null}
                </span>

                <span className="word-strength" title={`Recall strength ${word.strength}%`}>
                  <span className="word-strength-track">
                    <span
                      className={`word-strength-fill fill--${word.stage}`}
                      style={{ width: `${word.strength}%` }}
                    />
                  </span>
                  <span className="muted small">{stageLabel(word.stage)}</span>
                </span>

                <span className="word-meta muted small">
                  {intervalLabel(word)}
                  <br />
                  {dueLabel(word)}
                </span>
              </button>

              {open ? (
                <div className="word-detail">
                  <p className="muted small word-detail-stats">
                    {word.deckName} · {word.reps} reviews · {word.lapses} lapses · ease{' '}
                    {word.ease ? `${Math.round(word.ease * 100)}%` : '—'}
                    {word.lastReviewedAt
                      ? ` · last studied ${new Date(word.lastReviewedAt).toLocaleString()}`
                      : ''}
                    {word.isLeech ? ' · leech' : ''}
                  </p>

                  {word.mnemonic ? (
                    <p className="quiz-reveal-hook">
                      <span className="mnemonic-tag">memory hook</span>
                      {word.mnemonic}
                    </p>
                  ) : null}
                  {word.kanjiBreakdown ? (
                    <p className="muted small">{word.kanjiBreakdown}</p>
                  ) : null}
                  {word.exampleSentence ? (
                    <p className="word-example" lang="ja">
                      {word.exampleSentence}
                      {word.exampleMeaning ? (
                        <span className="muted"> — {word.exampleMeaning}</span>
                      ) : null}
                    </p>
                  ) : null}
                  {word.notes ? <p className="muted small">{word.notes}</p> : null}
                  {word.tags?.length ? (
                    <p className="word-tags">
                      {word.tags.map((t) => <span key={t} className="chip">{t}</span>)}
                    </p>
                  ) : null}

                  <div className="row-gap">
                    <button
                      type="button"
                      className="btn"
                      disabled={busyCard === word.cardId}
                      onClick={() => act(word, 'study-now')}
                      title="Put this word back in today's queue, keeping its history"
                    >
                      Practise again today
                    </button>
                    {word.stage === 'suspended' ? (
                      <button
                        type="button"
                        className="btn"
                        disabled={busyCard === word.cardId}
                        onClick={() => act(word, 'unsuspend')}
                      >
                        Unpause
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn"
                        disabled={busyCard === word.cardId}
                        onClick={() => act(word, 'suspend')}
                        title="Stop showing this word without deleting it"
                      >
                        Pause
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn danger"
                      disabled={busyCard === word.cardId}
                      onClick={() => act(word, 'reset')}
                      title="Forget all progress and treat it as a new word again"
                    >
                      Start over
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {data && data.total > PAGE ? (
        <div className="row-gap pager">
          <button
            type="button"
            className="btn"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE))}
          >
            ← Previous
          </button>
          <span className="muted small">
            {offset + 1}–{Math.min(offset + PAGE, data.total)} of {data.total}
          </span>
          <button
            type="button"
            className="btn"
            disabled={offset + PAGE >= data.total}
            onClick={() => setOffset(offset + PAGE)}
          >
            Next →
          </button>
        </div>
      ) : null}
    </section>
  );
}

function Tile({ label, value, tone }) {
  return (
    <div className={`stat-tile ${tone ? `stat-tile--${tone}` : ''}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value ?? '—'}</p>
    </div>
  );
}

function stageLabel(stage) {
  if (stage === 'mature') return 'Known well';
  if (stage === 'young') return 'Getting there';
  if (stage === 'suspended') return 'Paused';
  return 'Still learning';
}

function intervalLabel(word) {
  if (word.stage === 'learning') return `${word.reps} ${word.reps === 1 ? 'review' : 'reviews'}`;
  if (!word.ivl) return '—';
  if (word.ivl < 30) return `every ${word.ivl}d`;
  if (word.ivl < 365) return `every ${Math.round(word.ivl / 30.4)}mo`;
  return `every ${(word.ivl / 365).toFixed(1)}y`;
}

function dueLabel(word) {
  if (word.stage === 'suspended') return 'paused';
  if (!word.due) return '';
  const ms = new Date(word.due).getTime() - Date.now();
  if (Number.isNaN(ms)) return '';
  if (ms <= 0) return 'due now';
  const minutes = ms / 60000;
  if (minutes < 60) return `in ${Math.max(1, Math.round(minutes))}m`;
  if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return hours >= 24 ? 'in 1d' : `in ${hours}h`;
  }
  const days = minutes / 1440;
  if (days < 30) return `in ${Math.round(days)}d`;
  return `in ${Math.round(days / 30.4)}mo`;
}
