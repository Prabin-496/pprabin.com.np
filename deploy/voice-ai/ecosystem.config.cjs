module.exports = {
  apps: [
    {
      name: 'voice-ai-api',
      cwd: '/home/ec2-user/voice-ai-api',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 4100,
      },
    },
  ],
};
