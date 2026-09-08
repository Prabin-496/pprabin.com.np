/**
 * Job sources for /hunt.
 *
 * Every source here is a public JSON endpoint that the provider publishes for
 * programmatic use — the same feeds that power the companies' own careers
 * pages. Nothing scrapes rendered HTML and nothing needs an API key.
 *
 * LinkedIn and Indeed are deliberately absent. Both forbid automated access in
 * their terms, both block it technically, and an account caught scraping is the
 * account you need intact to job hunt. The Greenhouse/Lever/Ashby/Workday
 * boards below are where these companies actually post first anyway — LinkedIn
 * listings are usually syndicated copies of them.
 */

const UA = 'pprabin.com.np job-hunt (personal use; contact prabin.parajuli.jp@gmail.com)';
const TIMEOUT_MS = 15000;

async function getJson(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', 'User-Agent': UA, ...(init.headers || {}) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Strip HTML from a job description without pulling in a parser. */
function plain(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Companies whose boards are worth polling.
 *
 * Chosen for two things at once: they are large multinationals of the kind
 * worth applying to, and they actually hire in Australia or Japan. Adding one
 * is a single line — the slug is whatever appears in the company's own
 * careers URL.
 */
export const BOARDS = {
  greenhouse: [
    'databricks', 'stripe', 'datadog', 'mongodb', 'elastic', 'cloudflare',
    'gitlab', 'samsara', 'coinbase', 'airbnb', 'twilio', 'robinhood', 'dropbox',
  ],
  lever: ['palantir'],
  ashby: ['openai', 'ramp', 'notion', 'linear'],
  workday: [{ tenant: 'nvidia', site: 'NVIDIAExternalCareerSite', host: 'wd5', company: 'NVIDIA' }],
};

const titleCase = (slug) => slug.charAt(0).toUpperCase() + slug.slice(1);

/** Greenhouse publishes a board's whole job list, descriptions included. */
async function greenhouse(slug) {
  const data = await getJson(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`
  );
  return (data.jobs || []).map((j) => ({
    id: `gh:${slug}:${j.id}`,
    source: 'greenhouse',
    company: titleCase(slug),
    title: j.title,
    location: j.location?.name || '',
    url: j.absolute_url,
    description: plain(j.content).slice(0, 6000),
    postedAt: j.updated_at || j.created_at || null,
  }));
}

async function lever(slug) {
  const data = await getJson(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  return (Array.isArray(data) ? data : []).map((j) => ({
    id: `lv:${slug}:${j.id}`,
    source: 'lever',
    company: titleCase(slug),
    title: j.text,
    location: j.categories?.location || '',
    url: j.hostedUrl,
    description: plain(j.descriptionPlain || j.description).slice(0, 6000),
    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
  }));
}

async function ashby(slug) {
  const data = await getJson(
    `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`
  );
  return (data.jobs || []).map((j) => ({
    id: `ab:${slug}:${j.id}`,
    source: 'ashby',
    company: data.name || titleCase(slug),
    title: j.title,
    location: j.location || '',
    url: j.jobUrl,
    description: plain(j.descriptionPlain || j.descriptionHtml).slice(0, 6000),
    postedAt: j.publishedAt || null,
    compensation: j.compensation?.compensationTierSummary || null,
  }));
}

/**
 * Workday's CXS endpoint is a POST and pages 20 at a time. NVIDIA, and a large
 * share of enterprise employers, sit behind it.
 */
async function workday({ tenant, site, host, company }, { pages = 5 } = {}) {
  const jobs = [];
  for (let page = 0; page < pages; page++) {
    const data = await getJson(
      `https://${tenant}.${host}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: page * 20, searchText: '' }),
      }
    );
    const batch = data.jobPostings || [];
    if (!batch.length) break;
    for (const j of batch) {
      jobs.push({
        id: `wd:${tenant}:${j.bulletFields?.[0] || j.externalPath}`,
        source: 'workday',
        company,
        title: j.title,
        location: j.locationsText || '',
        url: `https://${tenant}.${host}.myworkdayjobs.com/${site}${j.externalPath}`,
        // The list endpoint omits the description; the title and location carry
        // enough signal to rank, and the full text is one click away.
        description: '',
        postedAt: null,
      });
    }
  }
  return jobs;
}

/** Remote-only aggregators, useful for the "global remote" target. */
async function remotive() {
  const data = await getJson('https://remotive.com/api/remote-jobs?category=devops&limit=100');
  return (data.jobs || []).map((j) => ({
    id: `rm:${j.id}`,
    source: 'remotive',
    company: j.company_name,
    title: j.title,
    location: j.candidate_required_location || 'Remote',
    url: j.url,
    description: plain(j.description).slice(0, 6000),
    postedAt: j.publication_date || null,
  }));
}

async function arbeitnow() {
  const data = await getJson('https://www.arbeitnow.com/api/job-board-api');
  return (data.data || []).map((j) => ({
    id: `an:${j.slug}`,
    source: 'arbeitnow',
    company: j.company_name,
    title: j.title,
    location: j.location || (j.remote ? 'Remote' : ''),
    url: j.url,
    description: plain(j.description).slice(0, 6000),
    postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
    // Arbeitnow is one of the few feeds that flags sponsorship explicitly.
    visaSponsorship: Boolean(j.visa_sponsorship),
  }));
}

/**
 * Fetch every source concurrently.
 *
 * One board being down, rate-limited or renamed must not empty the day's
 * queue, so failures are collected and reported rather than thrown.
 */
export async function fetchAllJobs() {
  const tasks = [
    ...BOARDS.greenhouse.map((s) => [`greenhouse:${s}`, () => greenhouse(s)]),
    ...BOARDS.lever.map((s) => [`lever:${s}`, () => lever(s)]),
    ...BOARDS.ashby.map((s) => [`ashby:${s}`, () => ashby(s)]),
    ...BOARDS.workday.map((w) => [`workday:${w.tenant}`, () => workday(w)]),
    ['remotive', remotive],
    ['arbeitnow', arbeitnow],
  ];

  const settled = await Promise.all(
    tasks.map(async ([name, run]) => {
      try {
        return { name, jobs: await run() };
      } catch (err) {
        return { name, jobs: [], error: err.message };
      }
    })
  );

  const jobs = [];
  const errors = [];
  const seen = new Set();

  for (const result of settled) {
    if (result.error) errors.push(`${result.name}: ${result.error}`);
    for (const job of result.jobs) {
      // The same role can appear on an aggregator and the company's own board,
      // and a single role is often listed once per office. Location is left out
      // of the key so those collapse into one entry.
      const key = `${job.company}|${job.title}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      jobs.push(job);
    }
  }

  return { jobs, errors, sources: settled.map((s) => ({ name: s.name, count: s.jobs.length })) };
}
