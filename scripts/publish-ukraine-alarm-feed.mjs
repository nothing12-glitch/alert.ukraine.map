import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { alertsFileName, minuteStamp, snapshotFileName } from '../shared/feed-snapshots.mjs'
import { oblastByRegionId } from '../shared/ukraine-alarm-regions.mjs'
import {
  normalizeUkraineAlarmFeed,
  ukraineAlarmAlertsUrl,
  ukraineAlarmSource,
} from '../shared/ukraine-alarm-alerts.mjs'

const requestTimeoutMs = 15_000
const defaultDirectory = '.feed'

function resolveDirectory() {
  const argument = process.argv.find((entry) => entry.startsWith('--dir='))
  return path.resolve(argument ? argument.slice('--dir='.length) : defaultDirectory)
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
  const directory = resolveDirectory()
  const payload = `${JSON.stringify(feed)}\n`

  await mkdir(directory, { recursive: true })

  // Хвилинний файл — те, що читає браузер: його URL ніколи не переписується.
  // alerts.json лишається резервом на випадок, коли жоден з свіжих знімків недоступний.
  const stamp = minuteStamp(new Date(feed.fetchedAt))
  await Promise.all([
    writeFile(path.join(directory, snapshotFileName(stamp)), payload, 'utf8'),
    writeFile(path.join(directory, alertsFileName), payload, 'utf8'),
  ])

  console.log(`Wrote ${feed.alerts.length} alerts as ${stamp} to ${directory}`)
}

await main()
