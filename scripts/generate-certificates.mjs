/**
 * Regenerate `src/content/certificates.generated.ts` from whatever is sitting
 * in `public/certificates/`.
 *
 * This is the step that makes the workflow "drop a PDF in the folder, commit,
 * push" — Vercel runs it as part of `npm run build`, so a new file is titled,
 * attributed and categorised without anyone editing a manifest by hand.
 *
 *   node scripts/generate-certificates.mjs [--check]
 *
 * `--check` regenerates in memory and exits non-zero if the committed file is
 * stale, without writing. Useful in CI when you want the drift reported rather
 * than silently fixed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveCertificate, FALLBACK_CATEGORY } from './certificate-meta.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(root, 'public/certificates');
const OUT = path.join(root, 'src/content/certificates.generated.ts');
const OVERRIDES = path.join(root, 'src/content/certificate-overrides.ts');

const checkOnly = process.argv.includes('--check');

const ALLOWED_EXT = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);

if (!fs.existsSync(DIR)) {
  console.error(`[certificates] missing ${path.relative(root, DIR)}`);
  process.exit(1);
}

const files = fs
  .readdirSync(DIR)
  .filter((f) => !f.startsWith('.') && ALLOWED_EXT.has(path.extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b));

if (!files.length) {
  console.error(`[certificates] no certificate files in ${path.relative(root, DIR)}`);
  process.exit(1);
}

/*
 * Read the override keys straight out of the TypeScript source rather than
 * importing it — this script runs before any build step, so there is nothing
 * around that can load a .ts module. Only the keys are needed here; the values
 * are applied at runtime by src/content/certificates.ts.
 */
const overrideSource = fs.readFileSync(OVERRIDES, 'utf8');
const overrideKeys = new Set(
  [...overrideSource.matchAll(/^\s*'([^']+)':\s*\{/gm)].map((m) => m[1])
);

/** Override titles only, so the duplicate check sees what actually renders. */
const overrideTitles = new Map(
  [...overrideSource.matchAll(/^\s*'([^']+)':\s*\{[^}]*?title:\s*'((?:[^'\\]|\\.)*)'/gm)].map(
    (m) => [m[1], m[2].replace(/\\'/g, "'")]
  )
);

const derived = files.map((file) => deriveCertificate(file));

const uncategorised = derived.filter((c) => c.category === FALLBACK_CATEGORY);
const staleOverrides = [...overrideKeys].filter((key) => !files.includes(key));

const body = derived
  .map(
    (c) =>
      `  {\n` +
      `    title: ${quote(c.title)},\n` +
      `    issuer: ${quote(c.issuer)},\n` +
      `    file: ${quote(c.file)},\n` +
      `    category: ${quote(c.category)},\n` +
      `  },`
  )
  .join('\n');

const contents = `/**
 * GENERATED FILE — do not edit.
 *
 * Written by \`scripts/generate-certificates.mjs\` from the contents of
 * \`public/certificates/\`, and regenerated on every build. Hand edits are lost.
 *
 * To add a certificate: put the file in \`public/certificates/\` and commit it.
 * To correct what was derived from its name: add an entry to
 * \`src/content/certificate-overrides.ts\`.
 */

import type { Certificate } from './certificates';

export const generatedCertificates: Certificate[] = [
${body}
];
`;

if (checkOnly) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (current !== contents) {
    console.error(
      '[certificates] src/content/certificates.generated.ts is stale — run: npm run sync:certificates'
    );
    process.exit(1);
  }
  console.log(`[certificates] generated manifest is up to date (${derived.length} files)`);
} else {
  fs.writeFileSync(OUT, contents);
  console.log(`[certificates] generated ${derived.length} entries from public/certificates/`);
}

for (const c of uncategorised) {
  console.warn(
    `[certificates] "${c.file}" did not match any category rule — filed under "${FALLBACK_CATEGORY}". ` +
      `Add a keyword to scripts/certificate-meta.mjs or an override for it.`
  );
}

/*
 * Byte-identical duplicates are dropped during sync, but the same course
 * downloaded twice differs in metadata and slips through as "…-2.pdf". Two
 * cards with the same name look like a mistake on the page, so say so here.
 */
const byTitle = new Map();
for (const c of derived) {
  // Compare the title that will actually render, so a deliberate "(II)" in the
  // overrides counts as having resolved the clash.
  const effective = overrideTitles.get(c.file) ?? c.title;
  // Drop a trailing collision counter so "Foo" and "Foo 2" group together.
  // A real "… Part 1" normalises to "… Part", which is unique, so it is safe.
  const key = effective.toLowerCase().replace(/\s+\d+$/, '');
  byTitle.set(key, [...(byTitle.get(key) ?? []), c.file]);
}
for (const [, group] of byTitle) {
  if (group.length > 1) {
    console.warn(
      `[certificates] same derived title for ${group.length} files: ${group.join(', ')} — ` +
        `delete the extra, or give them distinct titles in certificate-overrides.ts.`
    );
  }
}

for (const key of staleOverrides) {
  console.warn(`[certificates] override for "${key}" has no matching file — safe to delete.`);
}

/** Single-quoted TS string literal. */
function quote(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}
