import { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { LANGUAGES } from '../content/i18n';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Floating language control.
 *
 * Deliberately not in the nav bar: the nav already carries nine links and a
 * theme toggle, and this needs to stay reachable after the visitor has scrolled
 * into the middle of a long page.
 */
export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={wrapper} className="no-print fixed bottom-5 right-5 z-[55]" data-lang-switcher>
      {open ? (
        <ul
          className="absolute bottom-full right-0 mb-2 min-w-[11rem] overflow-hidden rounded-xl py-1.5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--line)', boxShadow: 'var(--shadow)' }}
          role="listbox"
          aria-label={t.ui.language}
        >
          {LANGUAGES.map((entry) => (
            <li key={entry.code}>
              <button
                type="button"
                role="option"
                aria-selected={entry.code === lang}
                onClick={() => {
                  setLang(entry.code);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition"
                style={{ color: entry.code === lang ? 'var(--accent)' : 'var(--ink-soft)' }}
              >
                <span>
                  <span className="font-medium">{entry.native}</span>
                  {entry.native !== entry.label ? (
                    <span className="ml-2 text-xs" style={{ color: 'var(--muted)' }}>{entry.label}</span>
                  ) : null}
                </span>
                {entry.code === lang ? <Check className="h-3.5 w-3.5 flex-none" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${t.ui.language}: ${current.label}`}
        className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg transition"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line-strong)',
          color: 'var(--ink)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <Globe className="h-4 w-4" style={{ color: 'var(--accent)' }} />
        {current.code.toUpperCase()}
      </button>
    </div>
  );
}
