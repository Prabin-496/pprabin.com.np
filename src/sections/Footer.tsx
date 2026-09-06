import { Github, Linkedin, Instagram, Camera } from 'lucide-react';
import { profile, navLinks } from '../content/portfolio';

const SOCIALS = [
  { href: profile.links.linkedin, Icon: Linkedin, label: 'LinkedIn' },
  { href: profile.links.github, Icon: Github, label: 'GitHub' },
  { href: profile.links.instagram, Icon: Instagram, label: 'Instagram' },
  { href: profile.links.photography, Icon: Camera, label: 'Photography' },
];

const TOOLS = [
  { href: '/flashcards', label: 'Japanese Flashcards' },
  { href: '/voice-ai/', label: 'Voice AI Transcriber' },
];

export default function Footer() {
  return (
    <footer className="no-print" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="shell py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-lg font-semibold" style={{ color: 'var(--ink)' }}>
              {profile.name}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              {profile.shortRole} · {profile.locationShort}
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="link-underline mt-3 inline-block text-sm"
            >
              {profile.email}
            </a>
          </div>

          <nav aria-label="Footer">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Sections
            </p>
            <ul className="mt-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a href={`#${link.id}`} className="text-sm transition hover:opacity-80" style={{ color: 'var(--ink-soft)' }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Tools
            </p>
            <ul className="mt-4 space-y-2">
              {TOOLS.map((tool) => (
                <li key={tool.href}>
                  <a
                    href={tool.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm transition hover:opacity-80"
                    style={{ color: 'var(--ink-soft)' }}
                  >
                    {tool.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-12 flex flex-wrap items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            © {new Date().getFullYear()} {profile.name}. All rights reserved.
          </p>
          <ul className="flex items-center gap-2">
            {SOCIALS.map(({ href, Icon, label }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg transition"
                  style={{ border: '1px solid var(--line)', color: 'var(--ink-soft)' }}
                >
                  <Icon className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
