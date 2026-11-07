import { createServer } from 'node:http'
import { load } from 'cheerio'

const port = Number(process.env.PORT ?? 3000)
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*'
const cacheDuration = 20_000

let cachedFeed = null
let cachedAt = 0
let pendingRequest = null

function sendJson(request, response, status, data) {
  const origin = request.headers.origin
  if (allowedOrigin === '*' || origin === allowedOrigin) {
    response.setHeader('access-control-allow-origin', allowedOrigin)
  }
  response.setHeader('vary', 'Origin')
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.setHeader('cache-control', 'no-store')
  response.writeHead(status)
  response.end(JSON.stringify(data))
}

async function fetchOfficialAlerts() {
  const response = await fetch('https://map.ukrainealarm.com/', {
    headers: { Accept: 'text/html' },
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) throw new Error(`Official map returned HTTP ${response.status}`)

  const $ = load(await response.text())
  const alertsByKey = new Map()

  $('.city-item').each((_, element) => {
    const card = $(element)
    const location = card.find('.title').first().text().trim()
    const type = card.find('.description').first().text().trim()
    const startedAt = card.find('.time').first().text().trim()
    const duration = card.find('.duration').first().text().trim()

    if (!location || !type) return

    const key = `${location.toLocaleLowerCase('uk')}|${type.toLocaleLowerCase('uk')}`
    if (!alertsByKey.has(key)) alertsByKey.set(key, { location, type, startedAt, duration })
  })

  if (alertsByKey.size === 0 && !$('.general-aside').length) {
    throw new Error('The official map did not contain an alert feed')
  }

  return {
    source: 'map.ukrainealarm.com',
    fetchedAt: new Date().toISOString(),
    alerts: [...alertsByKey.values()],
  }
}

async function getAlerts() {
  if (cachedFeed && Date.now() - cachedAt < cacheDuration) return cachedFeed
  if (pendingRequest) return pendingRequest

  pendingRequest = fetchOfficialAlerts()
  try {
    cachedFeed = await pendingRequest
    cachedAt = Date.now()
    return cachedFeed
  } finally {
    pendingRequest = null
  }
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.origin
    if (allowedOrigin === '*' || origin === allowedOrigin) {
      response.setHeader('access-control-allow-origin', allowedOrigin)
    }
    response.setHeader('access-control-allow-methods', 'GET, OPTIONS')
    response.setHeader('access-control-allow-headers', 'Accept, Content-Type')
    response.setHeader('vary', 'Origin')
    response.writeHead(204)
    response.end()
    return
  }

  if (request.method === 'GET' && request.url === '/health') {
    sendJson(request, response, 200, { status: 'ok' })
    return
  }

  if (request.method === 'GET' && request.url === '/api/alerts') {
    try {
      sendJson(request, response, 200, await getAlerts())
    } catch {
      sendJson(request, response, 502, { error: 'Не вдалося отримати дані офіційної карти.' })
    }
    return
  }

  sendJson(request, response, 404, { error: 'Not found' })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Alert API listening on port ${port}`)
})