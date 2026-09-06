/**
 * Copy the public certificate files into `public/certificates/` under stable,
 * URL-safe names, skipping byte-identical duplicates (the "- Copy" files).
 *
 * The source folder is the messy one the certificates are downloaded into;
 * `public/certificates/` is what actually ships. Re-run after adding new
 * certificates, then add the matching entry to `src/content/certificates.ts`.
 *
 * Files already in `public/certificates/` are left alone — you can also just
 * drop a certificate straight in there and commit it.
 *
 *   node scripts/sync-certificates.mjs
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'portfolio/certificates/linkedin learning and all');
const OUT = path.join(root, 'public/certificates');

/**
 * A few source filenames carry download noise (badge ids, typos) that would
 * end up in a public URL. Map those to something a recruiter can read.
 */
const RENAME = {
  'aws-academy-graduate-aws-academy-cloud-foundations-badge20240102-29-tdqmo.pdf':
    'aws-academy-cloud-foundations-certificate.pdf',
  'aws-academy-graduate-aws-academy-cloud-foundations.png':
    'aws-academy-cloud-foundations-badge.png',
  'microsoftaiskillsfestgwrattemptbadge-full.png':
    'microsoft-ai-skills-fest-badge.png',
  'coursera-computer-haardware-and-software.pdf':
    'coursera-computer-hardware-and-software.pdf',
  'nano-tips-for-leveraging-technical-prompts-using-chatgpt-with-lachezar-arabadzhiev.pdf':
    'nano-tips-technical-prompts-with-chatgpt.pdf',
};

/** `CertificateOfCompletion_React.js Essential Training.pdf` -> `react-js-essential-training.pdf` */
function slugify(filename) {
  const ext = path.extname(filename).toLowerCase();
  return (
    path
      .basename(filename, path.extname(filename))
      .replace(/^CertificateOfCompletion_/i, '')
      .replace(/\s*-?\s*Copy$/i, '')
      .replace(/\s*\(\d+\)$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + ext
  );
}

if (!fs.existsSync(SRC)) {
  console.error(`[certificates] source folder not found: ${SRC}`);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

const seen = new Map(); // sha256 -> slug already written
const written = [];
let skipped = 0;

for (const name of fs.readdirSync(SRC).sort()) {
  if (name.startsWith('.')) continue;
  const from = path.join(SRC, name);
  if (!fs.statSync(from).isFile()) continue;

  const bytes = fs.readFileSync(from);
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (seen.has(hash)) {
    skipped += 1;
    continue;
  }

  // Two different files can slugify the same way (e.g. a "(1)" re-issue);
  // keep both by suffixing rather than silently overwriting.
  let slug = slugify(name);
  slug = RENAME[slug] ?? slug;
  let n = 2;
  while (written.includes(slug)) {
    const ext = path.extname(slug);
    slug = `${path.basename(slug, ext)}-${n++}${ext}`;
  }

  seen.set(hash, slug);
  fs.writeFileSync(path.join(OUT, slug), bytes);
  written.push(slug);
}

/*
 * Deliberately additive: `public/certificates/` is the source of truth for what
 * ships, and a certificate can legitimately be dropped straight into it and
 * committed without ever passing through the download folder. An earlier
 * version mirrored the source folder and deleted anything else — which would
 * silently remove exactly those files.
 */
console.log(`[certificates] ${written.length} copied, ${skipped} duplicates skipped`);
for (const slug of written) console.log(`  ${slug}`);

const extra = fs.readdirSync(OUT).filter((n) => !n.startsWith('.') && !written.includes(n));
if (extra.length) {
  console.log(`[certificates] ${extra.length} file(s) already in public/certificates/, left untouched`);
}

// Refresh the derived manifest so the new files show up without a second command.
const { status } = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/generate-certificates.mjs')],
  { stdio: 'inherit' }
);
process.exit(status ?? 0);
