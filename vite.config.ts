import react from '@vitejs/plugin-react'
import { fetchAlertsFeed, type AlertFeed } from './server/alerts-feed.mjs'
import { defineConfig, loadEnv, type Plugin } from 'vite'

function officialAlertsFeed(apiToken: string): Plugin {
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
            pendingRequest = fetchAlertsFeed(apiToken)
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: process.env.BASE_PATH ?? '/',
    plugins: [react(), officialAlertsFeed(env.ALERTS_IN_UA_TOKEN ?? '')],
  }
})
