import Raven from 'raven'
import constants from './../../config/constants'

const guard = process.env.NODE_ENV !== 'production' || !constants.tokens.sentry

export const initSentry = () => {
  if (guard) {
    console.log('Sentry not started.')
    return
  }

  Raven.config(constants.tokens.sentry).install()
}

export const sendException = e => {
  if (guard) {
    return
  }

  Raven.captureException(e)
}
