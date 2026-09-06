/**
 * Small DynamoDB-backed attempt limiter.
 *
 * A four-digit passcode is 10,000 guesses — trivially brute-forced against an
 * unthrottled endpoint. Vercel Functions are stateless, so the counter lives in
 * the table that is already there rather than in module memory (which resets
 * per cold start and is per-instance anyway).
 *
 * Expiry is enforced in code, not only by DynamoDB's TTL sweeper: TTL deletion
 * is best-effort and can lag by days, which would keep a caller locked out long
 * after the window passed.
 */

import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLE } from './ddb.js';

/**
 * Count one attempt and report whether the caller is over the limit.
 *
 * Fails open: if the table is unreachable the request is allowed through, so a
 * DynamoDB outage degrades security rather than locking everyone out of a
 * feature. The passcode check itself still has to pass.
 *
 * @returns {Promise<{ allowed: boolean, remaining: number, retryAfter: number }>}
 */
export async function hit(bucket, identifier, { limit = 10, windowSeconds = 900 } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const expiresAt = windowStart + windowSeconds;

  try {
    const out = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `RATE#${bucket}`, SK: `${identifier}#${windowStart}` },
        UpdateExpression: 'ADD #n :one SET #ttl = :ttl',
        ExpressionAttributeNames: { '#n': 'count', '#ttl': 'ttl' },
        ExpressionAttributeValues: { ':one': 1, ':ttl': expiresAt },
        ReturnValues: 'UPDATED_NEW',
      })
    );

    const count = Number(out.Attributes?.count ?? 1);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter: Math.max(1, expiresAt - now),
    };
  } catch (err) {
    console.error('[rate-limit] counter unavailable, allowing request:', err.message);
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }
}

/** Best-effort caller identity for throttling. */
export function clientId(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}
