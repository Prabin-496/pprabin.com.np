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

const DAY_MS = 24 * 60 * 60 * 1000;
const LEARNING_STATES = ['New', 'Learning', 'Familiar', 'Reviewing', 'Strong', 'Mastered'];
const QUESTION_TYPES = [
  'ja_to_en_meaning',
  'en_to_ja_production',
  'kanji_to_reading',
  'reading_to_kanji',
  'sentence_cloze',
  'context_choice',
];

const STARTER_VOCABULARY = [
  {
    word: '確認', meaning: 'check / confirm', reading: 'かくにん', category: 'business', topic: 'workplace communication', jlptLevel: 'N3',
    exampleSentence: '設定内容を確認します。', exampleSentenceReading: 'せっていないようをかくにんします。', exampleSentenceMeaning: 'I will confirm the configuration details.',
    workplaceRelevance: 'Frequently used in meetings, chat, and operational procedures.',
    mnemonic: '確 = sure, 認 = recognize, so 確認 means making sure by checking.',
    similarWords: ['認識'], relatedWords: ['共有', '報告'], collocations: ['内容を確認する', '手順を確認する'], difficulty: 2, level: 1,
  },
  {
    word: '共有', meaning: 'share', reading: 'きょうゆう', category: 'business', topic: 'team collaboration', jlptLevel: 'N3',
    exampleSentence: '進捗をチームに共有してください。', exampleSentenceReading: 'しんちょくをチームにきょうゆうしてください。', exampleSentenceMeaning: 'Please share the progress with the team.',
    workplaceRelevance: 'Core communication verb in Japanese workplaces.', relatedWords: ['確認', '報告'], collocations: ['情報を共有する'], difficulty: 2, level: 1,
  },
  {
    word: '進捗', meaning: 'progress', reading: 'しんちょく', category: 'business', topic: 'project tracking', jlptLevel: 'N2',
    exampleSentence: '本日の進捗を報告します。', exampleSentenceReading: 'ほんじつのしんちょくをほうこくします。', exampleSentenceMeaning: 'I will report today’s progress.',
    workplaceRelevance: 'Used in standups, status reports, and stakeholder communication.', relatedWords: ['課題', '報告'], level: 2,
  },
  {
    word: '構築', meaning: 'build / construct', reading: 'こうちく', category: 'cloud-infrastructure', topic: 'cloud setup', jlptLevel: 'N2',
    exampleSentence: '新しいAWS環境を構築します。', exampleSentenceReading: 'あたらしいエーダブリューエスかんきょうをこうちくします。', exampleSentenceMeaning: 'We will build a new AWS environment.',
    workplaceRelevance: 'Common in infrastructure design and deployment plans.', relatedWords: ['環境', '設定'], level: 3,
  },
  {
    word: '環境', meaning: 'environment', reading: 'かんきょう', category: 'cloud-infrastructure', topic: 'infrastructure', jlptLevel: 'N3',
    exampleSentence: '本番環境でテストを実施します。', exampleSentenceReading: 'ほんばんかんきょうでテストをじっしします。', exampleSentenceMeaning: 'We will run tests in the production environment.',
    workplaceRelevance: 'Essential in cloud, dev, and operational contexts.', relatedWords: ['本番', '開発'], level: 2,
  },
  {
    word: '移行', meaning: 'migration', reading: 'いこう', category: 'cloud-infrastructure', topic: 'data migration', jlptLevel: 'N2',
    exampleSentence: 'データ移行の手順を確認しましょう。', exampleSentenceReading: 'データいこうのてじゅんをかくにんしましょう。', exampleSentenceMeaning: 'Let us confirm the data migration procedure.',
    workplaceRelevance: 'Used in cloud migration, file server migration, and AWS FSx projects.',
    mnemonic: 'Think “go” in English sounds like こう in 移行 — data goes to a new environment.',
    similarWords: ['移設', '移動', '転送'], relatedWords: ['手順', '検証'], level: 3,
  },
  {
    word: '運用', meaning: 'operation / operations', reading: 'うんよう', category: 'cloud-infrastructure', topic: 'cloud operations', jlptLevel: 'N2',
    exampleSentence: 'システム運用を自動化します。', exampleSentenceReading: 'システムうんようをじどうかします。', exampleSentenceMeaning: 'We will automate system operations.',
    workplaceRelevance: 'Central term for production support and cloud operations.', relatedWords: ['監視', '復旧'], level: 3,
  },
  {
    word: '監視', meaning: 'monitoring', reading: 'かんし', category: 'cloud-infrastructure', topic: 'monitoring', jlptLevel: 'N2',
    exampleSentence: 'サーバーの監視を強化します。', exampleSentenceReading: 'サーバーのかんしをきょうかします。', exampleSentenceMeaning: 'We will strengthen server monitoring.',
    workplaceRelevance: 'Useful for CloudWatch, alerts, and infrastructure reliability.', relatedWords: ['障害', '復旧'], level: 3,
  },
  {
    word: '障害', meaning: 'incident / failure', reading: 'しょうがい', category: 'cloud-infrastructure', topic: 'incident response', jlptLevel: 'N2',
    exampleSentence: '障害の原因を調査しています。', exampleSentenceReading: 'しょうがいのげんいんをちょうさしています。', exampleSentenceMeaning: 'We are investigating the cause of the incident.',
    workplaceRelevance: 'Key term for incident reports and operations meetings.', relatedWords: ['原因', '対策', '復旧'], level: 4,
  },
  {
    word: '権限', meaning: 'permission / privilege', reading: 'けんげん', category: 'cloud-infrastructure', topic: 'security / IAM', jlptLevel: 'N2',
    exampleSentence: 'アクセス権限を見直します。', exampleSentenceReading: 'アクセスけんげんをみなおします。', exampleSentenceMeaning: 'We will review access permissions.',
    workplaceRelevance: 'Critical for IAM, least privilege, and security operations.', relatedWords: ['認証', '認可'], level: 4,
  },
];

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((v) => normalizeString(v)).filter(Boolean))].slice(0, 12);
}

