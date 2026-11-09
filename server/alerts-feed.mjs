import { formatDuration, formatStartedAt, neptunAlertsUrl, normalizeNeptunFeed } from '../shared/neptun-alerts.mjs'

const activeAlertsUrl = 'https://api.alerts.in.ua/v1/alerts/active.json'
const neptunUserAgent = 'alert-ukraine-map/1.0 (informational air-alert map)'

const alertTypeLabels = {
  air_raid: 'Повітряна тривога',
  artillery_shelling: 'Загроза артобстрілу',
  urban_fights: 'Вуличні бої',
  chemical: 'Хімічна загроза',
  nuclear: 'Радіаційна небезпека',
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

async function fetchNeptunAlerts() {
  const response = await fetch(neptunAlertsUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': neptunUserAgent,
    },
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) throw new Error(`neptun.in.ua returned HTTP ${response.status}`)

  return normalizeNeptunFeed(await response.json())
}

export function fetchAlertsFeed(token = process.env.ALERTS_IN_UA_TOKEN) {
  const trimmedToken = token?.trim()
  return trimmedToken ? fetchAlertsInUa(trimmedToken) : fetchNeptunAlerts()
}
