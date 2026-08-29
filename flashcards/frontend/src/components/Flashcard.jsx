export default function Flashcard({ card, question, revealed, onReveal }) {
  if (!card || !question) return null;

  return (
    <section className="flashcard" aria-live="polite">
      <div className="flashcard-face flashcard-front">
        <span className="label">Question type</span>
        <p className="qtype">{question.questionType.replaceAll('_', ' ')}</p>
        <p className="question">{question.prompt}</p>
        {question.options?.length ? (
          <div className="options" role="list">
            {question.options.map((opt) => (
              <span key={opt} className="option" role="listitem">{opt}</span>
            ))}
          </div>
        ) : null}
        {!revealed ? (
          <button type="button" className="btn primary" onClick={onReveal}>Reveal answer</button>
        ) : null}
      </div>

      {revealed && (
        <div className="flashcard-face flashcard-back">
          <span className="label">Answer</span>
          <p className="answer">{question.answer}</p>
          {question.answerReading ? <p className="reading">{question.answerReading}</p> : null}
          <div className="meta">
            <p><strong>Word:</strong> {card.word}</p>
            <p><strong>Meaning:</strong> {card.meaning}</p>
            {card.exampleSentence ? <p><strong>Example:</strong> {card.exampleSentence}</p> : null}
            {card.exampleSentenceMeaning ? <p><strong>Example meaning:</strong> {card.exampleSentenceMeaning}</p> : null}
            {card.mnemonic ? <p><strong>Mnemonic:</strong> {card.mnemonic}</p> : null}
            {card.workplaceRelevance ? <p><strong>Workplace:</strong> {card.workplaceRelevance}</p> : null}
          </div>
        </div>
      )}
    </section>
  );
}
