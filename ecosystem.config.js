module.exports = {
  apps: [
    {
      name: 'solana-watcher',
      script: './backend/services/listener.js',
      instances: 1,             // Change to 'max' to use all CPU cores
      autorestart: true,
      watch: false,             // Set to true if you want auto-reload on file changes (useful in dev)
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
