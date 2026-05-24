export default function Flashcard({ card, flipped, onFlip }) {
  if (!card) return null;

  return (
    <button
      type="button"
      className={`flashcard ${flipped ? 'is-flipped' : ''}`}
      onClick={onFlip}
      aria-pressed={flipped}
      aria-label={flipped ? 'Hide answer' : 'Show answer'}
    >
      <div className="flashcard-inner">
        <div className="flashcard-face flashcard-front">
          <span className="label">Word</span>
          <p className="word">{card.word}</p>
          {card.pronunciation && (
            <p className="pronunciation">{card.pronunciation}</p>
          )}
          <span className="tap">Tap to reveal</span>
        </div>
        <div className="flashcard-face flashcard-back">
          <span className="label">Meaning</span>
          <p className="meaning">{card.meaning}</p>
          {card.hint && (
            <div className="hint-box">
              <span className="label">Hint</span>
              <p>{card.hint}</p>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
