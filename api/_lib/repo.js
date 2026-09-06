/** Data access for decks, cards, review logs, and daily counters. */

import {
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';
import { ddb, TABLE, keys, queueGsi, withIndexKeys, dayKey } from './ddb.js';
import { DEFAULT_CONFIG, newCardState, withDefaults } from './scheduler.js';

/* ------------------------------- decks -------------------------------- */

export async function listDecks() {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': 'DECKS' },
    })
  );
  return (res.Items || []).map(stripKeys).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getDeck(deckId) {
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: keys.deck(deckId) }));
  return res.Item ? stripKeys(res.Item) : null;
}

export async function putDeck(deck) {
  const now = new Date().toISOString();
  const item = {
    deckId: deck.deckId || slugify(deck.name) || randomUUID(),
    name: deck.name || 'Untitled deck',
    description: deck.description || '',
    order: Number(deck.order) || 0,
    config: withDefaults(deck.config || {}),
    createdAt: deck.createdAt || now,
    updatedAt: now,
  };
  await ddb.send(
    new PutCommand({ TableName: TABLE, Item: { ...keys.deck(item.deckId), ...item } })
  );
  return item;
}

export async function deleteDeck(deckId) {
  const cards = await allCardsInDeck(deckId);
  await batchDelete([
    ...cards.map((c) => keys.card(deckId, c.cardId)),
    keys.deck(deckId),
  ]);
  return cards.length;
}

/* -------------------------------- cards ------------------------------- */

export function makeCard(deckId, input, position = 0) {
  const now = new Date().toISOString();
  return {
    cardId: input.cardId || randomUUID(),
    deckId,
    // Note content
    expression: str(input.expression || input.word || input.front),
    reading: str(input.reading || input.pronunciation),
    meaning: str(input.meaning || input.back || input.englishMeaning),
    partOfSpeech: str(input.partOfSpeech),
    exampleSentence: str(input.exampleSentence),
    exampleMeaning: str(input.exampleMeaning),
    // Memory aids: a mnemonic story plus a per-kanji component breakdown.
    mnemonic: str(input.mnemonic),
    kanjiBreakdown: str(input.kanjiBreakdown),
    romaji: str(input.romaji),
    notes: str(input.notes || input.hint),
    tags: normalizeTags(input.tags),
    // Scheduling state
    ...newCardState(position),
    createdAt: now,
    updatedAt: now,
  };
}

export async function putCard(card) {
  const item = withIndexKeys(card);
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: { ...keys.card(card.deckId, card.cardId), ...item },
    })
  );
  return card;
}

export async function getCard(deckId, cardId) {
  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: keys.card(deckId, cardId),
      // Answering a card is read-modify-write. An eventually-consistent read
      // here silently drops reviews when the user answers quickly.
      ConsistentRead: true,
    })
  );
  return res.Item ? stripKeys(res.Item) : null;
}

export async function deleteCard(deckId, cardId) {
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: keys.card(deckId, cardId) }));
}

/** Every card in a deck. Paginated internally; used by browse and stats. */
export async function allCardsInDeck(deckId, { limit } = {}) {
  const out = [];
  let ExclusiveStartKey;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `DECK#${deckId}`, ':sk': 'CARD#' },
        ExclusiveStartKey,
      })
    );
    out.push(...(res.Items || []).map(stripKeys));
    ExclusiveStartKey = res.LastEvaluatedKey;
    if (limit && out.length >= limit) break;
  } while (ExclusiveStartKey);
  return limit ? out.slice(0, limit) : out;
}

/**
 * Cards sitting in one queue, oldest-due first.
 * `dueBefore` restricts learn/review queues to cards actually ready now.
 */
export async function queryQueue(deckId, queue, { limit = 50, dueBefore } = {}) {
  const params = {
    TableName: TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: dueBefore
      ? 'GSI1PK = :pk AND GSI1SK <= :due'
      : 'GSI1PK = :pk',
    ExpressionAttributeValues: dueBefore
      ? { ':pk': queueGsi(deckId, queue), ':due': dueBefore }
      : { ':pk': queueGsi(deckId, queue) },
    Limit: limit,
  };
  const res = await ddb.send(new QueryCommand(params));
  return (res.Items || []).map(stripKeys);
}

