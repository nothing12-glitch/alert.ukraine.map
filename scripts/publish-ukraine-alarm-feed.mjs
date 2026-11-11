import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { oblastByRegionId } from '../shared/ukraine-alarm-regions.mjs'
import {
  normalizeUkraineAlarmFeed,
  ukraineAlarmAlertsUrl,
  ukraineAlarmSource,
} from '../shared/ukraine-alarm-alerts.mjs'

const requestTimeoutMs = 15_000
const defaultOutput = '.feed/alerts.json'

function resolveOutputPath() {
  const argument = process.argv.find((entry) => entry.startsWith('--out='))
  return path.resolve(argument ? argument.slice('--out='.length) : defaultOutput)
}

async function main() {
  const token = process.env.UKRAINE_ALARM_TOKEN?.trim()
  if (!token) {
    throw new Error('UKRAINE_ALARM_TOKEN is not set; add it as a repository Actions secret.')
  }

  const response = await fetch(ukraineAlarmAlertsUrl, {
    headers: { Accept: 'application/json', authorization: token },
    signal: AbortSignal.timeout(requestTimeoutMs),
  })

  if (!response.ok) {
    throw new Error(`${ukraineAlarmSource} returned HTTP ${response.status}`)
  }

  const feed = normalizeUkraineAlarmFeed(await response.json(), new Map(Object.entries(oblastByRegionId)))
  const outputPath = resolveOutputPath()

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(feed)}\n`, 'utf8')
  console.log(`Wrote ${feed.alerts.length} alerts to ${outputPath}`)
}

await main()
