import { load } from 'cheerio'

const activeAlertsUrl = 'https://api.alerts.in.ua/v1/alerts/active.json'
const alertTypeLabels = {
  air_raid: 'Повітряна тривога',
  artillery_shelling: 'Загроза артобстрілу',
  urban_fights: 'Вуличні бої',
  chemical: 'Хімічна загроза',
  nuclear: 'Радіаційна небезпека',
}

function formatStartedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return ''

  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Kyiv',
  }).format(date)
}

function formatDuration(startedAt) {
  const startedAtMs = new Date(startedAt).getTime()
  if (!Number.isFinite(startedAtMs)) return ''

  const minutes = Math.max(0, Math.floor((Date.now() - startedAtMs) / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const remainingMinutes = minutes % 60
  const parts = []

  if (days) parts.push(`${days} д`)
  if (hours) parts.push(`${hours} год`)
  if (remainingMinutes || parts.length === 0) parts.push(`${remainingMinutes} хв`)
  return parts.join(' ')
}

function normalizeApiAlert(alert) {
  const location = String(alert.location_title ?? '').trim()
  const region = String(alert.location_oblast ?? '').trim() || location
  const startedAtValue = String(alert.started_at ?? '')

  return {
    location,
    region,
    type: alertTypeLabels[alert.alert_type] ?? String(alert.alert_type ?? 'Інша загроза'),
    startedAt: formatStartedAt(startedAtValue),
    duration: startedAtValue ? formatDuration(startedAtValue) : '',
    alertLevel: String(alert.alert_level ?? ''),
  }
}

async function fetchAlertsInUa(token) {
  const response = await fetch(activeAlertsUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) throw new Error(`alerts.in.ua returned HTTP ${response.status}`)

  const payload = await response.json()
  if (!Array.isArray(payload.alerts)) throw new Error('alerts.in.ua returned an invalid response')

  const alertsByKey = new Map()
  for (const rawAlert of payload.alerts) {
    const alert = normalizeApiAlert(rawAlert)
    if (!alert.location || !alert.type) continue
    const key = `${alert.region.toLocaleLowerCase('uk')}|${alert.location.toLocaleLowerCase('uk')}|${alert.type}`
    if (!alertsByKey.has(key)) alertsByKey.set(key, alert)
  }

  return {
    source: 'alerts.in.ua',
    fetchedAt: new Date().toISOString(),
    alerts: [...alertsByKey.values()],
  }
}

async function fetchPublicMap() {
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
    if (!alertsByKey.has(key)) alertsByKey.set(key, { location, region: location, type, startedAt, duration, alertLevel: '' })
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

export function fetchAlertsFeed(token = process.env.ALERTS_IN_UA_TOKEN) {
  const trimmedToken = token?.trim()
  return trimmedToken ? fetchAlertsInUa(trimmedToken) : fetchPublicMap()
}