function normalizeLevel(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(7, Math.round(n)));
}

function normalizeDifficulty(value, fallback = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function nowIso() {
  return new Date().toISOString();
}

function computeStateFromMastery(masteryPoints) {
  if (masteryPoints >= 20) return 'Mastered';
  if (masteryPoints >= 14) return 'Strong';
  if (masteryPoints >= 9) return 'Reviewing';
  if (masteryPoints >= 5) return 'Familiar';
  if (masteryPoints >= 2) return 'Learning';
  return 'New';
}

function migrateLegacyCard(item) {
  const createdAt = item.createdAt || nowIso();
  const reviews = Number(item.reviews ?? item.reviewCount ?? 0) || 0;
  const correct = Number(item.correct ?? item.correctCount ?? 0) || 0;
  const incorrect = Number(item.incorrect ?? item.incorrectCount ?? 0) || 0;
  const masteryPoints = Number(item.masteryPoints ?? 0) || 0;
  const level = normalizeLevel(item.level, 1);
  const state = LEARNING_STATES.includes(item.learningState)
    ? item.learningState
    : computeStateFromMastery(masteryPoints);

  const card = {
    ...item,
    schemaVersion: 2,
    CardID: item.CardID || randomUUID(),
    word: normalizeString(item.word || item.kanji || item.hiragana || item.katakana),
    meaning: normalizeString(item.meaning || item.englishMeaning),
    kanji: normalizeString(item.kanji || item.word),
    hiragana: normalizeString(item.hiragana),
    katakana: normalizeString(item.katakana),
    reading: normalizeString(item.reading || item.pronunciation),
    pronunciation: normalizeString(item.pronunciation || item.reading),
    englishMeaning: normalizeString(item.englishMeaning || item.meaning),
    japaneseMeaning: normalizeString(item.japaneseMeaning),
    partOfSpeech: normalizeString(item.partOfSpeech),
    exampleSentence: normalizeString(item.exampleSentence),
    exampleSentenceReading: normalizeString(item.exampleSentenceReading),
    exampleSentenceMeaning: normalizeString(item.exampleSentenceMeaning),
    workplaceRelevance: normalizeString(item.workplaceRelevance),
    jlptLevel: normalizeString(item.jlptLevel || 'N3'),
    category: normalizeString(item.category || 'general'),
    topic: normalizeString(item.topic || 'general'),
    mnemonic: normalizeString(item.mnemonic || item.hint),
    hint: normalizeString(item.hint || item.mnemonic),
    similarWords: normalizeStringArray(item.similarWords),
    relatedWords: normalizeStringArray(item.relatedWords),
    collocations: normalizeStringArray(item.collocations),
    difficulty: normalizeDifficulty(item.difficulty, 2),
    level,
    createdAt,
    updatedAt: item.updatedAt || createdAt,
    firstIntroducedAt: item.firstIntroducedAt || createdAt,
    lastReviewedAt: item.lastReviewedAt || null,
    nextReviewAt: item.nextReviewAt || createdAt,
    reviews,
    correct,
    incorrect,
    streak: Number(item.streak ?? 0) || 0,
    intervalDays: Number(item.intervalDays ?? 0) || 0,
    learningState: state,
    masteryPoints,
    masteryLevel: Number(item.masteryLevel ?? Math.min(100, masteryPoints * 5)) || 0,
    confidence: Number(item.confidence ?? 0) || 0,
    mistakeStats: typeof item.mistakeStats === 'object' && item.mistakeStats ? item.mistakeStats : {},
    reviewHistory: Array.isArray(item.reviewHistory) ? item.reviewHistory.slice(-80) : [],
  };

  if (!card.word) {
    card.word = card.kanji || card.hiragana || card.katakana || '';
  }
  if (!card.meaning) card.meaning = card.englishMeaning;
  if (!card.englishMeaning) card.englishMeaning = card.meaning;

  return card;
}

async function scanAllCards() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: config.tableName,
        ExclusiveStartKey,
      })
    );
    if (result.Items?.length) items.push(...result.Items);
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