/** Count of cards in a queue (no item payload transferred). */
export async function countQueue(deckId, queue, { dueBefore } = {}) {
  let total = 0;
  let ExclusiveStartKey;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: dueBefore ? 'GSI1PK = :pk AND GSI1SK <= :due' : 'GSI1PK = :pk',
        ExpressionAttributeValues: dueBefore
          ? { ':pk': queueGsi(deckId, queue), ':due': dueBefore }
          : { ':pk': queueGsi(deckId, queue) },
        Select: 'COUNT',
        ExclusiveStartKey,
      })
    );
    total += res.Count || 0;
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return total;
}

export async function batchPutCards(cards) {
  const items = cards.map((card) => ({
    PutRequest: { Item: { ...keys.card(card.deckId, card.cardId), ...withIndexKeys(card) } },
  }));
  await batchWrite(items);
  return cards.length;
}

/* ------------------------------ review log ---------------------------- */

export async function logReview(entry) {
  const at = entry.at || new Date().toISOString();
  const logId = `${at}#${Math.random().toString(36).slice(2, 8)}`;
  const item = {
    ...keys.logsOfCard(entry.cardId),
    SK: logId,
    GSI1PK: `DAY#${dayKey(new Date(at))}`,
    GSI1SK: `${at}#${entry.cardId}`,
    ...entry,
    // Mirrored onto the item because reads strip the raw key attributes.
    logId,
    at,
  };
  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function reviewsOnDay(day, { limit = 1000 } = {}) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': `DAY#${day}` },
      Limit: limit,
    })
  );
  return (res.Items || []).map(stripKeys);
}

export async function cardHistory(cardId, { limit = 50 } = {}) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `LOG#${cardId}` },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (res.Items || []).map(stripKeys);
}

/* --------------------------- daily counters --------------------------- */

export async function getCounts(deckId, day = dayKey()) {
  const res = await ddb.send(
    new GetCommand({ TableName: TABLE, Key: keys.counts(deckId, day), ConsistentRead: true })
  );
  return { newDone: 0, revDone: 0, ...(res.Item ? stripKeys(res.Item) : {}), day };
}

/** Atomic increment so concurrent answers can't lose a count. */
export async function bumpCounts(deckId, { isNew, day = dayKey() }) {
  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: keys.counts(deckId, day),
      UpdateExpression:
        'SET newDone = if_not_exists(newDone, :z) + :n, revDone = if_not_exists(revDone, :z) + :r, deckId = :d, #day = :day',
      ExpressionAttributeNames: { '#day': 'day' },
      ExpressionAttributeValues: {
        ':z': 0,
        ':n': isNew ? 1 : 0,
        ':r': isNew ? 0 : 1,
        ':d': deckId,
        ':day': day,
      },
      ReturnValues: 'ALL_NEW',
    })
  );
  return stripKeys(res.Attributes || {});
}

/* ------------------------------- config ------------------------------- */

export async function getGlobalConfig() {
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: keys.config() }));
  return withDefaults(res.Item ? stripKeys(res.Item).config || {} : {});
}

export async function putGlobalConfig(config) {
  const merged = withDefaults(config);
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: { ...keys.config(), config: merged, updatedAt: new Date().toISOString() },
    })
  );
  return merged;
}

/* ------------------------------- helpers ------------------------------ */

async function batchWrite(requests) {
  for (let i = 0; i < requests.length; i += 25) {
    const chunk = requests.slice(i, i + 25);
    let unprocessed = { [TABLE]: chunk };
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const res = await ddb.send(new BatchWriteCommand({ RequestItems: unprocessed }));
      const left = res.UnprocessedItems?.[TABLE];
      if (!left?.length) break;
      unprocessed = { [TABLE]: left };
      await sleep(2 ** attempt * 60);
    }
  }
}

async function batchDelete(keyList) {
  await batchWrite(keyList.map((Key) => ({ DeleteRequest: { Key } })));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripKeys(item) {
  const { PK, SK, GSI1PK, GSI1SK, ...rest } = item;
  return rest;
}

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export function normalizeTags(tags) {
  if (typeof tags === 'string') {
    return [...new Set(tags.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean))].slice(0, 24);
  }
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 24);
}

export function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export { DEFAULT_CONFIG, dayKey };
