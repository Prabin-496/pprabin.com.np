/**
 * Score a job against the profile in `huntProfile.json`.
 *
 * The score exists to put the ten worth a human's attention at the top of a
 * list of several thousand, and every job carries the reasons it scored what it
 * did. A ranking you cannot interrogate is not useful for deciding where to
 * spend an application.
 *
 * Deliberately conservative on two axes: seniority (a mid-level engineer
 * applying to Principal roles wastes both sides' time) and sponsorship (a role
 * that says it cannot sponsor is not a near miss, it is a no).
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const profile = require('./huntProfile.json');

export { profile };

const has = (text, needles) => needles.some((n) => text.includes(n));

/** Pull a monthly JPY figure out of free text, if the posting states one. */
function japaneseMonthlySalary(text) {
  // "¥6,000,000" / "600万円" / "6,000,000 JPY" — annual figures are the norm.
  const man = text.match(/(\d{3,4})\s*万円/);
  if (man) return (Number(man[1]) * 10000) / 12;

  const yen = text.match(/(?:¥|JPY\s*)([\d,]{7,12})/i);
  if (yen) {
    const annual = Number(yen[1].replace(/,/g, ''));
    if (annual > 1_000_000) return annual / 12;
  }
  return null;
}

/**
 * @returns {{score:number, target:string|null, reasons:string[], flags:string[]}}
 */
export function scoreJob(job) {
  const title = (job.title || '').toLowerCase();
  const location = (job.location || '').toLowerCase();
  const body = (job.description || '').toLowerCase();
  const haystack = `${title} ${location} ${body}`;

  const reasons = [];
  const flags = [];
  let score = 0;

  // --- hard exclusions -------------------------------------------------
  // Checked on the title only: a job body often mentions "manager" when
  // describing who you report to.
  const excluded = profile.roleKeywords.exclude.find((k) => title.includes(k));
  if (excluded) {
    return { score: 0, target: null, reasons: [`Excluded: title contains "${excluded.trim()}"`], flags: ['excluded'] };
  }

  // --- geography -------------------------------------------------------
  const matchedTargets = profile.targets
    .filter((t) => new RegExp(t.locationPattern, 'i').test(location))
    .sort((a, b) => a.priority - b.priority);

  const target = matchedTargets[0] ?? null;
  if (!target) {
    return { score: 0, target: null, reasons: ['Location is outside every target region'], flags: ['out-of-region'] };
  }

  // Priority 1 (Australia) earns more than priority 4 (global remote).
  const geoPoints = [0, 30, 26, 18, 14][target.priority] ?? 10;
  score += geoPoints;
  reasons.push(`${target.label} (+${geoPoints})`);

  // --- role fit --------------------------------------------------------
  const strong = profile.roleKeywords.strong.filter((k) => title.includes(k));
  const good = profile.roleKeywords.good.filter((k) => title.includes(k));
  if (strong.length) {
    score += 30;
    reasons.push(`Core role match: ${strong.join(', ')} (+30)`);
  } else if (good.length) {
    score += 16;
    reasons.push(`Adjacent role: ${good.join(', ')} (+16)`);
  } else {
    flags.push('title-mismatch');
    reasons.push('Title is not an obvious infrastructure role (+0)');
  }

  // --- skill overlap ---------------------------------------------------
  const matchedSkills = profile.coreSkills.filter((s) => haystack.includes(s.toLowerCase()));
  const skillPoints = Math.min(20, matchedSkills.length * 3);
  if (skillPoints) {
    score += skillPoints;
    reasons.push(`${matchedSkills.length} skill overlaps: ${matchedSkills.slice(0, 8).join(', ')} (+${skillPoints})`);
  }

  // --- seniority -------------------------------------------------------
  if (/\b(senior|sr\.?|lead)\b/.test(title)) {
    score -= 8;
    flags.push('senior');
    reasons.push('Senior-titled — a stretch from current level (-8)');
  }
  if (profile.seniority.some((s) => title.includes(s))) {
    score += 8;
    reasons.push('Explicitly open to earlier-career candidates (+8)');
  }

  // --- visa sponsorship ------------------------------------------------
  if (target.requiresSponsorship) {
    const negative = profile.sponsorshipSignals.negative.find((s) => body.includes(s));
    if (negative) {
      // Not a penalty — without sponsorship the application cannot succeed.
      return {
        score: 0,
        target: target.id,
        reasons: [`Rules out sponsorship: "${negative}"`],
        flags: ['no-sponsorship'],
      };
    }
    if (job.visaSponsorship === true || has(body, profile.sponsorshipSignals.positive)) {
      score += 22;
      flags.push('sponsorship-likely');
      reasons.push('Mentions sponsorship or relocation support (+22)');
    } else {
      flags.push('sponsorship-unstated');
      reasons.push('Sponsorship not mentioned — verify before applying (+0)');
    }
  }

  // --- salary floor (Japan only) ---------------------------------------
  if (target.minMonthlyJpy) {
    const monthly = japaneseMonthlySalary(job.description || '');
    if (monthly === null) {
      flags.push('salary-unstated');
    } else if (monthly < target.minMonthlyJpy) {
      return {
        score: 0,
        target: target.id,
        reasons: [`Below the ¥${target.minMonthlyJpy.toLocaleString()}/month floor (≈¥${Math.round(monthly).toLocaleString()})`],
        flags: ['below-salary-floor'],
      };
    } else {
      score += 10;
      reasons.push(`Stated pay ≈¥${Math.round(monthly).toLocaleString()}/month, above floor (+10)`);
    }
  }

  // --- freshness -------------------------------------------------------
  if (job.postedAt) {
    const days = (Date.now() - new Date(job.postedAt).getTime()) / 86_400_000;
    if (days <= 7) {
      score += 10;
      reasons.push('Posted within a week (+10)');
    } else if (days <= 30) {
      score += 4;
      reasons.push('Posted within a month (+4)');
    } else if (days > 90) {
      score -= 6;
      flags.push('stale');
      reasons.push('Posted over 90 days ago (-6)');
    }
  }

  return { score: Math.max(0, Math.round(score)), target: target.id, reasons, flags };
}

