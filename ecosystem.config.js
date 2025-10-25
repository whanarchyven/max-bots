module.exports = {
  apps: [
    {
      name: 'convex',
      script: 'bunx',
      args: 'convex dev',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'development'
      },
      log_file: './logs/convex.log',
      error_file: './logs/convex-error.log',
      out_file: './logs/convex-out.log',
      time: true,
      autorestart: true,
      watch: false
    },
    {
      name: 'max-bot',
      script: 'bun',
      args: 'run index.ts',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/bot.log',
      error_file: './logs/bot-error.log',
      out_file: './logs/bot-out.log',
      time: true,
      autorestart: true,
      watch: false,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
