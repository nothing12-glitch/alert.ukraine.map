import { createServer } from 'node:http'
import { fetchAlertsFeed } from './alerts-feed.mjs'

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

async function getAlerts() {
  if (cachedFeed && Date.now() - cachedAt < cacheDuration) return cachedFeed
  if (pendingRequest) return pendingRequest

  pendingRequest = fetchAlertsFeed()
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
      sendJson(request, response, 502, { error: 'Не вдалося отримати дані джерела тривог.' })
    }
    return
  }

  sendJson(request, response, 404, { error: 'Not found' })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Alert API listening on port ${port}`)
})