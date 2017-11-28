'use strict'

const { DialogflowApp } = require('actions-on-google')
const { handleRequest } = require('./services/toernooi')
const { initSentry, sendException } = require('./services/sentry')

const { googleHome, serverPort } = require('./config/constants')

const morgan = require('morgan')
const express = require('express')
const bodyParser = require('body-parser')

initSentry()

const app = express()

app.use(morgan('combined'))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const handler = async assistant => {
  const { DATE_ARGUMENT, KIND_ARGUMENT } = googleHome

  const date = assistant.getArgument(DATE_ARGUMENT)
  const kind = assistant.getArgument(KIND_ARGUMENT)
  try {
    switch (date) {
      case 'monday':
        return await handleRequest(assistant, kind)
        break
      default:
        return assistant.tell(`I can't help you with that day unforunately.`)
    }
  } catch (e) {
    sendException(e)
    return assistant.tell(`Oops, something went wrong..`)
  }
}

app.use(async (req, res) => {
  const { ACTION_NAME } = googleHome

  const assistant = new DialogflowApp({
    request: req,
    response: res,
  })

  try {
    let actionMap = new Map()
    actionMap.set(ACTION_NAME, handler)
    return await assistant.handleRequest(actionMap)
  } catch (e) {
    sendException(e)
    return assistant.tell(`Oops, something went wrong..`)
  }
})

app.listen(serverPort)
