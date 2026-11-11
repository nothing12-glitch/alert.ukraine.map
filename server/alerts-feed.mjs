import { oblastByRegionId } from '../shared/ukraine-alarm-regions.mjs'
import {
  normalizeUkraineAlarmFeed,
  ukraineAlarmAlertsUrl,
  ukraineAlarmSource,
} from '../shared/ukraine-alarm-alerts.mjs'

const requestTimeout = 12_000

// UkraineAlarm віддає один запит на хвилину на ключ, тож частіше питати немає сенсу.
export const feedCacheMs = 60_000

// Джерело могло «з'їсти» ліміт або на хвилину бути недоступним — віддаємо останні свіжі дані замість помилки.
const staleFeedCacheMs = 10 * 60_000

const oblastIndex = new Map(Object.entries(oblastByRegionId))

let cachedFeed = null
let cachedAt = 0
let pendingRequest = null

export async function fetchAlertsFeed(token = process.env.UKRAINE_ALARM_TOKEN) {
  const trimmedToken = token?.trim()
  if (!trimmedToken) throw new Error('UKRAINE_ALARM_TOKEN is not configured')

  const response = await fetch(ukraineAlarmAlertsUrl, {
    headers: {
      Accept: 'application/json',
      authorization: trimmedToken,
    },
    signal: AbortSignal.timeout(requestTimeout),
  })

  if (!response.ok) throw new Error(`${ukraineAlarmSource} returned HTTP ${response.status}`)

  return normalizeUkraineAlarmFeed(await response.json(), oblastIndex)
}

export function getAlertsFeed(token = process.env.UKRAINE_ALARM_TOKEN) {
  if (cachedFeed && Date.now() - cachedAt < feedCacheMs) return Promise.resolve(cachedFeed)
  if (pendingRequest) return pendingRequest

  pendingRequest = fetchAlertsFeed(token)
    .then((feed) => {
      cachedFeed = feed
      cachedAt = Date.now()
      return feed
    })
    .catch((error) => {
      if (cachedFeed && Date.now() - cachedAt < staleFeedCacheMs) return cachedFeed
      throw error
    })
    .finally(() => {
      pendingRequest = null
    })

  return pendingRequest
}
