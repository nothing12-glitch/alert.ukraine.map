import react from '@vitejs/plugin-react'
import { getAlertsFeed } from './server/alerts-feed.mjs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
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

// Ім'я бандла містить хеш, тому список файлів оболоноки стає відомим лише після збірки.
// Дозволяє сервіс-воркеру попередньо закачати саму мапу ще до першого запиту.
function precacheShellAssets(): Plugin {
  let outDir = 'dist'
  let basePath = '/'

  return {
    name: 'precache-shell-assets',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
      basePath = config.base
    },
    async closeBundle() {
      const html = await readFile(path.join(outDir, 'index.html'), 'utf8')
      const assets = [...html.matchAll(/(?:src|href)="([^"]+?\.(?:js|css))"/g)].map((match) => match[1])
      const swPath = path.join(outDir, 'sw.js')
      const sw = await readFile(swPath, 'utf8')
      await writeFile(swPath, sw.replace('__PRECACHED_ASSETS__', JSON.stringify(assets)), 'utf8')
      console.log(`precache: ${assets.length} файл(ів) оболоноки записано до sw.js (${basePath})`)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: process.env.BASE_PATH ?? '/',
    plugins: [react(), officialAlertsFeed(env.UKRAINE_ALARM_TOKEN ?? ''), precacheShellAssets()],
  }
})
