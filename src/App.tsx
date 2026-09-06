import { useEffect, useState } from 'react';
import Nav from './sections/Nav';
import Hero from './sections/Hero';
import About from './sections/About';
import Skills from './sections/Skills';
import Experience from './sections/Experience';
import Projects from './sections/Projects';
import VideoWork from './sections/VideoWork';
import JapanReadiness from './sections/JapanReadiness';
import Education from './sections/Education';
import Contact from './sections/Contact';
import Footer from './sections/Footer';
import './index.css';

type Theme = 'dark' | 'light';
const THEME_KEY = 'portfolio:theme';

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* storage unavailable — fall through to the system preference */
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* non-fatal */
    }
  }, [theme]);

  return (
    <div className="site-shell">
      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>

      <Nav theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />

      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <VideoWork />
        <JapanReadiness />
        <Education />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
