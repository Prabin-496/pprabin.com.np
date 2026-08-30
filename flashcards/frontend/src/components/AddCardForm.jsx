import { useState } from 'react';
import { api } from '../api';

const INITIAL_FORM = {
  word: '',
  meaning: '',
  reading: '',
  kanji: '',
  hiragana: '',
  katakana: '',
  japaneseMeaning: '',
  partOfSpeech: '',
  exampleSentence: '',
  exampleSentenceReading: '',
  exampleSentenceMeaning: '',
  workplaceRelevance: '',
  jlptLevel: 'N3',
  category: 'business',
  topic: '',
  mnemonic: '',
  similarWords: '',
  relatedWords: '',
  collocations: '',
  difficulty: '2',
  level: '1',
};

export default function AddCardForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        level: Number(form.level),
        difficulty: Number(form.difficulty),
      };
      const { card } = await api.createCard(payload);
      onCreated(card);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="add-form panel" onSubmit={submit}>
      <h2>Add vocabulary</h2>
      <p className="muted">Fields are optional except Japanese + English meaning.</p>
      {error && <p className="form-error">{error}</p>}

      <div className="grid two">
        <label>
          Japanese word <span className="req">*</span>
          <input value={form.word} onChange={(e) => update('word', e.target.value)} placeholder="例: 移行" required lang="ja" />
        </label>
        <label>
          English meaning <span className="req">*</span>
          <input value={form.meaning} onChange={(e) => update('meaning', e.target.value)} placeholder="e.g. migration" required />
        </label>
      </div>

      <div className="grid two">
        <label>Reading<input value={form.reading} onChange={(e) => update('reading', e.target.value)} placeholder="いこう" /></label>
        <label>Part of speech<input value={form.partOfSpeech} onChange={(e) => update('partOfSpeech', e.target.value)} placeholder="noun" /></label>
      </div>

      <div className="grid three">
        <label>Kanji<input value={form.kanji} onChange={(e) => update('kanji', e.target.value)} lang="ja" /></label>
        <label>Hiragana<input value={form.hiragana} onChange={(e) => update('hiragana', e.target.value)} lang="ja" /></label>
        <label>Katakana<input value={form.katakana} onChange={(e) => update('katakana', e.target.value)} lang="ja" /></label>
      </div>

      <label>Japanese meaning<input value={form.japaneseMeaning} onChange={(e) => update('japaneseMeaning', e.target.value)} lang="ja" /></label>
      <label>Example sentence<textarea value={form.exampleSentence} onChange={(e) => update('exampleSentence', e.target.value)} rows={2} lang="ja" /></label>
      <div className="grid two">
        <label>Sentence reading<input value={form.exampleSentenceReading} onChange={(e) => update('exampleSentenceReading', e.target.value)} /></label>
        <label>Sentence meaning<input value={form.exampleSentenceMeaning} onChange={(e) => update('exampleSentenceMeaning', e.target.value)} /></label>
      </div>

      <label>Workplace relevance<textarea value={form.workplaceRelevance} onChange={(e) => update('workplaceRelevance', e.target.value)} rows={2} /></label>

      <div className="grid three">
        <label>
          JLPT
          <select value={form.jlptLevel} onChange={(e) => update('jlptLevel', e.target.value)}>
            <option>N5</option><option>N4</option><option>N3</option><option>N2</option><option>N1</option>
          </select>
        </label>
        <label>
          Category
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            <option value="business">Business</option>
            <option value="cloud-infrastructure">Cloud / Infrastructure</option>
            <option value="it-workplace">IT Workplace</option>
            <option value="daily-life">Daily Life</option>
          </select>
        </label>
        <label>Topic<input value={form.topic} onChange={(e) => update('topic', e.target.value)} placeholder="IAM / migration" /></label>
      </div>

      <div className="grid two">
        <label>Mnemonic<textarea value={form.mnemonic} onChange={(e) => update('mnemonic', e.target.value)} rows={2} /></label>
        <label>Collocations (comma-separated)<textarea value={form.collocations} onChange={(e) => update('collocations', e.target.value)} rows={2} /></label>
      </div>

      <div className="grid two">
        <label>Similar words (comma-separated)<input value={form.similarWords} onChange={(e) => update('similarWords', e.target.value)} placeholder="移設, 移動" /></label>
        <label>Related words (comma-separated)<input value={form.relatedWords} onChange={(e) => update('relatedWords', e.target.value)} placeholder="手順, 検証" /></label>
      </div>

      <div className="grid two">
        <label>Difficulty (1-5)<input type="number" min="1" max="5" value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)} /></label>
        <label>Unlock level (1-7)<input type="number" min="1" max="7" value={form.level} onChange={(e) => update('level', e.target.value)} /></label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save card'}</button>
      </div>
    </form>
  );
}
