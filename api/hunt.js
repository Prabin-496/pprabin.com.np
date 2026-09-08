/**
 * /hunt — daily job shortlist, match scoring and CV tailoring.
 *
 *   POST /api/hunt            { passcode }        -> unlock, returns today's queue
 *   POST /api/hunt?a=refresh  { passcode }        -> re-fetch sources, rebuild queue
 *   POST /api/hunt?a=tailor   { passcode, id }    -> tailored CV + cover letter
 *   POST /api/hunt?a=status   { passcode, id, status, note }
 *   GET  /api/hunt?a=cron&key=<CRON_SECRET>       -> scheduled rebuild
 *
 * This endpoint never submits an application. It finds, ranks and drafts; a
 * human opens the posting and decides. Automated submission would breach the
 * terms of every board involved, cannot be reviewed before it goes out under
 * Prabin's name, and is filtered as spam by the employers worth applying to.
 *
 * Everything is passcode-gated: a public page listing which jobs someone is
 * applying to, with drafted cover letters, is not something to leave open.
 */

import { QueryCommand, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { timingSafeEqual } from 'node:crypto';
import { ddb, TABLE, dayKey } from './_lib/ddb.js';
import { handler, readBody, methodNotAllowed, badRequest, notFound } from './_lib/http.js';
import { clientId, hit } from './_lib/rateLimit.js';
import { fetchAllJobs } from './_lib/huntSources.js';
import { buildQueue, profile } from './_lib/huntMatch.js';
import { cvConfigured, tailorApplication } from './_lib/huntCv.js';

const PASSCODE = process.env.HUNT_PASSCODE || '';

const PK = 'HUNT';
const key = (id) => ({ PK, SK: `JOB#${id}` });

function passcodeMatches(provided) {
  const a = Buffer.from(String(provided ?? ''), 'utf8');
  const b = Buffer.from(PASSCODE, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default handler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const action = req.query?.a || '';

  // The scheduler cannot hold a passcode, so it authenticates with CRON_SECRET.
  if (req.method === 'GET' && action === 'cron') return runCron(req, res);
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  if (!PASSCODE) {
    res.status(503).json({
      error: 'Job hunt is not configured on this deployment. Set HUNT_PASSCODE.',
      code: 'HUNT_NOT_CONFIGURED',
    });
    return;
  }

  const gate = await hit('hunt-passcode', clientId(req), { limit: 12, windowSeconds: 900 });
  if (!gate.allowed) {
    res.setHeader('Retry-After', String(gate.retryAfter));
    res.status(429).json({ error: 'Too many attempts. Try again shortly.', code: 'RATE_LIMITED' });
    return;
  }

  const body = readBody(req);
  if (!passcodeMatches(body.passcode)) {
    res.status(401).json({ error: 'Incorrect passcode.', code: 'BAD_PASSCODE' });
    return;
  }

  if (action === 'refresh') return refresh(res);
  if (action === 'tailor') return tailor(body, res);
  if (action === 'status') return setStatus(body, res);
  return list(res);
});

/** Stored jobs, newest queue first. */
async function list(res) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': PK },
      Limit: 400,
    })
  );

  const jobs = (out.Items || [])
    .map(({ PK: _pk, SK: _sk, ...rest }) => rest)
    .sort((a, b) => (b.queuedFor || '').localeCompare(a.queuedFor || '') || b.score - a.score);

  res.status(200).json({
    ok: true,
    today: dayKey(),
    dailyTarget: profile.dailyTarget,
    targets: profile.targets.map((t) => ({ id: t.id, label: t.label, priority: t.priority })),
    cvAvailable: cvConfigured(),
    jobs,
  });
}

/**
 * Re-poll every board and store today's shortlist.
 *
 * A job already stored keeps its status and any tailored draft — re-running the
 * refresh must never wipe the record of what has been applied to.
 */
async function refresh(res) {
  const { jobs, errors, sources } = await fetchAllJobs();
  const { queue, consideredCount } = buildQueue(jobs);

  const today = dayKey();
  let added = 0;
  let existing = 0;

  for (const job of queue) {
    const current = await ddb.send(new GetCommand({ TableName: TABLE, Key: key(job.id) }));
    if (current.Item) {
      existing += 1;
      continue;
    }
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          ...key(job.id),
          id: job.id,
          company: job.company,
          title: job.title,
          location: job.location,
          url: job.url,
          source: job.source,
          postedAt: job.postedAt,
          score: job.score,
          target: job.target,
          reasons: job.reasons,
          flags: job.flags,
          // Kept for CV tailoring; trimmed so an item stays well under DynamoDB's
          // 400 KB limit even for a verbose posting.
          description: (job.description || '').slice(0, 12000),
          status: 'queued',
          queuedFor: today,
          createdAt: new Date().toISOString(),
        },
      })
    );
    added += 1;
  }

  res.status(200).json({
    ok: true,
    today,
    scanned: jobs.length,
    viable: consideredCount,
    added,
    alreadyTracked: existing,
    sources: sources.filter((s) => s.count > 0),
    errors,
  });
}

async function tailor(body, res) {
  if (!body.id) throw badRequest('id is required');
  const current = await ddb.send(new GetCommand({ TableName: TABLE, Key: key(body.id) }));
  if (!current.Item) throw notFound('No such job in the queue');

  // Reuse a previous draft unless explicitly asked to redo it — every call
  // costs a Gemini request against the free-tier quota.
  if (current.Item.application && !body.force) {
    res.status(200).json({ ok: true, cached: true, application: current.Item.application });
    return;
  }

  const application = await tailorApplication(current.Item);

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: key(body.id),
      UpdateExpression: 'SET application = :a',
      ExpressionAttributeValues: { ':a': application },
    })
  );

  res.status(200).json({ ok: true, cached: false, application });
}

const STATUSES = ['queued', 'applied', 'skipped', 'interview', 'rejected', 'offer'];

async function setStatus(body, res) {
  if (!body.id) throw badRequest('id is required');
  if (!STATUSES.includes(body.status)) {
    throw badRequest(`status must be one of: ${STATUSES.join(', ')}`);
  }

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: key(body.id),
      UpdateExpression: 'SET #s = :s, note = :n, updatedAt = :u',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':s': body.status,
        ':n': String(body.note || '').slice(0, 2000),
        ':u': new Date().toISOString(),
      },
    })
  );

  res.status(200).json({ ok: true, id: body.id, status: body.status });
}

/** Scheduled daily rebuild. Vercel Cron sends CRON_SECRET as a bearer token. */
async function runCron(req, res) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.query?.key || String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!secret || provided !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  return refresh(res);
}
