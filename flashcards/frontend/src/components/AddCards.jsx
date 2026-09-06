import { useState } from 'react';
import { api } from '../api';

const BLANK = {
  expression: '', reading: '', romaji: '', meaning: '',
  exampleSentence: '', mnemonic: '', kanjiBreakdown: '', notes: '', tags: '',
};

export default function AddCards({ deck, guard, onChanged }) {
  const [form, setForm] = useState(BLANK);
  const [saved, setSaved] = useState('');
  const [csv, setCsv] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.expression.trim() || !form.meaning.trim()) return;
    try {
      await guard(() => api.createCards(deck.deckId, [{ ...form, tags: form.tags }]));
      setSaved(form.expression);
      setForm(BLANK);
      onChanged();
    } catch {
      /* handled */
    }
  };

  /** Import expects: expression, reading, meaning[, example, tags] per line. */
  const runImport = async () => {
    const rows = parseDelimited(csv);
    if (!rows.length) {
      setImportResult('Nothing to import — check the format.');
      return;
    }
    setImporting(true);
    setImportResult('');
    try {
      let done = 0;
      for (let i = 0; i < rows.length; i += 200) {
        const chunk = rows.slice(i, i + 200);
        await guard(() => api.createCards(deck.deckId, chunk));
        done += chunk.length;
        setImportResult(`Imported ${done}/${rows.length}…`);
      }
      setImportResult(`Imported ${done} cards.`);
      setCsv('');
      onChanged();
    } catch {
      setImportResult('');
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="stack" aria-label="Add cards">
      <form className="panel" onSubmit={submit}>
        <h3>Add a card to {deck.name}</h3>
        {saved ? <p className="callout callout--calm">Added “{saved}”.</p> : null}

        <div className="field-grid">
          <label>
            Expression <span className="req">*</span>
            <input
              value={form.expression}
              onChange={(e) => setForm({ ...form, expression: e.target.value })}
              lang="ja"
              placeholder="確認"
              required
            />
          </label>
          <label>
            Reading
            <input
              value={form.reading}
              onChange={(e) => setForm({ ...form, reading: e.target.value })}
              lang="ja"
              placeholder="かくにん"
            />
          </label>
          <label className="span-2">
            Meaning <span className="req">*</span>
            <input
              value={form.meaning}
              onChange={(e) => setForm({ ...form, meaning: e.target.value })}
              placeholder="check, confirm"
              required
            />
          </label>
          <label className="span-2">
            Example sentence
            <input
              value={form.exampleSentence}
              onChange={(e) => setForm({ ...form, exampleSentence: e.target.value })}
              lang="ja"
              placeholder="設定内容を確認します。"
            />
          </label>
          <label className="span-2">
            Mnemonic (memory hook)
            <textarea
              value={form.mnemonic}
              rows={2}
              onChange={(e) => setForm({ ...form, mnemonic: e.target.value })}
              placeholder="確 = sure + 認 = recognise → make certain by checking"
            />
          </label>
          <label className="span-2">
            Notes
            <textarea
              value={form.notes}
              rows={2}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <label className="span-2">
            Tags (space separated)
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="business cloud n2"
            />
          </label>
        </div>

        <button type="submit" className="btn primary">Add card</button>
      </form>

      <div className="panel">
        <h3>Bulk import</h3>
        <p className="muted small">
          One card per line, comma or tab separated:
          <code> expression, reading, meaning, example, tags</code>
        </p>
        <textarea
          rows={8}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={'確認, かくにん, check / confirm\n共有, きょうゆう, share'}
          className="mono"
        />
        <div className="row-gap">
          <button type="button" className="btn primary" onClick={runImport} disabled={importing || !csv.trim()}>
            {importing ? 'Importing…' : 'Import'}
          </button>
          {importResult ? <span className="muted small">{importResult}</span> : null}
        </div>
      </div>
    </section>
  );
}

/** Split on tabs when present, otherwise commas — handles both paste sources. */
function parseDelimited(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const [expression, reading, meaning, exampleSentence, tags] = parts.map((p) => (p || '').trim());
      return { expression, reading, meaning, exampleSentence, tags };
    })
    .filter((row) => row.expression && row.meaning);
}
