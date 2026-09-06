import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Stats({ deck }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .stats(deck.deckId, 120)
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [deck.deckId]);

  if (loading) return <p className="muted">Crunching review history…</p>;
  if (error) return <p className="banner banner--error">{error}</p>;
  if (!data) return null;

  const { totals, states, heatmap, forecast, intervals, ease, hardest } = data;
  const maxHeat = Math.max(1, ...heatmap.map((d) => d.count));
  const maxForecast = Math.max(1, ...forecast.map((d) => d.count));
  const stateTotal = Math.max(1, Object.values(states).reduce((a, b) => a + b, 0));

  return (
    <section className="stack" aria-label="Statistics">
      <div className="stats-grid">
        <Tile label="Cards" value={totals.cards} />
        <Tile label="Studied" value={totals.studied} />
        <Tile label="Reviews (120d)" value={totals.reviews} />
        <Tile
          label="Retention"
          value={totals.retention == null ? '—' : `${Math.round(totals.retention * 100)}%`}
          hint="Share of reviews not answered Again"
        />
        <Tile label="Streak" value={`${totals.streakDays}d`} />
        <Tile
          label="Avg / card"
          value={totals.avgSecondsPerCard == null ? '—' : `${totals.avgSecondsPerCard}s`}
        />
      </div>

      <div className="panel">
        <h3>Card states</h3>
        <div className="state-bar" role="img" aria-label="Card state distribution">
          {Object.entries(states).map(([key, value]) =>
            value ? (
              <span
                key={key}
                className={`state-seg state-seg--${key}`}
                style={{ width: `${(value / stateTotal) * 100}%` }}
                title={`${key}: ${value}`}
              />
            ) : null
          )}
        </div>
        <div className="legend">
          {Object.entries(states).map(([key, value]) => (
            <span key={key} className="legend-item">
              <i className={`swatch swatch--${key}`} aria-hidden /> {key} <b>{value}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Review activity</h3>
        <p className="muted small">Last 120 days · darker means more reviews</p>
        <div className="heatmap" role="img" aria-label="Review heatmap">
          {heatmap.map((day) => (
            <span
              key={day.day}
              className="heat-cell"
              style={{ opacity: day.count ? 0.18 + (day.count / maxHeat) * 0.82 : 0.06 }}
              title={`${day.day}: ${day.count} reviews`}
            />
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Forecast</h3>
        <p className="muted small">Reviews already scheduled for the next 30 days</p>
        <div className="bars" role="img" aria-label="Review forecast">
          {forecast.map((day) => (
            <span key={day.day} className="bar-wrap" title={`${day.day}: ${day.count} due`}>
              <span className="bar" style={{ height: `${(day.count / maxForecast) * 100}%` }} />
            </span>
          ))}
        </div>
      </div>

      <div className="two-col">
        <Histogram title="Intervals" subtitle="Days until next review" data={intervals} />
        <Histogram title="Ease factors" subtitle="Lower means harder for you" data={ease} />
      </div>

      {hardest.length ? (
        <div className="panel">
          <h3>Hardest cards</h3>
          <p className="muted small">Most lapses — worth a mnemonic or an example sentence</p>
          <ul className="hardest">
            {hardest.map((card) => (
              <li key={card.cardId}>
                <span lang="ja" className="cell-expression">{card.expression}</span>
                <span className="muted">{card.reading}</span>
                <span>{card.meaning}</span>
                <span className="muted small">
                  {card.lapses} lapses / {card.reps} reps
                  {card.isLeech ? ' · leech' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Tile({ label, value, hint }) {
  return (
    <div className="stat-tile" title={hint}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

function Histogram({ title, subtitle, data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="panel">
      <h3>{title}</h3>
      <p className="muted small">{subtitle}</p>
      <div className="hist">
        {data.map((bucket) => (
          <div key={bucket.label} className="hist-row">
            <span className="hist-label muted small">{bucket.label}</span>
            <span className="hist-track">
              <span className="hist-fill" style={{ width: `${(bucket.count / max) * 100}%` }} />
            </span>
            <span className="hist-count muted small">{bucket.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
