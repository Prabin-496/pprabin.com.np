module.exports = {
  apps: [
    {
      name: 'flashcards-api',
      cwd: '/home/ec2-user/flashcards-api',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        AWS_REGION: 'ap-southeast-2',
        DYNAMODB_TABLE_NAME: 'Japanese_Flashcard',
      },
    },
  ],
};
