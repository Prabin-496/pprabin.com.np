module.exports = {
  apps: [
    {
      name: 'voice-ai-api',
      script: 'src/server.js',
      cwd: __dirname,
      autorestart: true,
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production' },
    },
  ],
};
