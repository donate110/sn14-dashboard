module.exports = {
  apps: [
    {
      name: 'sn14-dashboard',
      cwd: __dirname,
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: '4173',
        API_PROXY_TARGET: 'https://api.cacheon.ai',
      },
    },
  ],
}