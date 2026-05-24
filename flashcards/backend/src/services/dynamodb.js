import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  DeleteCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { config } from '../config.js';

const client = new DynamoDBClient({ region: config.awsRegion });
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export async function listCards() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: config.tableName,
    })
  );
  const items = result.Items || [];
  return items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getCard(CardID) {
  const result = await docClient.send(
    new GetCommand({
      TableName: config.tableName,
      Key: { CardID },
    })
  );
  return result.Item || null;
}

export async function createCard({ word, meaning, hint, pronunciation }) {
  const card = {
    CardID: randomUUID(),
    word: word.trim(),
    meaning: meaning.trim(),
    createdAt: new Date().toISOString(),
  };

  if (hint?.trim()) card.hint = hint.trim();
  if (pronunciation?.trim()) card.pronunciation = pronunciation.trim();

  await docClient.send(
    new PutCommand({
      TableName: config.tableName,
      Item: card,
      ConditionExpression: 'attribute_not_exists(CardID)',
    })
  );

  return card;
}

export async function deleteCard(CardID) {
  await docClient.send(
    new DeleteCommand({
      TableName: config.tableName,
      Key: { CardID },
    })
  );
}
