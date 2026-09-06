/**
 * DynamoDB client + single-table key helpers.
 *
 * Table: AnkiFlashcards (PK/SK) with GSI1 for queue/due lookups.
 *
 *   Deck    PK=DECKS            SK=DECK#<deckId>
 *   Card    PK=DECK#<deckId>    SK=CARD#<cardId>
 *           GSI1PK=Q#<deckId>#<queue>   GSI1SK=<due ISO | padded position>
 *   Log     PK=LOG#<cardId>     SK=<iso>#<nonce>
 *           GSI1PK=DAY#<yyyy-mm-dd>     GSI1SK=<iso>#<cardId>
 *   Counts  PK=STATS#<deckId>   SK=DAY#<yyyy-mm-dd>
 *   Config  PK=CONFIG           SK=GLOBAL
 *
 * The GSI is what keeps the study queue off full-table scans: due cards come
 * back already sorted by a range query instead of scanning every card.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const TABLE = process.env.ANKI_TABLE_NAME || 'AnkiFlashcards';
export const REGION = process.env.AWS_REGION_ANKI || process.env.AWS_REGION || 'ap-southeast-2';

// Module scope: reused across warm invocations of the same Vercel function.
const client = new DynamoDBClient({
  region: REGION,
  ...(process.env.ANKI_AWS_ACCESS_KEY_ID
    ? {
        credentials: {
          accessKeyId: process.env.ANKI_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.ANKI_AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: true },
});

export const keys = {
  decks: () => ({ PK: 'DECKS' }),
  deck: (deckId) => ({ PK: 'DECKS', SK: `DECK#${deckId}` }),
  cardsOfDeck: (deckId) => ({ PK: `DECK#${deckId}` }),
  card: (deckId, cardId) => ({ PK: `DECK#${deckId}`, SK: `CARD#${cardId}` }),
  logsOfCard: (cardId) => ({ PK: `LOG#${cardId}` }),
  counts: (deckId, day) => ({ PK: `STATS#${deckId}`, SK: `DAY#${day}` }),
  config: () => ({ PK: 'CONFIG', SK: 'GLOBAL' }),
};

/** GSI1 partition for a card's queue, so due lookups are a range query. */
export function queueGsi(deckId, queue) {
  return `Q#${deckId}#${queue}`;
}

/**
 * Sort key within a queue partition. New cards sort by insertion position so
 * the deck is introduced in order; everything else sorts by due time.
 */
export function queueSort(card) {
  if (card.queue === 'new') return String(card.pos ?? 0).padStart(9, '0');
  return card.due || new Date(0).toISOString();
}

/** Attach the GSI attributes that match a card's current state. */
export function withIndexKeys(card) {
  return {
    ...card,
    GSI1PK: queueGsi(card.deckId, card.queue),
    GSI1SK: queueSort(card),
  };
}

const TZ = process.env.ANKI_TIMEZONE || 'Asia/Tokyo';
const ROLLOVER_HOUR = Number(process.env.ANKI_ROLLOVER_HOUR ?? 4);

/**
 * Anki's "day" doesn't start at midnight — it rolls over at 4am local time,
 * so a late-night study session still counts toward the previous day.
 */
export function dayKey(now = new Date()) {
  const shifted = new Date(now.getTime() - ROLLOVER_HOUR * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(shifted);
}

export const timezone = TZ;
