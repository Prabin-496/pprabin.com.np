/**
 * Build the machine-readable half of the page from `src/content/identity.json`.
 *
 * Two problems this solves, both invisible in a browser:
 *
 * 1. The site is a client-rendered SPA, so the HTML that leaves the server has
 *    an empty `<div id="root">`. Google executes JavaScript and sees the real
 *    page, but GPTBot, ClaudeBot, PerplexityBot, CCBot and most other AI
 *    crawlers do not — to them the site has no content at all. `fallbackHtml()`
 *    puts a real biography in the served markup. React replaces it on mount, so
 *    it is the same content either way, not cloaking.
 *
 * 2. "Prabin Parajuli" is a shared name. Search engines and language models
 *    disambiguate people through structured data, so `jsonLd()` emits a Person
 *    with a stable `@id`, `sameAs` profile links, `disambiguatingDescription`
 *    and an FAQ answering the literal query "who is Prabin Parajuli".
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadIdentity() {
  return JSON.parse(fs.readFileSync(path.join(root, 'src/content/identity.json'), 'utf8'));
}

const escape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * All structured data as one @graph.
 *
 * A single graph with cross-references (`mainEntity`, `about`, `author`) states
 * that the site, the page and the person are one connected entity. Separate
 * unlinked blocks leave a consumer guessing whether they describe the same
 * subject.
 */
export function jsonLd(identity) {
  const site = identity.siteUrl;
  const personId = `${site}/#prabin-parajuli`;

  const person = {
    '@type': 'Person',
    '@id': personId,
    name: identity.name,
    givenName: identity.givenName,
    familyName: identity.familyName,
    alternateName: identity.alternateNames,
    url: `${site}/`,
    image: `${site}/og-image.png`,
    email: `mailto:${identity.email}`,
    jobTitle: identity.jobTitle,
    description: identity.shortAnswer,
    disambiguatingDescription: identity.disambiguatingDescription,
    nationality: { '@type': 'Country', name: identity.nationality },
    homeLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: identity.addressLocality,
        addressRegion: identity.addressRegion,
        addressCountry: identity.addressCountry,
      },
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: identity.addressLocality,
      addressRegion: identity.addressRegion,
      addressCountry: identity.addressCountry,
    },
    worksFor: {
      '@type': 'Organization',
      name: identity.employer.name,
      alternateName: identity.employer.alternateName,
    },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: identity.school.name,
      url: identity.school.url,
    },
    hasOccupation: {
      '@type': 'Occupation',
      name: identity.jobTitle,
      occupationLocation: { '@type': 'City', name: 'Tokyo' },
      skills: identity.knowsAbout.join(', '),
    },
    knowsAbout: identity.knowsAbout,
    knowsLanguage: identity.languages.map((name) => ({ '@type': 'Language', name })),
    seeks: {
      '@type': 'Demand',
      name: 'Cloud Infrastructure / AWS engineering roles in Japan',
    },
    sameAs: identity.sameAs,
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${site}/#website`,
    url: `${site}/`,
    name: identity.name,
    description: identity.shortAnswer,
    inLanguage: 'en',
    publisher: { '@id': personId },
    about: { '@id': personId },
  };

  // ProfilePage is the type Google documents for "this page is about a person".
  const profilePage = {
    '@type': 'ProfilePage',
    '@id': `${site}/#webpage`,
    url: `${site}/`,
    name: `${identity.name} — ${identity.jobTitle}`,
    isPartOf: { '@id': `${site}/#website` },
    about: { '@id': personId },
    mainEntity: { '@id': personId },
    inLanguage: 'en',
  };

  const faq = {
    '@type': 'FAQPage',
    '@id': `${site}/#faq`,
    isPartOf: { '@id': `${site}/#webpage` },
    about: { '@id': personId },
    mainEntity: identity.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return { '@context': 'https://schema.org', '@graph': [person, website, profilePage, faq] };
}

/**
 * Crawlable content for the served HTML.
 *
 * Placed inside `#root`, which React clears on mount — so a JavaScript client
 * never sees it for more than a frame, while a crawler that cannot run
 * JavaScript gets the whole biography. It doubles as a readable page on a slow
 * connection, which is why it is styled rather than hidden.
 */
export function fallbackHtml(identity) {
  const faq = identity.faq
    .map(
      (item) =>
        `<section><h3>${escape(item.q)}</h3><p>${escape(item.a)}</p></section>`
    )
    .join('');

  const links = identity.sameAs
    .map((url) => `<li><a href="${escape(url)}" rel="me">${escape(url)}</a></li>`)
    .join('');

  return `<div id="seo-fallback">
  <header>
    <h1>${escape(identity.name)}</h1>
    <p><strong>${escape(identity.jobTitle)}</strong> &middot; ${escape(identity.locationLabel)}</p>
  </header>
  <p>${escape(identity.shortAnswer)}</p>
  <h2>About ${escape(identity.name)}</h2>
  <p>${escape(identity.disambiguatingDescription)}</p>
  <h2>Frequently asked questions</h2>
  ${faq}
  <h2>Skills</h2>
  <p>${escape(identity.knowsAbout.join(', '))}.</p>
  <h2>Languages</h2>
  <p>${escape(identity.languages.join(', '))}.</p>
  <h2>Contact and profiles</h2>
  <ul>
    <li><a href="mailto:${escape(identity.email)}">${escape(identity.email)}</a></li>
    ${links}
  </ul>
</div>`;
}

/** Keeps the fallback legible for the moment it is on screen before hydration. */
export const fallbackStyles = `
  #seo-fallback {
    max-width: 46rem;
    margin: 0 auto;
    padding: 4rem 1.25rem;
    font-family: 'Outfit', system-ui, -apple-system, 'Segoe UI', sans-serif;
    line-height: 1.65;
  }
  #seo-fallback h1 { font-size: 2rem; margin: 0 0 .25rem; }
  #seo-fallback h2 { font-size: 1.15rem; margin: 2rem 0 .5rem; }
  #seo-fallback h3 { font-size: 1rem; margin: 1.25rem 0 .25rem; }
  #seo-fallback a { color: inherit; }
`;
