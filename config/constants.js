import path from 'path'
import dotenv from 'dotenv'
dotenv.config({path: path.join(__dirname, "../.env")})

const serverPort = process.env.PORT || 4000
module.exports = {
  version: '0.0.1',
  serverPort,
  tokens: {
    sentry: process.env.SENTRY_KEY,
  },
  googleHome: {
    ACTION_NAME: 'main',
    DATE_ARGUMENT: 'date',
    KIND_ARGUMENT: 'kind',
  }
}
