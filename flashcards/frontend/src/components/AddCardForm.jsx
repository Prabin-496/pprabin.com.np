import { useState } from 'react';
import { api } from '../api';

export default function AddCardForm({ onCreated, onCancel }) {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [hint, setHint] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { card } = await api.createCard({
        word,
        meaning,
        hint: hint || undefined,
        pronunciation: pronunciation || undefined,
      });
      onCreated(card);
      setWord('');
      setMeaning('');
      setHint('');
      setPronunciation('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="add-form panel" onSubmit={submit}>
      <h2>Add a new flashcard</h2>
      <p className="muted">Saved to DynamoDB table <code>Japanese_Flashcard</code></p>

      {error && <p className="form-error">{error}</p>}

      <label>
        Japanese word <span className="req">*</span>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="例: 勉強"
          required
          autoComplete="off"
          lang="ja"
        />
      </label>

      <label>
        English meaning <span className="req">*</span>
        <input
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="e.g. study"
          required
        />
      </label>

      <label>
        Pronunciation <span className="opt">(optional)</span>
        <input
          value={pronunciation}
          onChange={(e) => setPronunciation(e.target.value)}
          placeholder="e.g. benkyō"
        />
      </label>

      <label>
        Memorization hint <span className="opt">(optional)</span>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Mnemonic or grammar note…"
          rows={3}
        />
      </label>

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save card'}
        </button>
      </div>
    </form>
  );
}