export async function listCards({ limit = 200, cursor } = {}) {
  const scanLimit = Math.max(1, Math.min(500, Number(limit) || 200));
  const ExclusiveStartKey = cursor ? JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) : undefined;
  const result = await docClient.send(
    new ScanCommand({
      TableName: config.tableName,
      Limit: scanLimit,
      ExclusiveStartKey,
    })
  );

  const cards = (result.Items || []).map(migrateLegacyCard).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const nextCursor = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64url')
    : null;

  return { cards, nextCursor };
}

export async function getAllCards() {
  const items = await scanAllCards();
  return items.map(migrateLegacyCard);
}

export async function getCard(CardID) {
  const result = await docClient.send(
    new GetCommand({
      TableName: config.tableName,
      Key: { CardID },
    })
  );
  return result.Item ? migrateLegacyCard(result.Item) : null;
}

function makeCardPayload(input = {}) {
  const createdAt = nowIso();
  const word = normalizeString(input.word || input.kanji || input.hiragana || input.katakana);
  const meaning = normalizeString(input.meaning || input.englishMeaning);

  const card = migrateLegacyCard({
    CardID: randomUUID(),
    word,
    meaning,
    kanji: input.kanji,
    hiragana: input.hiragana,
    katakana: input.katakana,
    reading: input.reading,
    pronunciation: input.pronunciation,
    englishMeaning: input.englishMeaning,
    japaneseMeaning: input.japaneseMeaning,
    partOfSpeech: input.partOfSpeech,
    exampleSentence: input.exampleSentence,
    exampleSentenceReading: input.exampleSentenceReading,
    exampleSentenceMeaning: input.exampleSentenceMeaning,
    workplaceRelevance: input.workplaceRelevance,
    jlptLevel: input.jlptLevel,
    category: input.category,
    topic: input.topic,
    mnemonic: input.mnemonic,
    hint: input.hint,
    similarWords: input.similarWords,
    relatedWords: input.relatedWords,
    collocations: input.collocations,
    difficulty: input.difficulty,
    level: input.level,
    createdAt,
    updatedAt: createdAt,
    firstIntroducedAt: createdAt,
    nextReviewAt: createdAt,
  });

  return card;
}

export async function createCard(payload) {
  const card = makeCardPayload(payload);

  await docClient.send(
    new PutCommand({
      TableName: config.tableName,
      Item: card,
      ConditionExpression: 'attribute_not_exists(CardID)',
    })
  );

  return card;
}

export async function saveCard(card) {
  const next = migrateLegacyCard({ ...card, updatedAt: nowIso() });
  await docClient.send(
    new PutCommand({
      TableName: config.tableName,
      Item: next,
    })
  );
  return next;
}

export async function deleteCard(CardID) {
  await docClient.send(
    new DeleteCommand({
      TableName: config.tableName,
      Key: { CardID },
    })
  );
}

