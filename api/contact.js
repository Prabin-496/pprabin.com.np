/**
 * POST /api/contact — receive a message from the portfolio contact form.
 *
 * Messages are persisted to DynamoDB so nothing is lost, and are additionally
 * emailed when RESEND_API_KEY is configured. Without that key the endpoint
 * still succeeds and stores the message; delivery is simply deferred to
 * whoever reads the table.
 *
 * GET /api/contact?key=<STUDY_PASSCODE> lists stored messages.
 */

import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';
import { ddb, TABLE } from './_lib/ddb.js';
import { handler, readBody, methodNotAllowed, badRequest } from './_lib/http.js';

const MAX = { name: 120, email: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default handler(async (req, res) => {
  if (req.method === 'GET') return listMessages(req, res);
  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);

  const body = readBody(req);
  const name = String(body.name || '').trim().slice(0, MAX.name);
  const email = String(body.email || '').trim().slice(0, MAX.email);
  const message = String(body.message || '').trim().slice(0, MAX.message);

  const errors = [];
  if (!name) errors.push('name is required');
  if (!email) errors.push('email is required');
  else if (!EMAIL_RE.test(email)) errors.push('email is not valid');
  if (!message) errors.push('message is required');
  if (message.length < 10) errors.push('message is too short');
  // Honeypot: real users never fill a hidden field, bots usually do.
  if (body.company) errors.push('rejected');

  if (errors.length) throw badRequest(errors.join(', '));

  const at = new Date().toISOString();
  const id = randomUUID();

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: 'CONTACT',
        SK: `${at}#${id}`,
        id,
        at,
        name,
        email,
        message,
        userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
        // Vercel forwards the client IP here; useful only for abuse triage.
        ip: String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(),
      },
    })
  );

  const delivered = await sendEmail({ name, email, message, at }).catch((err) => {
    // A delivery failure must not lose the message — it is already stored.
    console.error('[contact] email delivery failed:', err.message);
    return false;
  });

  res.status(201).json({ ok: true, id, delivered });
});

async function listMessages(req, res) {
  const expected = process.env.STUDY_PASSCODE;
  if (!expected || req.query?.key !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': 'CONTACT' },
      ScanIndexForward: false,
      Limit: 100,
    })
  );
  res.status(200).json({
    messages: (out.Items || []).map(({ PK, SK, ...rest }) => rest),
  });
}

async function sendEmail({ name, email, message, at }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) return false;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
      to: [to],
      reply_to: email,
      subject: `Portfolio enquiry from ${name}`,
      text: `From: ${name} <${email}>\nReceived: ${at}\n\n${message}`,
    }),
  });

  if (!response.ok) throw new Error(`Resend responded ${response.status}`);
  return true;
}
