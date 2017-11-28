const Raven = require('raven')
const constants = require('./../../config/constants')

const guard = process.env.NODE_ENV !== 'production' || !constants.tokens.sentry

const initSentry = () => {
  if (guard) {
    console.log('Sentry not started.')
    return
  }

  Raven.config(constants.tokens.sentry).install()
}

const sendException = e => {
  if (guard) {
    console.log('Exception not send: ', e.message)
    return
  }

  console.log('Exception send: ', e.message)
  Raven.captureException(e)
}

module.exports = {
  initSentry,
  sendException,
}