export function getTodaySummary(cards, sessionCards = null) {
  const now = Date.now();
  const source = sessionCards || cards;
  const due = source.filter((c) => !c.nextReviewAt || new Date(c.nextReviewAt).getTime() <= now).length;
  const weak = source.filter((c) => c.incorrect >= Math.max(2, c.correct / 2) && c.reviews > 0).length;
  const fresh = source.filter((c) => c.learningState === 'New').length;
  const mastered = source.filter((c) => c.learningState === 'Mastered').length;
  return { due, weak, new: fresh, mastered };
}

function getAccuracy(card) {
  if (!card.reviews) return 0;
  return card.correct / card.reviews;
}

function gradeToInterval(currentInterval, grade, wasIncorrectStreak) {
  if (grade === 'again') return wasIncorrectStreak >= 2 ? 0.08 : 0.25;
  if (grade === 'hard') return Math.max(1, currentInterval ? currentInterval * 1.2 : 1);
  if (grade === 'good') return Math.max(1.5, currentInterval ? currentInterval * 2 : 2);
  return Math.max(3, currentInterval ? currentInterval * 3 : 4);
}

function gradeToMasteryDelta(grade) {
  if (grade === 'again') return -2;
  if (grade === 'hard') return 1;
  if (grade === 'good') return 2;
  return 3;
}

function defaultMistakeType(questionType) {
  switch (questionType) {
    case 'ja_to_en_meaning':
      return 'Meaning mistake';
    case 'en_to_ja_production':
      return 'Production mistake';
    case 'kanji_to_reading':
      return 'Reading mistake';
    case 'reading_to_kanji':
      return 'Kanji mistake';
    case 'sentence_cloze':
      return 'Context mistake';
    case 'context_choice':
      return 'Similar-word confusion';
    default:
      return 'Meaning mistake';
  }
}

export async function reviewCard({ cardId, grade, questionType, mistakeTypes = [], userAnswer = '' }) {
  const current = await getCard(cardId);
  if (!current) {
    const err = new Error('Card not found');
    err.statusCode = 404;
    throw err;
  }

  const now = new Date();
  const next = { ...current };
  const normalizedGrade = ['again', 'hard', 'good', 'easy'].includes(grade) ? grade : 'again';
  const incorrect = normalizedGrade === 'again';

  next.reviews += 1;
  if (incorrect) {
    next.incorrect += 1;
    next.streak = 0;
  } else {
    next.correct += 1;
    next.streak += 1;
  }

  const wrongTypes = incorrect
    ? normalizeStringArray(mistakeTypes).length
      ? normalizeStringArray(mistakeTypes)
      : [defaultMistakeType(questionType)]
    : [];

  const previousMiss = next.reviewHistory?.length
    ? next.reviewHistory[next.reviewHistory.length - 1]?.grade === 'again'
    : false;

  next.intervalDays = Number(
    gradeToInterval(Number(next.intervalDays || 0), normalizedGrade, incorrect && previousMiss).toFixed(2)
  );

  next.masteryPoints = Math.max(0, (next.masteryPoints || 0) + gradeToMasteryDelta(normalizedGrade));
  next.learningState = computeStateFromMastery(next.masteryPoints);
  next.masteryLevel = Math.min(100, Math.max(0, Math.round((next.masteryPoints / 20) * 100)));

  const accuracy = getAccuracy(next);
  next.confidence = Math.min(
    100,
    Math.max(0, Math.round(accuracy * 65 + Math.min(35, next.streak * 4 + next.masteryLevel * 0.15)))
  );

  next.lastReviewedAt = now.toISOString();
  next.nextReviewAt = new Date(now.getTime() + next.intervalDays * DAY_MS).toISOString();

  next.mistakeStats = typeof next.mistakeStats === 'object' && next.mistakeStats ? { ...next.mistakeStats } : {};
  for (const type of wrongTypes) {
    next.mistakeStats[type] = Number(next.mistakeStats[type] || 0) + 1;
  }

  const historyEntry = {
    at: now.toISOString(),
    grade: normalizedGrade,
    correct: !incorrect,
    questionType: QUESTION_TYPES.includes(questionType) ? questionType : 'ja_to_en_meaning',
    mistakeTypes: wrongTypes,
    intervalDays: next.intervalDays,
    learningState: next.learningState,
    userAnswer: normalizeString(userAnswer).slice(0, 180),
  };

  next.reviewHistory = [...(Array.isArray(next.reviewHistory) ? next.reviewHistory : []), historyEntry].slice(-80);

  const saved = await saveCard(next);

  return {
    card: saved,
    impact: {
      wasIncorrect: incorrect,
      strengthened: !incorrect && ['Reviewing', 'Strong', 'Mastered'].includes(saved.learningState),
      learned: !incorrect && ['Learning', 'Familiar'].includes(saved.learningState),
      needsReview: incorrect || saved.learningState === 'Learning',
      mistakes: wrongTypes,
    },
  };
}

