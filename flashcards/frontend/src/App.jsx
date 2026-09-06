import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, getPasscode, setPasscode } from './api';
import DeckList from './components/DeckList';
import Study from './components/Study';
import Quiz from './components/Quiz';
import Browser from './components/Browser';
import Stats from './components/Stats';
import AddCards from './components/AddCards';
import Settings from './components/Settings';
import PasscodeGate from './components/PasscodeGate';

const VIEWS = {
  decks: 'Decks',
  study: 'Study',
  browse: 'Browse',
  stats: 'Stats',
  add: 'Add',
  settings: 'Settings',
};

export default function App() {
  const [view, setView] = useState('decks');
  const [decks, setDecks] = useState([]);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [activeDeck, setActiveDeck] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [needsPasscode, setNeedsPasscode] = useState(false);
  // Quiz (multiple choice) is the default; classic flip-cards stay available.
  const [studyMode, setStudyMode] = useState(() => {
    try {
      return localStorage.getItem('anki:mode') || 'quiz';
    } catch {
      return 'quiz';
    }
  });

  const switchMode = useCallback(() => {
    setStudyMode((m) => {
      const next = m === 'quiz' ? 'classic' : 'quiz';
      try {
        localStorage.setItem('anki:mode', next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const refreshDecks = useCallback(async () => {
    const { decks: list, config } = await api.listDecks();
    setDecks(list);
    setGlobalConfig(config);
    return list;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [info] = await Promise.all([api.health()]);
      setHealth(info);
      await refreshDecks();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [refreshDecks]);

  useEffect(() => {
    load();
  }, [load]);

  /** Any write can come back demanding the passcode — surface the gate once. */
  const guard = useCallback(async (fn) => {
    setError('');
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'PASSCODE_REQUIRED') {
        setNeedsPasscode(true);
      } else {
        setError(e.message);
      }
      throw e;
    }
  }, []);

  const openDeck = (deck, target = 'study') => {
    setActiveDeck(deck);
    setView(target);
  };

  const deckForView = activeDeck && decks.find((d) => d.deckId === activeDeck.deckId);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>あ</span>
          <div>
            <h1>Japanese Flashcards</h1>
            <p className="brand-sub">
              Anki-style spaced repetition
              {health?.deckCount ? ` · ${health.deckCount} decks` : ''}
            </p>
          </div>
        </div>

        <nav className="tabs" aria-label="Views">
          {Object.entries(VIEWS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={view === key ? 'tab active' : 'tab'}
              disabled={key !== 'decks' && key !== 'settings' && !deckForView}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {deckForView && view !== 'decks' ? (
        <div className="deck-crumb">
          <button type="button" className="link-btn" onClick={() => setView('decks')}>
            ← All decks
          </button>
          <strong>{deckForView.name}</strong>
          <span className="chips">
            <span className="chip chip--new">{deckForView.counts.new} new</span>
            <span className="chip chip--learn">{deckForView.counts.learn} learning</span>
            <span className="chip chip--review">{deckForView.counts.review} due</span>
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="banner banner--error" role="alert">
          <span>{error}</span>
          <button type="button" className="link-btn" onClick={load}>Retry</button>
        </div>
      ) : null}

      <main className="content">
        {loading ? <p className="muted">Loading…</p> : null}

        {!loading && view === 'decks' ? (
          <DeckList
            decks={decks}
            config={globalConfig}
            onOpen={openDeck}
            onRefresh={refreshDecks}
            guard={guard}
          />
        ) : null}

        {!loading && view === 'study' && deckForView ? (
          studyMode === 'quiz' ? (
            <Quiz
              key={`quiz-${deckForView.deckId}`}
              deck={deckForView}
              guard={guard}
              onDeckChanged={refreshDecks}
              onSwitchMode={switchMode}
            />
          ) : (
            <Study
              key={`study-${deckForView.deckId}`}
              deck={deckForView}
              guard={guard}
              onDeckChanged={refreshDecks}
              onSwitchMode={switchMode}
            />
          )
        ) : null}

        {!loading && view === 'browse' && deckForView ? (
          <Browser deck={deckForView} guard={guard} onChanged={refreshDecks} />
        ) : null}

        {!loading && view === 'stats' && deckForView ? (
          <Stats deck={deckForView} />
        ) : null}

        {!loading && view === 'add' && deckForView ? (
          <AddCards deck={deckForView} guard={guard} onChanged={refreshDecks} />
        ) : null}

        {!loading && view === 'settings' ? (
          <Settings
            decks={decks}
            deck={deckForView}
            globalConfig={globalConfig}
            guard={guard}
            onChanged={refreshDecks}
            health={health}
            onPasscodeChange={(value) => {
              setPasscode(value);
              load();
            }}
            currentPasscode={getPasscode()}
          />
        ) : null}
      </main>

      {needsPasscode ? (
        <PasscodeGate
          onSubmit={(value) => {
            setPasscode(value);
            setNeedsPasscode(false);
            load();
          }}
          onCancel={() => setNeedsPasscode(false)}
        />
      ) : null}

      <footer className="footer">
        <a href="/" className="link-btn">← Back to portfolio</a>
        <span className="muted small">
          DynamoDB · SM-2 scheduling{health?.passcodeEnabled ? ' · passcode protected' : ''}
        </span>
      </footer>
    </div>
  );
}
