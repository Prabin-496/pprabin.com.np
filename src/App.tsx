import { useCallback, useEffect, useState } from 'react';
import Nav from './sections/Nav';
import Hero from './sections/Hero';
import About from './sections/About';
import Skills from './sections/Skills';
import Experience from './sections/Experience';
import Projects from './sections/Projects';
import VideoWork from './sections/VideoWork';
import JapanReadiness from './sections/JapanReadiness';
import Education from './sections/Education';
import Certificates from './sections/Certificates';
import FAQ from './sections/FAQ';
import Contact from './sections/Contact';
import Footer from './sections/Footer';
import LanguageSwitcher from './ui/LanguageSwitcher';
import { LanguageProvider } from './i18n/LanguageContext';
import './index.css';

export type Theme = 'dark' | 'light';

const THEME_KEY = 'portfolio:theme';

/**
 * The theme is resolved and applied by an inline script in index.html, before
 * first paint, so the page never flashes the wrong colours. React reads back
 * what that script decided rather than resolving it a second time — running the
 * same logic twice is how the two end up disagreeing.
 */
function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    // Keep the browser chrome (mobile address bar) in step with the page.
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#fbfbf9' : '#0a0c0f');

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* private mode or blocked storage — the theme just will not persist */
    }
  }, [theme]);

  // Follow the OS only while the visitor has not made their own choice.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {
        /* unreadable storage means no stored preference to respect */
      }
      setTheme(e.matches ? 'light' : 'dark');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return (
    <LanguageProvider>
    <div className="site-shell">
      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:px-4 focus:py-2 focus:font-semibold"
        style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
      >
        Skip to content
      </a>

      <Nav theme={theme} onToggleTheme={toggleTheme} />

      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <VideoWork />
        <JapanReadiness />
        <Education />
        <Certificates />
        <FAQ />
        <Contact />
      </main>

      <Footer />
      <LanguageSwitcher />
    </div>
    </LanguageProvider>
  );
}
