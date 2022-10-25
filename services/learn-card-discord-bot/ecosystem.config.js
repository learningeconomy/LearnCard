module.exports = {
  apps : [{
    name: 'learn-card-discord-bot',
    script: 'dist/index.js',
    watch: '.',
    env: {
      NODE_ENV: "development",
      PORT: 8080
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 8080
    }
  }, {
    script: './service-worker/',
    watch: ['./service-worker']
  }],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/main',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'pnpm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
