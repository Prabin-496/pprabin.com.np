import { useRef, useState } from 'react';
import { api } from '../api';

/**
 * One-line capture for words picked up at work.
 *
 * Only the word and its meaning are required — reading and a memory hook are
 * optional, so a term seen in a Japanese UI can be saved in a few seconds and
 * enriched later from the Browse tab.
 */
export default function QuickAdd({ decks, guard, onAdded }) {
  const preferred =
    decks.find((d) => d.deckId === 'it-workplace')?.deckId || decks[0]?.deckId || '';

  const [deckId, setDeckId] = useState(preferred);
  const [form, setForm] = useState({ expression: '', reading: '', meaning: '', mnemonic: '' });
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const firstField = useRef(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.expression.trim() || !form.meaning.trim() || busy) return;
    setBusy(true);
    try {
      await guard(() => api.createCards(deckId, [form]));
      setSaved(form.expression.trim());
      setForm({ expression: '', reading: '', meaning: '', mnemonic: '' });
      firstField.current?.focus();
      onAdded();
    } catch {
      /* surfaced by guard */
    } finally {
      setBusy(false);
    }
  };

  if (!decks.length) return null;

  return (
    <form className="panel quick-add" onSubmit={submit}>
      <div className="quick-add-head">
        <h3>Add a word</h3>
        <select value={deckId} onChange={(e) => setDeckId(e.target.value)} aria-label="Deck">
          {decks.map((d) => (
            <option key={d.deckId} value={d.deckId}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="quick-add-row">
        <input
          ref={firstField}
          value={form.expression}
          onChange={set('expression')}
          placeholder="設定"
          lang="ja"
          aria-label="Word"
          required
        />
        <input
          value={form.reading}
          onChange={set('reading')}
          placeholder="せってい (reading)"
          lang="ja"
          aria-label="Reading"
        />
        <input
          value={form.meaning}
          onChange={set('meaning')}
          placeholder="settings"
          aria-label="Meaning"
          required
        />
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? 'Saving…' : 'Add'}
        </button>
      </div>

      <input
        value={form.mnemonic}
        onChange={set('mnemonic')}
        placeholder="Memory hook (optional) — 設 = establish + 定 = fix"
        aria-label="Mnemonic"
      />

      {saved ? <p className="muted small">Added “{saved}” — it will appear in your next session.</p> : null}
    </form>
  );
}
