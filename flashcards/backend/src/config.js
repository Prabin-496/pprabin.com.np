import 'dotenv/config';

const parseOrigins = (value) =>
  (value || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  awsRegion: process.env.AWS_REGION || 'ap-southeast-2',
  tableName: process.env.DYNAMODB_TABLE_NAME || 'Japanese_Flashcard',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
};

export const TABLE_ARN =
  'arn:aws:dynamodb:ap-southeast-2:417007889308:table/Japanese_Flashcard';
