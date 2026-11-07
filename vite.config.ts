import react from '@vitejs/plugin-react'
import { load } from 'cheerio'
import { defineConfig, type Plugin } from 'vite'

type OfficialAlert = {
  location: string
  type: string
  startedAt: string
  duration: string
}

type AlertFeed = {
  source: string
  fetchedAt: string
  alerts: OfficialAlert[]
}

function officialAlertsFeed(): Plugin {
  let cachedFeed: AlertFeed | null = null
  let cachedAt = 0
  let pendingRequest: Promise<AlertFeed> | null = null

  return {
    name: 'official-alerts-feed',
    configureServer(server) {
      server.middlewares.use('/api/alerts', async (_request, response) => {
        response.setHeader('content-type', 'application/json; charset=utf-8')
        response.setHeader('cache-control', 'no-store')

        try {
          const now = Date.now()
          if (cachedFeed && now - cachedAt < 20_000) {
            response.end(JSON.stringify(cachedFeed))
            return
          }

          if (!pendingRequest) {
            pendingRequest = (async () => {
              const upstream = await fetch('https://map.ukrainealarm.com/', {
                headers: { Accept: 'text/html' },
                signal: AbortSignal.timeout(12_000),
              })

              if (!upstream.ok) throw new Error(`Official map returned HTTP ${upstream.status}`)

              const html = await upstream.text()
              const $ = load(html)
              const alertsByKey = new Map<string, OfficialAlert>()

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
            })()
          }

          const feed = await pendingRequest
          cachedFeed = feed
          cachedAt = Date.now()
          response.end(JSON.stringify(feed))
        } catch {
          response.statusCode = 502
          response.end(JSON.stringify({ error: 'Не вдалося отримати дані офіційної карти.' }))
        } finally {
          pendingRequest = null
        }
      })
    },
  }
}

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), officialAlertsFeed()],
})
