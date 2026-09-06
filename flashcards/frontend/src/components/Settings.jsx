import { useEffect, useState } from 'react';
import { api } from '../api';

const NUMERIC_FIELDS = [
  { key: 'newPerDay', label: 'New cards / day', hint: 'Anki default is 20' },
  { key: 'revPerDay', label: 'Maximum reviews / day', hint: 'Anki default is 200' },
  { key: 'graduatingInterval', label: 'Graduating interval (days)' },
  { key: 'easyInterval', label: 'Easy interval (days)' },
  { key: 'startingEase', label: 'Starting ease', step: 0.05 },
  { key: 'easyBonus', label: 'Easy bonus', step: 0.05 },
  { key: 'hardInterval', label: 'Hard multiplier', step: 0.05 },
  { key: 'intervalModifier', label: 'Interval modifier', step: 0.05 },
  { key: 'lapseMultiplier', label: 'New interval after lapse', step: 0.05 },
  { key: 'maximumInterval', label: 'Maximum interval (days)' },
  { key: 'leechThreshold', label: 'Leech threshold (lapses)' },
];

export default function Settings({
  decks, deck, globalConfig, guard, onChanged, health, onPasscodeChange, currentPasscode,
}) {
  const [target, setTarget] = useState(deck?.deckId || '');
  const [config, setConfig] = useState(null);
  const [passcode, setPasscodeValue] = useState(currentPasscode || '');
  const [status, setStatus] = useState('');

  const selected = decks.find((d) => d.deckId === target);

  useEffect(() => {
    setConfig(selected ? { ...selected.config } : globalConfig ? { ...globalConfig } : null);
  }, [selected, globalConfig]);

  if (!config) return <p className="muted">No configuration loaded.</p>;

  const setField = (key, value) => setConfig({ ...config, [key]: value });

  const save = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      await guard(() => api.updateDeck(target ? { deckId: target, config } : { config }));
      setStatus(target ? `Saved settings for ${selected.name}.` : 'Saved global defaults.');
      onChanged();
    } catch {
      /* handled */
    }
  };

  const steps = (value) => (Array.isArray(value) ? value.join(' ') : String(value || ''));

  return (
    <section className="stack" aria-label="Settings">
      <form className="panel" onSubmit={save}>
        <h3>Scheduling</h3>
        <label className="inline">
          Applies to
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Global defaults</option>
            {decks.map((d) => (
              <option key={d.deckId} value={d.deckId}>{d.name}</option>
            ))}
          </select>
        </label>

        <div className="field-grid">
          <label>
            Learning steps (minutes)
            <input
              value={steps(config.learnSteps)}
              onChange={(e) => setField('learnSteps', e.target.value.split(/[\s,]+/).filter(Boolean).map(Number))}
              placeholder="1 10"
            />
          </label>
          <label>
            Relearning steps (minutes)
            <input
              value={steps(config.relearnSteps)}
              onChange={(e) => setField('relearnSteps', e.target.value.split(/[\s,]+/).filter(Boolean).map(Number))}
              placeholder="10"
            />
          </label>

          {NUMERIC_FIELDS.map((field) => (
            <label key={field.key}>
              {field.label}
              <input
                type="number"
                step={field.step || 1}
                min="0"
                value={config[field.key]}
                onChange={(e) => setField(field.key, Number(e.target.value))}
              />
              {field.hint ? <span className="muted small">{field.hint}</span> : null}
            </label>
          ))}
        </div>

        <div className="row-gap">
          <button type="submit" className="btn primary">Save settings</button>
          {status ? <span className="muted small">{status}</span> : null}
        </div>
      </form>

      <div className="panel">
        <h3>Access</h3>
        <p className="muted small">
          {health?.passcodeEnabled
            ? 'This deployment requires a passcode for any change. It is stored in this browser only.'
            : 'No passcode is configured on the server, so the API accepts writes from anyone. Set STUDY_PASSCODE in Vercel to lock it down.'}
        </p>
        <div className="row-gap">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscodeValue(e.target.value)}
            placeholder="Study passcode"
            aria-label="Study passcode"
          />
          <button type="button" className="btn" onClick={() => onPasscodeChange(passcode)}>Save passcode</button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setPasscodeValue('');
              onPasscodeChange('');
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Backend</h3>
        <dl className="kv">
          <dt>Table</dt><dd>{health?.table}</dd>
          <dt>Region</dt><dd>{health?.region}</dd>
          <dt>Timezone</dt><dd>{health?.timezone}</dd>
          <dt>Day rollover</dt><dd>04:00 local</dd>
          <dt>Decks</dt><dd>{health?.deckCount}</dd>
        </dl>
      </div>
    </section>
  );
}