function cardPriority(card, nowTs, unlockLevel) {
  const nextTs = card.nextReviewAt ? new Date(card.nextReviewAt).getTime() : 0;
  const overdueDays = nextTs ? Math.max(0, (nowTs - nextTs) / DAY_MS) : 2;
  const dueBoost = nextTs <= nowTs ? 120 + overdueDays * 18 : 0;
  const weakBoost = card.reviews > 0 ? (card.incorrect / Math.max(1, card.reviews)) * 60 : 0;
  const recencyBoost = card.reviews <= 3 ? 20 : 0;
  const workplaceBoost = card.workplaceRelevance || card.category?.includes('cloud') || card.category?.includes('business') ? 18 : 0;
  const jlptBoost = card.jlptLevel?.toUpperCase() === 'N2' ? 12 : card.jlptLevel?.toUpperCase() === 'N3' ? 8 : 0;
  const unlockPenalty = card.level > unlockLevel ? -70 : 0;
  const confusionBoost = Array.isArray(card.similarWords) && card.similarWords.length ? 8 : 0;
  const stateBoost = card.learningState === 'New' ? 15 : card.learningState === 'Learning' ? 22 : 0;
  return dueBoost + weakBoost + recencyBoost + workplaceBoost + jlptBoost + confusionBoost + stateBoost + unlockPenalty;
}

function getUnlockLevel(cards) {
  const mastered = cards.filter((c) => c.learningState === 'Mastered').length;
  return Math.max(1, Math.min(7, 1 + Math.floor(mastered / 8)));
}

export function buildStudySession(cards, requestedCount = 22) {
  const count = Math.max(8, Math.min(40, Number(requestedCount) || 22));
  const nowTs = Date.now();
  const unlockLevel = getUnlockLevel(cards);

  const eligible = cards.filter((card) => card.level <= unlockLevel || !card.nextReviewAt || new Date(card.nextReviewAt).getTime() <= nowTs);
  const sorted = [...eligible].sort((a, b) => cardPriority(b, nowTs, unlockLevel) - cardPriority(a, nowTs, unlockLevel));

  const queue = [];
  const used = new Set();
  const pushCard = (card) => {
    if (!card || used.has(card.CardID)) return;
    used.add(card.CardID);
    queue.push(card);
  };

  const overdue = sorted.filter((c) => !c.nextReviewAt || new Date(c.nextReviewAt).getTime() <= nowTs);
  const weak = sorted.filter((c) => c.reviews >= 2 && getAccuracy(c) < 0.72);
  const recent = sorted.filter((c) => c.reviews > 0 && c.reviews <= 4);
  const confusable = sorted.filter((c) => c.similarWords?.length);
  const workplace = sorted.filter((c) => c.category?.includes('cloud') || c.category?.includes('business') || c.workplaceRelevance);
  const jlpt = sorted.filter((c) => c.jlptLevel?.toUpperCase() === 'N2' || c.jlptLevel?.toUpperCase() === 'N3');
  const fresh = sorted.filter((c) => c.learningState === 'New');

  const roundRobinBuckets = [overdue, weak, recent, confusable, workplace, jlpt, fresh, sorted];
  for (let i = 0; queue.length < count && i < count * 3; i += 1) {
    for (const bucket of roundRobinBuckets) {
      const card = bucket[i % bucket.length];
      if (card) pushCard(card);
      if (queue.length >= count) break;
    }
  }

  const sessionCards = queue.length ? queue : sorted.slice(0, count);
  return {
    unlockLevel,
    summary: getTodaySummary(cards, sessionCards),
    cards: sessionCards,
  };
}

function availableQuestionTypes(card) {
  const set = new Set(['ja_to_en_meaning']);
  if (card.word && card.meaning) set.add('en_to_ja_production');
  if (card.word && (card.reading || card.pronunciation || card.hiragana)) set.add('kanji_to_reading');
  if ((card.reading || card.pronunciation || card.hiragana) && card.word) set.add('reading_to_kanji');
  if (card.exampleSentence && card.word && card.exampleSentence.includes(card.word)) set.add('sentence_cloze');
  if (card.exampleSentence && card.similarWords?.length) set.add('context_choice');
  return [...set];
}

