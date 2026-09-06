import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, ExternalLink, FileText, Image as ImageIcon, Search } from 'lucide-react';
import SectionHeader from './SectionHeader';
import PrivateVault from './PrivateVault';
import Modal from '../ui/Modal';
import {
  certificates,
  certificateCategories,
  type Certificate,
  type CertificateCategory,
} from '../content/certificates';

const ALL = 'All' as const;
type Filter = typeof ALL | CertificateCategory;

/** Categories that actually have entries, in the curated display order. */
const populated = certificateCategories.filter((c) => certificates.some((x) => x.category === c));

function href(certificate: Certificate) {
  // Filenames are already slugified by scripts/sync-certificates.mjs, but
  // encode anyway so a future entry with a space cannot produce a broken link.
  return `/certificates/${encodeURIComponent(certificate.file)}`;
}

function isImage(certificate: Certificate) {
  return /\.(png|jpe?g|webp)$/i.test(certificate.file);
}

export default function Certificates() {
  const [filter, setFilter] = useState<Filter>(ALL);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<Certificate | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return certificates.filter((c) => {
      if (filter !== ALL && c.category !== filter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.issuer.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  const grouped = useMemo(
    () =>
      populated
        .map((category) => ({ category, items: matches.filter((c) => c.category === category) }))
        .filter((group) => group.items.length > 0),
    [matches]
  );

  return (
    <section id="certificates" className="section">
      <div className="shell">
        <SectionHeader
          eyebrow="Certificates"
          title="Verified training & credentials"
          lead={`${certificates.length} completed courses and credentials, grouped by subject. Every entry opens the original certificate — nothing here is a claim without the document behind it.`}
        />

        {/* ------------------------------------------------------ controls --- */}
        <div className="no-print mt-10 space-y-5">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--muted)' }}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search certificates…"
              aria-label="Search certificates"
              className="field !pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <FilterChip active={filter === ALL} onClick={() => setFilter(ALL)}>
              All <span className="chip-count">{certificates.length}</span>
            </FilterChip>
            {populated.map((category) => (
              <FilterChip
                key={category}
                active={filter === category}
                onClick={() => setFilter(category)}
              >
                {category}{' '}
                <span className="chip-count">
                  {certificates.filter((c) => c.category === category).length}
                </span>
              </FilterChip>
            ))}
          </div>
        </div>

        {/* -------------------------------------------------------- results --- */}
        {grouped.length === 0 ? (
          <p className="mt-12 text-sm" style={{ color: 'var(--muted)' }}>
            No certificates match “{query}”.{' '}
            <button type="button" className="link-underline" onClick={() => { setQuery(''); setFilter(ALL); }}>
              Clear filters
            </button>
          </p>
        ) : (
          <div className="mt-12 space-y-12">
            {grouped.map(({ category, items }) => (
              <div key={category}>
                <div className="flex items-baseline gap-3">
                  <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--ink)' }}>
                    {category}
                  </h3>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    {items.length}
                  </span>
                </div>

                <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((certificate) => (
                    <motion.li
                      key={certificate.file}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.35 }}
                    >
                      <button
                        type="button"
                        onClick={() => setPreview(certificate)}
                        className="card card-hover flex w-full items-start gap-3.5 p-4 text-left"
                      >
                        <span
                          className="grid h-9 w-9 flex-none place-items-center rounded-lg"
                          style={{
                            background: certificate.featured ? 'var(--accent-soft)' : 'var(--surface-2)',
                            color: certificate.featured ? 'var(--accent)' : 'var(--muted)',
                          }}
                          aria-hidden
                        >
                          {isImage(certificate) ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span
                            className="block text-sm font-semibold leading-snug"
                            style={{ color: 'var(--ink)' }}
                          >
                            {certificate.title}
                          </span>
                          <span className="mt-1 block text-xs" style={{ color: 'var(--muted)' }}>
                            {certificate.issuer}
                          </span>
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <PrivateVault />
      </div>

      <AnimatePresence>
        {preview ? (
          <Modal
            onClose={() => setPreview(null)}
            label={`${preview.title} certificate`}
            header={
              <>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  <Award className="h-3.5 w-3.5" /> {preview.category}
                </p>
                <h3 className="font-display mt-1.5 truncate text-xl font-semibold">{preview.title}</h3>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>{preview.issuer}</p>
              </>
            }
          >
            <div className="p-4 sm:p-6">
              <div
                className="overflow-hidden rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
              >
                {isImage(preview) ? (
                  <img
                    src={href(preview)}
                    alt={`${preview.title} certificate`}
                    className="mx-auto block max-h-[58vh] w-auto object-contain"
                  />
                ) : (
                  // Browsers render PDFs in an iframe via their built-in viewer.
                  // Where that is unavailable the buttons below are the fallback,
                  // which is why they are always shown rather than only on error.
                  <iframe
                    src={`${href(preview)}#view=FitH`}
                    title={`${preview.title} certificate`}
                    className="h-[58vh] w-full"
                    style={{ border: 0 }}
                  />
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a href={href(preview)} target="_blank" rel="noreferrer" className="btn btn-primary">
                  <ExternalLink className="h-4 w-4" /> Open in new tab
                </a>
                <a href={href(preview)} download className="btn btn-secondary">
                  <Download className="h-4 w-4" /> Download
                </a>
              </div>
            </div>
          </Modal>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={active ? 'chip chip-active' : 'chip'} aria-pressed={active}>
      {children}
    </button>
  );
}
