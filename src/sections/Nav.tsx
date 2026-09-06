import { useEffect, useState } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { navLinks, profile } from '../content/portfolio';

type Props = {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
};

export default function Nav({ theme, onToggleTheme }: Props) {
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

  return (
    <header
      className="no-print fixed inset-x-0 top-0 z-50 transition-all"
      style={{
        background: scrolled ? 'color-mix(in srgb, var(--bg) 82%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--line)' : 'transparent'}`,
      }}
    >
      <nav className="shell flex h-16 items-center justify-between gap-4" aria-label="Main">
        <a href="#home" className="flex items-center gap-2.5 font-semibold" style={{ color: 'var(--ink)' }}>
          <span
            className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))' }}
            aria-hidden
          >
            P
          </span>
          <span className="hidden sm:inline">{profile.name}</span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className="rounded-md px-3 py-2 text-sm transition"
                style={{
                  color: active === link.id ? 'var(--accent)' : 'var(--ink-soft)',
                  background: active === link.id ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="grid h-9 w-9 place-items-center rounded-lg transition"
            style={{ border: '1px solid var(--line)', color: 'var(--ink-soft)' }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <a href="#contact" className="btn btn-primary hidden !px-4 !py-2 sm:inline-flex">
            Hire me
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg lg:hidden"
            style={{ border: '1px solid var(--line)', color: 'var(--ink-soft)' }}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="lg:hidden" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--line)' }}>
          <ul className="shell grid gap-1 py-4">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm"
                  style={{ color: active === link.id ? 'var(--accent)' : 'var(--ink-soft)' }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
