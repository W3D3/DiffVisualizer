module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [

    // First application
    {
      name: 'DiffVisualizer',
      script: 'server/index.js',
      env_production: {
        NODE_ENV: 'production'
      }
    },
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy: {
    production: {
      user: 'swdyn',
      host: 'swdyn.isys.uni-klu.ac.at',
      ref: 'origin/master',
      repo: 'git@bitbucket.org:W3D3/diffvisualizer.git',
      path: '/home/swdyn/visualize_prod',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    } //,
    // dev: {
    //   user: 'node',
    //   host: '212.83.163.1',
    //   ref: 'origin/master',
    //   repo: 'git@github.com:repo.git',
    //   path: '/var/www/development',
    //   'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env dev',
    //   env: {
    //     NODE_ENV: 'dev'
    //   }
    // }
  }
};
