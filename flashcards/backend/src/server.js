import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Flashcards API listening on port ${config.port}`);
  console.log(`DynamoDB table: ${config.tableName} (${config.awsRegion})`);
});
