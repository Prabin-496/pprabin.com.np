import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  dictionary,
  type LanguageCode,
} from '../content/i18n';

const STORAGE_KEY = 'portfolio:lang';

type Value = {
  lang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  t: ReturnType<typeof dictionary>;
};

const LanguageContext = createContext<Value | null>(null);

const isSupported = (value: string): value is LanguageCode =>
  LANGUAGES.some((l) => l.code === value);

/**
 * English is the default even when the browser asks for something else.
 *
 * A recruiter opening this page expects the English version unless they choose
 * otherwise; silently switching on `navigator.language` would hand a Japanese
 * recruiter a page whose project descriptions are still English, which reads
 * worse than a consistent English page. A stored choice always wins.
 */
function initialLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isSupported(stored)) return stored;
  } catch {
    /* storage unavailable — fall through to the default */
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    const entry = LANGUAGES.find((l) => l.code === lang);
    if (entry) document.documentElement.dir = entry.dir;
  }, [lang]);

  const setLang = useCallback((code: LanguageCode) => {
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* non-fatal — the choice just will not persist */
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang, t: dictionary(lang) }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
