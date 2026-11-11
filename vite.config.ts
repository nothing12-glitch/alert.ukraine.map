import react from '@vitejs/plugin-react'
import { getAlertsFeed } from './server/alerts-feed.mjs'
import { defineConfig, loadEnv, type Plugin } from 'vite'

function officialAlertsFeed(apiToken: string): Plugin {
  return {
    name: 'official-alerts-feed',
    configureServer(server) {
      server.middlewares.use('/api/alerts', async (_request, response) => {
        response.setHeader('content-type', 'application/json; charset=utf-8')
        response.setHeader('cache-control', 'no-store')

        try {
          response.end(JSON.stringify(await getAlertsFeed(apiToken)))
        } catch {
          response.statusCode = 502
          response.end(JSON.stringify({ error: 'Не вдалося отримати дані джерела тривог.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: process.env.BASE_PATH ?? '/',
    plugins: [react(), officialAlertsFeed(env.UKRAINE_ALARM_TOKEN ?? '')],
  }
})
