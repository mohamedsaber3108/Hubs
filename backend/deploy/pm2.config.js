// ══════════════════════════════════════════════════════════
// USAM Hub — PM2 Cluster Configuration
// ══════════════════════════════════════════════════════════

module.exports = {
  apps: [
    {
      name: 'usam-hub-api',
      script: 'src/server.js',
      cwd: '/var/www/usam-hub/backend',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      watch: false,
      autorestart: true,
      restart_delay: 1000,
      max_restarts: 10,
      error_file: '/var/log/pm2/usam-hub-error.log',
      out_file: '/var/log/pm2/usam-hub-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
