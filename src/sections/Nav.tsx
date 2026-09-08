import { useEffect, useState } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { navLinks, profile } from '../content/portfolio';
import { useLanguage } from '../i18n/LanguageContext';

type Props = {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
};

export default function Nav({ theme, onToggleTheme }: Props) {
  const { t, lang } = useLanguage();
  // Japanese and Nepali labels are visibly wider than the English ones, and at
  // xl the nine of them wrap mid-word. Those languages get the drawer until
  // there is genuinely room for a single row.
  const wide = lang === 'en';
  const deskShow = wide ? 'xl:flex' : '2xl:flex';
  const deskHide = wide ? 'xl:hidden' : '2xl:hidden';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the section currently in view rather than recomputing on scroll.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5] }
    );
    navLinks.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // An open drawer must not survive Escape or a jump to desktop width, where it
  // is hidden by CSS but still holds the page scroll lock.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 1280px)');
    const onBreakpoint = () => desktop.matches && setOpen(false);

    document.addEventListener('keydown', onKeyDown);
    desktop.addEventListener('change', onBreakpoint);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', onBreakpoint);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header
      className="no-print fixed inset-x-0 top-0 z-50"
      style={{
        background: scrolled || open ? 'color-mix(in srgb, var(--bg) 80%, transparent)' : 'transparent',
        backdropFilter: scrolled || open ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: scrolled || open ? 'blur(14px)' : 'none',
        borderBottom: `1px solid ${scrolled || open ? 'var(--line)' : 'transparent'}`,
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      <nav className="shell flex h-16 items-center justify-between gap-4" aria-label="Main">
        <a href="#home" className="flex items-center gap-2.5 font-semibold" style={{ color: 'var(--ink)' }}>
          <span
            className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold"
            style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
            aria-hidden
          >
            P
          </span>
          <span className="hidden whitespace-nowrap sm:inline">{profile.name}</span>
        </a>

        {/* Nine links need xl to breathe; below that they live in the drawer. */}
        <ul className={`hidden items-center gap-0.5 ${deskShow}`}>
          {navLinks.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                aria-current={active === link.id ? 'true' : undefined}
                className="block whitespace-nowrap rounded-md px-3 py-2 text-sm transition"
                style={{
                  color: active === link.id ? 'var(--accent)' : 'var(--ink-soft)',
                  background: active === link.id ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                {t.nav[link.id] ?? link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="icon-btn"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <a href="#contact" className="btn btn-primary hidden whitespace-nowrap !px-4 !py-2 sm:inline-flex">
            {t.hero.hireMe}
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`icon-btn ${deskHide}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          className={`max-h-[calc(100vh-4rem)] overflow-y-auto ${deskHide}`}
          style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--line)' }}
        >
          <ul className="shell grid gap-1 py-4">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={() => setOpen(false)}
                  aria-current={active === link.id ? 'true' : undefined}
                  className="block rounded-md px-3 py-2.5 text-sm"
                  style={{
                    color: active === link.id ? 'var(--accent)' : 'var(--ink-soft)',
                    background: active === link.id ? 'var(--accent-soft)' : 'transparent',
                  }}
                >
                  {t.nav[link.id] ?? link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