function weightedChoice(types, preferred = []) {
  const score = new Map(types.map((t) => [t, 1]));
  for (const t of preferred) {
    if (score.has(t)) score.set(t, (score.get(t) || 1) + 1.8);
  }
  const total = [...score.values()].reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [key, value] of score.entries()) {
    r -= value;
    if (r <= 0) return key;
  }
  return types[0];
}

function preferredTypesFromMistakes(card) {
  const stats = card.mistakeStats || {};
  const pairs = Object.entries(stats).sort((a, b) => Number(b[1]) - Number(a[1]));
  const best = pairs.slice(0, 2).map(([k]) => k.toLowerCase());
  const pref = [];
  for (const item of best) {
    if (item.includes('meaning')) pref.push('ja_to_en_meaning');
    if (item.includes('production')) pref.push('en_to_ja_production');
    if (item.includes('reading')) pref.push('kanji_to_reading');
    if (item.includes('kanji')) pref.push('reading_to_kanji');
    if (item.includes('context') || item.includes('similar')) pref.push('context_choice', 'sentence_cloze');
  }
  return pref;
}

export function buildQuestion(card, sessionCards = []) {
  const types = availableQuestionTypes(card);
  const preferred = preferredTypesFromMistakes(card);
  const questionType = weightedChoice(types, preferred);

  const reading = card.reading || card.pronunciation || card.hiragana || '';
  const similarOptions = [card.word, ...(card.similarWords || [])].filter(Boolean).slice(0, 4);

  if (questionType === 'en_to_ja_production') {
    return {
      questionType,
      prompt: `Translate to Japanese: "${card.meaning}"`,
      answerLabel: 'Expected Japanese',
      answer: card.word,
      answerReading: reading,
      reveal: card,
    };
  }

  if (questionType === 'kanji_to_reading') {
    return {
      questionType,
      prompt: `「${card.word}」の読み方は？`,
      answerLabel: 'Reading',
      answer: reading || 'No reading saved yet',
      reveal: card,
    };
  }

  if (questionType === 'reading_to_kanji') {
    return {
      questionType,
      prompt: `「${reading}」を漢字で書くと？`,
      answerLabel: 'Kanji / word',
      answer: card.word,
      reveal: card,
    };
  }

  if (questionType === 'sentence_cloze') {
    const cloze = card.exampleSentence.replace(card.word, '＿＿');
    return {
      questionType,
      prompt: `文を完成してください: ${cloze}`,
      answerLabel: 'Missing word',
      answer: card.word,
      answerReading: reading,
      reveal: card,
    };
  }

  if (questionType === 'context_choice' && similarOptions.length >= 2) {
    const sentence = card.exampleSentence.replace(card.word, '＿＿');
    return {
      questionType,
      prompt: `文脈に最も自然な語を選んでください: ${sentence}`,
      options: similarOptions.sort(() => Math.random() - 0.5),
      answerLabel: 'Correct option',
      answer: card.word,
      reveal: card,
    };
  }

  return {
    questionType: 'ja_to_en_meaning',
    prompt: `「${card.word}」の意味は？`,
    answerLabel: 'Meaning',
    answer: card.meaning,
    reveal: card,
  };
}

export function summarizeCard(card) {
  const accuracy = card.reviews ? Math.round((card.correct / card.reviews) * 100) : 0;
  return {
    CardID: card.CardID,
    word: card.word,
    meaning: card.meaning,
    reading: card.reading || card.pronunciation || '',
    category: card.category,
    topic: card.topic,
    jlptLevel: card.jlptLevel,
    level: card.level,
    learningState: card.learningState,
    masteryLevel: card.masteryLevel,
    confidence: card.confidence,
    reviews: card.reviews,
    accuracy,
    lastReviewedAt: card.lastReviewedAt,
    nextReviewAt: card.nextReviewAt,
    mistakeStats: card.mistakeStats || {},
  };
}

export async function bootstrapVocabulary() {
  const existing = await getAllCards();
  const existingWords = new Set(existing.map((c) => c.word));
  const created = [];

  for (const row of STARTER_VOCABULARY) {
    if (existingWords.has(row.word)) continue;
    const card = await createCard(row);
    created.push(card);
  }

  return created;
}
