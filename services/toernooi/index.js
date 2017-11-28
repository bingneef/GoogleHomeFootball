const puppeteer = require('puppeteer')

const RESULT_URL = 'https://www.toernooi.nl/sport/teammatches.aspx?id=A11FC8BD-C426-4247-A052-A3E05B1A8088&tid=10'
const SCHEDULE_URL = 'https://www.toernooi.nl/sport/matches.aspx?id=A11FC8BD-C426-4247-A052-A3E05B1A8088'
const STANDING_URL = 'https://www.toernooi.nl/sport/draw.aspx?id=A11FC8BD-C426-4247-A052-A3E05B1A8088&draw=1'

const TEAM_NAME = 'Robster'
const SCHEDULE_TAG = 'schedule'
const SCORE_TAG = 'score'
const STANDING_TAG = 'standing'

const handleRequest = async (assistant, kind) => {
  switch (kind) {
    case SCORE_TAG:
      return await getLastResult(assistant)
    case STANDING_TAG:
      return await getStanding(assistant)
    case SCHEDULE_TAG:
      return await getNextGame(assistant)
    default:
      return assistant.tell('I cannot do that yet..')
  }
}

const setupBrowser = async (url) => {
  const browser = await puppeteer.launch({
    headless: true,
  })
  const page = await browser.newPage()

  await page.setCookie({
    "value": "l=1043&exp=43429.3833862616&c=1&s=5",
    "expires": new Date().getTime() + 10000,
    "domain": "www.toernooi.nl",
    "name": "st"
  })
  const cookies = await page.cookies()
  await page.goto(url, {
    waitLoad: true,
    waitNetworkIdle: true,
  })

  return [page, browser]
}

const getGetOrdinal = n => {
  const s = ["th","st","nd","rd"]
  const v = n % 100
  return n+(s[(v-20)%10]||s[v]||s[0])
}

const getStanding = async assistant => {
  const [ page, browser ] = await setupBrowser(STANDING_URL)
  let payload = {}

  const selector = 'table.ruler tbody tr'

  const teams = await page.$$(selector)
  for (let team of teams) {
    const cols = await team.$$('td')
    let handler = await cols[1].$('a')
    const teamName = await evaluateHandler(page, handler)
    if (teamName !== TEAM_NAME) {
      continue
    }

    const position = await evaluateNode(page, cols[0])
    const points = await evaluateNode(page, cols[2])
    const games = await evaluateNode(page, cols[3])
    const gamesStr = games == 1 ? 'game' : 'games'

    const goalsFor = await evaluateNode(page, cols[7])
    const goalsAgainst = await evaluateNode(page, cols[8])
    const goalDiff = goalsFor - goalsAgainst
    const goalDiffStr = goalDiff == 0 ? '' : goalDiff > 0 ? 'plus' : 'minus'

    return assistant.tell(`You are ${getGetOrdinal(position)} with ${points} points out of ${games} ${gamesStr} and a goal difference of ${goalDiffStr} ${goalDiff}.`)

  }

  return assistant.tell(`Couldn't find any results..`)
}

const getLastResult = async (assistant) => {
  const [ page, browser ] = await setupBrowser(RESULT_URL)

  let payload = {}

  try {
    const selector = 'table.matches tbody tr'

    const matches = await page.$$(selector)
    matches.reverse()
    for (let match of matches) {
      const cols = await match.$$('td')

      let handler = await cols[3].$('.teamname')
      const team1 = await evaluateHandler(page, handler)

      handler = await cols[5].$('.teamname')
      const team2 = await evaluateHandler(page, handler)

      handler = await cols[6].$('.score span')
      const score = await evaluateHandler(page, handler)

      if ((team1 == TEAM_NAME || team2 == TEAM_NAME) && score !== null) {
        payload = {
          opponent: team1 == TEAM_NAME ? team2 : team1,
          score: {
            ownGoals: team1 == TEAM_NAME ? score.split('-')[0] : score.split('-')[1],
            opponentGoals: team1 == TEAM_NAME ? score.split('-')[0] : score.split('-')[1],
          }
        }
        break
      }
    }
  } catch (e) {
    console.error(e)
  }

  await browser.close()

  if (!payload.score) {
    assistant.tell(`Couldn't find any results..`)
  } else {
    const { score: { ownGoals, opponentGoals }, opponent } = payload
    let string
    if (ownGoals > opponentGoals) {
      string = `We won against ${opponent} with ${ownGoals}-${opponentGoals}`
    } else if (ownGoals == opponentGoals) {
      string = `We drew against ${opponent} with ${ownGoals}-${opponentGoals}`
    } else {
      string = `We lost against ${opponent} with ${opponentGoals}-${ownGoals}`
    }
    return assistant.tell(string)
  }
}

const getNextGame = async (assistant) => {
  const [ page, browser ] = await setupBrowser(SCHEDULE_URL)

  let payload = {}

  try {
    const selector = 'table.matches tbody tr'

    const matches = await page.$$(selector)
    for (let match of matches) {
      const cols = await match.$$('td')

      let handler = await cols[3].$('.teamname')
      const team1 = await evaluateHandler(page, handler)

      handler = await cols[5].$('.teamname')
      const team2 = await evaluateHandler(page, handler)

      handler = await cols[7].$('a')
      const field = await evaluateHandler(page, handler)

      if (team1 == TEAM_NAME || team2 == TEAM_NAME) {
        payload = {
          opponent: team1 == TEAM_NAME ? team2 : team1,
          field: field.split('-')[1],
        }
        continue
      }
    }
  } catch (e) {
    console.error(e)
  }

  await browser.close()

  if (payload.opponent) {
    assistant.tell(`We are playing ${payload.opponent} on ${payload.field}`)
  } else {
    assistant.tell(`Couldn't find it..`)
  }
}

const evaluateHandler = async (page, handler) => {
  return page.evaluate(item => {
    if (!item) {
      return null
    }
    return item.childNodes[0].nodeValue
  }, handler)
}

const evaluateNode = async (page, node) => {
  return await page.evaluate(item => {
      return item.childNodes[0].nodeValue
    }, node)
}

module.exports = {
  handleRequest,
}
