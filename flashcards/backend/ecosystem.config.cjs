/** PM2 config for EC2 — keeps API running 24/7 on free-tier instance */
module.exports = {
  apps: [
    {
      name: 'flashcards-api',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
