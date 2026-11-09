export const neptunAlertsUrl = 'https://neptun.in.ua/api/v1/alerts'
export const neptunStreamUrl = 'wss://neptun.in.ua/api/v1/stream'
export const neptunSource = 'neptun.in.ua'

// NEPTUN не передає тип загрози в активних тривогах — це саме повітряні тривоги.
export const neptunAlertType = 'Повітряна тривога'

export function formatStartedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return ''

  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Kyiv',
  }).format(date)
}

export function formatDuration(startedAt) {
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

export function normalizeNeptunAlert(entry) {
  const location = String(entry.name ?? '').trim()
  const region = String(entry.oblast ?? '').trim() || location
  const since = String(entry.since ?? '')

  return {
    location,
    region,
    type: neptunAlertType,
    startedAt: formatStartedAt(since),
    duration: since ? formatDuration(since) : '',
    // Нерозпізнаний рівень показуємо як червоний: недооцінка небезпеки гірша за переоцінку.
    alertLevel: String(entry.level ?? '').trim().toLowerCase() === 'yellow' ? 'yellow' : 'red',
  }
}

export function normalizeNeptunFeed(payload, fetchedAt = new Date().toISOString()) {
  if (!Array.isArray(payload.raions) || !Array.isArray(payload.oblasts)) {
    throw new Error('neptun.in.ua returned an invalid response')
  }

  const alertsByKey = new Map()
  for (const rawAlert of [...payload.raions, ...payload.oblasts]) {
    const alert = normalizeNeptunAlert(rawAlert)
    if (!alert.location) continue

    const key = `${alert.region.toLocaleLowerCase('uk')}|${alert.location.toLocaleLowerCase('uk')}`
    const known = alertsByKey.get(key)
    if (!known || (known.alertLevel === 'yellow' && alert.alertLevel === 'red')) alertsByKey.set(key, alert)
  }

  return {
    source: neptunSource,
    fetchedAt,
    alerts: [...alertsByKey.values()],
  }
}