/**
 * Rank every job and return the day's shortlist.
 *
 * Not a straight top-N by score. Australia is the stated first priority, but
 * the US simply lists more jobs, so a global ranking hands almost every slot to
 * the US and buries the roles that matter most. Slots are therefore allocated
 * per target region first, and only unfilled ones spill over.
 *
 * Also capped per company: ten applications to one employer is a worse day than
 * ten across ten employers.
 */
export function buildQueue(jobs, { limit = profile.dailyTarget, perCompany = 2 } = {}) {
  const scored = jobs
    .map((job) => ({ ...job, ...scoreJob(job) }))
    .filter((job) => job.score > 0)
    .sort((a, b) => b.score - a.score);

  // Shares of the daily target, by stated priority. Australia gets the most.
  const SHARES = { australia: 0.4, japan: 0.3, usa: 0.2, 'remote-global': 0.1 };

  const counts = new Map();
  const queue = [];
  const taken = new Set();

  const tryTake = (job) => {
    if (taken.has(job.id)) return false;
    const seen = counts.get(job.company) ?? 0;
    if (seen >= perCompany) return false;
    counts.set(job.company, seen + 1);
    taken.add(job.id);
    queue.push(job);
    return true;
  };

  // Pass 1: fill each region's quota from its own best candidates.
  for (const target of [...profile.targets].sort((a, b) => a.priority - b.priority)) {
    const quota = Math.round(limit * (SHARES[target.id] ?? 0));
    let filled = 0;
    for (const job of scored) {
      if (filled >= quota || queue.length >= limit) break;
      if (job.target !== target.id) continue;
      if (tryTake(job)) filled += 1;
    }
  }

  // Pass 2: a region short on supply gives its slots to the next best anywhere.
  for (const job of scored) {
    if (queue.length >= limit) break;
    tryTake(job);
  }

  // Present the day in priority order rather than raw score.
  const rank = Object.fromEntries(profile.targets.map((t) => [t.id, t.priority]));
  queue.sort((a, b) => (rank[a.target] ?? 9) - (rank[b.target] ?? 9) || b.score - a.score);

  return { queue, consideredCount: scored.length };
}
