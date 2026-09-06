import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Linkedin, Github, Instagram, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { profile } from '../content/portfolio';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const CHANNELS = [
  { label: 'Email', value: profile.email, href: `mailto:${profile.email}`, Icon: Mail },
  { label: 'LinkedIn', value: 'Connect professionally', href: profile.links.linkedin, Icon: Linkedin },
  { label: 'GitHub', value: 'See the code', href: profile.links.github, Icon: Github },
  { label: 'Instagram', value: 'Personal', href: profile.links.instagram, Icon: Instagram },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '', company: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Request failed (${res.status})`);
      }
      setStatus('sent');
      setForm({ name: '', email: '', message: '', company: '' });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section id="contact" className="section">
      <div className="shell">
        <SectionHeader eyebrow="Contact" title="Let's talk" lead={profile.contactIntro} />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-base leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              {profile.positioning}
            </p>

            <ul className="mt-8 space-y-3">
              {CHANNELS.map(({ label, value, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={href.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noreferrer"
                    className="card card-hover flex items-center gap-4 p-4"
                  >
                    <span
                      className="grid h-10 w-10 flex-none place-items-center rounded-lg"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold" style={{ color: 'var(--ink)' }}>{label}</span>
                      <span className="block truncate text-sm" style={{ color: 'var(--muted)' }}>{value}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="card no-print p-6 sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="field-label">Your name</label>
                <input
                  id="name" name="name" required value={form.name} onChange={change}
                  className="field" placeholder="Jane Tanaka" autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="email" className="field-label">Email</label>
                <input
                  id="email" name="email" type="email" required value={form.email} onChange={change}
                  className="field" placeholder="you@company.co.jp" autoComplete="email"
                />
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="message" className="field-label">Message</label>
              <textarea
                id="message" name="message" required rows={6} value={form.message} onChange={change}
                className="field resize-y" placeholder="Tell me about the role or project…"
              />
            </div>

            {/* Honeypot — hidden from people, tempting to bots. */}
            <input
              type="text" name="company" value={form.company} onChange={change}
              tabIndex={-1} autoComplete="off" aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
            />

            <button type="submit" className="btn btn-primary mt-6 w-full" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : (<><Send className="h-4 w-4" /> Send message</>)}
            </button>

            {status === 'sent' ? (
              <p
                className="mt-4 flex items-start gap-2 rounded-lg p-3 text-sm"
                style={{
                  background: 'color-mix(in srgb, var(--success) 12%, transparent)',
                  color: 'var(--success)',
                }}
                role="status"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
                Message received. I'll get back to you at the address you provided.
              </p>
            ) : null}

            {status === 'error' ? (
              <p
                className="mt-4 flex items-start gap-2 rounded-lg p-3 text-sm"
                style={{
                  background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
                  color: 'var(--danger)',
                }}
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <span>
                  {error}. You can also email me directly at{' '}
                  <a href={`mailto:${profile.email}`} className="underline">{profile.email}</a>.
                </span>
              </p>
            ) : null}
          </motion.form>
        </div>
      </div>
    </section>
  );
}
