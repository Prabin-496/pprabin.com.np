import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Lock,
  LockOpen,
  ShieldCheck,
} from 'lucide-react';
import { privateDocumentGroups, type PrivateDocument } from '../content/certificates';

type State =
  | { status: 'locked' }
  | { status: 'unlocking' }
  | { status: 'unlocked'; token: string; available: string[]; expiresAt: number }
  | { status: 'error'; message: string };

/**
 * Company registration and identity papers, behind a passcode.
 *
 * The gate is enforced by `/api/documents`, not here — this component never
 * holds a document URL that works without the server's say-so. After a correct
 * passcode the API returns a short-lived signed token, and each document link
 * carries that token; when it expires the vault re-locks itself.
 */
export default function PrivateVault() {
  const [passcode, setPasscode] = useState('');
  const [state, setState] = useState<State>({ status: 'locked' });
  const inputRef = useRef<HTMLInputElement>(null);

  const unlocked = state.status === 'unlocked' ? state : null;

  // Re-lock when the token expires so a stale tab cannot keep serving links.
  useEffect(() => {
    if (!unlocked) return;
    const ms = unlocked.expiresAt - Date.now();
    if (ms <= 0) {
      setState({ status: 'locked' });
      return;
    }
    const timer = setTimeout(() => setState({ status: 'locked' }), ms);
    return () => clearTimeout(timer);
  }, [unlocked]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ status: 'unlocking' });
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setState({ status: 'error', message: payload.error || `Request failed (${res.status})` });
        return;
      }

      setPasscode('');
      setState({
        status: 'unlocked',
        token: payload.token,
        available: payload.available ?? [],
        expiresAt: payload.expiresAt ?? Date.now() + 15 * 60 * 1000,
      });
    } catch {
      setState({ status: 'error', message: 'Could not reach the server. Check your connection.' });
    }
  };

  const documentUrl = (doc: PrivateDocument) =>
    `/api/documents?file=${encodeURIComponent(doc.key)}&t=${encodeURIComponent(unlocked?.token ?? '')}`;

  return (
    <div id="documents" className="no-print mt-20 scroll-mt-24">
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-5 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span
              className="grid h-11 w-11 flex-none place-items-center rounded-xl"
              style={{
                background: unlocked ? 'color-mix(in srgb, var(--success) 14%, transparent)' : 'var(--surface)',
                color: unlocked ? 'var(--success)' : 'var(--muted)',
                border: '1px solid var(--line)',
              }}
              aria-hidden
            >
              {unlocked ? <LockOpen className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--ink)' }}>
                Company &amp; legal documents
              </h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                Mantra Mountain registration papers, shareholding records and identity documents.
                Private — available on request with a passcode.
              </p>
            </div>
          </div>

          {!unlocked ? (
            <form onSubmit={submit} className="flex flex-none flex-wrap items-start gap-2">
              <label htmlFor="vault-passcode" className="sr-only">
                Document passcode
              </label>
              <input
                id="vault-passcode"
                ref={inputRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (state.status === 'error') setState({ status: 'locked' });
                }}
                placeholder="Passcode"
                className="field !w-36 !py-2.5 text-center tracking-[0.3em]"
              />
              <button
                type="submit"
                className="btn btn-primary !py-2.5"
                disabled={state.status === 'unlocking' || passcode.length === 0}
              >
                {state.status === 'unlocking' ? 'Checking…' : 'Unlock'}
              </button>
            </form>
          ) : (
            <span className="status-pill">
              <ShieldCheck className="h-3.5 w-3.5" /> Unlocked
            </span>
          )}
        </div>

        {state.status === 'error' ? (
          <p
            className="mx-6 mb-6 flex items-start gap-2 rounded-lg p-3 text-sm sm:mx-8"
            style={{
              background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
              color: 'var(--danger)',
            }}
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            {state.message}
          </p>
        ) : null}

        <AnimatePresence initial={false}>
          {unlocked ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28 }}
              style={{ borderTop: '1px solid var(--line)' }}
            >
              <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-3">
                {privateDocumentGroups.map(({ group, documents }) => (
                  <div key={group}>
                    <h4
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--muted)' }}
                    >
                      {group}
                    </h4>
                    <ul className="mt-4 space-y-2">
                      {documents.map((doc) => {
                        const ready = unlocked.available.includes(doc.key);
                        return (
                          <li key={doc.key}>
                            {ready ? (
                              <a
                                href={documentUrl(doc)}
                                target="_blank"
                                rel="noreferrer"
                                className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition"
                                style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                              >
                                {doc.kind === 'pdf' ? (
                                  <FileText className="h-4 w-4 flex-none" style={{ color: 'var(--muted)' }} />
                                ) : (
                                  <ImageIcon className="h-4 w-4 flex-none" style={{ color: 'var(--muted)' }} />
                                )}
                                <span className="min-w-0 flex-1 truncate">{doc.title}</span>
                                <ExternalLink
                                  className="h-3.5 w-3.5 flex-none opacity-0 transition group-hover:opacity-100"
                                  style={{ color: 'var(--accent)' }}
                                />
                              </a>
                            ) : (
                              <span
                                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm"
                                style={{ border: '1px dashed var(--line)', color: 'var(--muted)' }}
                                title="Not uploaded to the document store yet"
                              >
                                <Lock className="h-4 w-4 flex-none" />
                                <span className="min-w-0 flex-1 truncate">{doc.title}</span>
                                <span className="flex-none text-xs">Unavailable</span>
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="px-6 pb-6 text-xs sm:px-8" style={{ color: 'var(--muted)' }}>
                Links are signed and expire automatically. Re-enter the passcode to open a new session.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
