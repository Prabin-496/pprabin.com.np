/**
 * Voice-recording storage on the shared DynamoDB table.
 *
 * Replaces the SQLite tables from the EC2 backend. Layout keeps a recording and
 * its chunks in one partition so a detail view is a single query:
 *
 *   Recording  PK=VOICE#<id>   SK=META
 *              GSI1PK=VOICE    GSI1SK=<created_at>   (list, newest first)
 *   Chunk      PK=VOICE#<id>   SK=CHUNK#<0000 index>
 *
 * Audio is never persisted — it goes straight to Gemini and is dropped.
 */

import { randomUUID } from 'node:crypto';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddb, TABLE } from './ddb.js';

const LIST_PK = 'VOICE';
const now = () => new Date().toISOString();
const recPk = (id) => `VOICE#${id}`;
const chunkSk = (index) => `CHUNK#${String(index).padStart(4, '0')}`;

/** Shape returned to the frontend — matches the old rowToRecording() exactly. */
function toRecording(item) {
  if (!item) return null;
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    detected_language: item.detected_language ?? null,
    raw_transcript: item.raw_transcript ?? null,
    translated_english: item.translated_english ?? null,
    cleaned_english: item.cleaned_english ?? null,
    confidence: item.confidence ?? null,
    timestamps: item.timestamps || [],
    summary: item.summary || null,
    chunk_count: item.chunk_count || 0,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export async function createRecording(title) {
  const id = randomUUID();
  const ts = now();
  const item = {
    PK: recPk(id),
    SK: 'META',
    GSI1PK: LIST_PK,
    GSI1SK: ts,
    id,
    title: title || `Recording ${new Date().toLocaleString()}`,
    status: 'recording',
    chunk_count: 0,
    created_at: ts,
    updated_at: ts,
  };
  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return toRecording(item);
}

export async function getRecording(id) {
  const out = await ddb.send(
    new GetCommand({ TableName: TABLE, Key: { PK: recPk(id), SK: 'META' } })
  );
  return toRecording(out.Item);
}

export async function listRecordings() {
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': LIST_PK },
      ScanIndexForward: false, // newest first, matching ORDER BY created_at DESC
    })
  );
  return (out.Items || []).map(toRecording);
}

/**
 * The SQLite version used LIKE across every text column. This is a personal
 * single-user app, so filtering the (small) recording list in memory is both
 * simpler and cheaper than maintaining a search index.
 */
export async function searchRecordings(query) {
  const q = query.toLowerCase();
  const all = await listRecordings();
  return all.filter((r) =>
    [r.title, r.raw_transcript, r.translated_english, r.cleaned_english, JSON.stringify(r.summary)]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q))
  );
}

export async function getChunks(recordingId) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': recPk(recordingId), ':sk': 'CHUNK#' },
    })
  );
  return out.Items || [];
}

export async function deleteRecording(id) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': recPk(id) },
      ProjectionExpression: 'PK, SK',
    })
  );
  const items = out.Items || [];
  // BatchWrite caps at 25 items per call.
  for (let i = 0; i < items.length; i += 25) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE]: items.slice(i, i + 25).map((Key) => ({ DeleteRequest: { Key } })),
        },
      })
    );
  }
}

export async function putChunk(recordingId, chunkIndex, fields) {
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: recPk(recordingId),
        SK: chunkSk(chunkIndex),
        id: randomUUID(),
        recording_id: recordingId,
        chunk_index: chunkIndex,
        created_at: now(),
        ...fields,
      },
    })
  );
}

export async function touchRecording(recordingId, chunkCount) {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: recPk(recordingId), SK: 'META' },
      UpdateExpression: 'SET chunk_count = :c, updated_at = :u',
      ExpressionAttributeValues: { ':c': chunkCount, ':u': now() },
    })
  );
}

export async function updateRecording(recordingId, fields) {
  const names = {};
  const values = { ':u': now() };
  const sets = ['updated_at = :u'];

  for (const [key, value] of Object.entries(fields)) {
    names[`#${key}`] = key;
    values[`:${key}`] = value;
    sets.push(`#${key} = :${key}`);
  }

  const out = await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: recPk(recordingId), SK: 'META' },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    })
  );
  return toRecording(out.Attributes);
}
