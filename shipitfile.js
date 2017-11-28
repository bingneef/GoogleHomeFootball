const shipitDeploy = require('shipit-deploy')
const shipitPM2 = require('shipit-pm2')
const shipitYarn = require('shipit-yarn')
const shipitShared = require('shipit-shared')

module.exports = shipit => {
  shipitDeploy(shipit)
  shipitPM2(shipit)
  shipitYarn(shipit)
  shipitShared(shipit)

  shipit.initConfig({
    default: {
      workspace: 'tmp',
      deployTo: '/var/www/google-home-football',
      repositoryUrl: 'git@github.com:bingneef/GoogleHomeFootball.git',
      ignores: ['.git', 'node_modules'],
      keepReleases: 10,
      shallowClone: true,
      dirToCopy: '',
      yarn: {
        remote: false,
      },
      shared: {
        overwrite: false,
        files: [
          'app.json',
          '.env',
        ],
      }
    },
    production: {
      branch: 'master',
      servers: 'bing@5.157.85.46'
    },
  })
}


