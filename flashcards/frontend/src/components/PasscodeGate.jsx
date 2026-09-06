import { useState } from 'react';

export default function PasscodeGate({ onSubmit, onCancel }) {
  const [value, setValue] = useState('');

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Passcode required">
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSubmit(value.trim());
        }}
      >
        <h2>Passcode required</h2>
        <p className="muted">
          This deck is write-protected. Enter the study passcode to add cards and record reviews.
        </p>
        <input
          type="password"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          placeholder="Study passcode"
          aria-label="Study passcode"
        />
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn primary" disabled={!value.trim()}>Unlock</button>
        </div>
      </form>
    </div>
  );
}
