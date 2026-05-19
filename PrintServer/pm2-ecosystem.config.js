/**
 * PM2 Ecosystem Configuration
 * Alternative to Windows Service - uses PM2 for auto-restart
 * 
 * Install PM2: npm install -g pm2
 * Start: pm2 start pm2-ecosystem.config.js
 * Save: pm2 save
 * Setup startup: pm2 startup
 */

module.exports = {
  apps: [{
    name: 'manpasand-print-server',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};






