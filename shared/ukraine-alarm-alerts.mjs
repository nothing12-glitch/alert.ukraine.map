export const ukraineAlarmRegionsUrl = 'https://api.ukrainealarm.com/api/v3/regions'
export const ukraineAlarmAlertsUrl = 'https://api.ukrainealarm.com/api/v3/alerts'
export const ukraineAlarmSource = 'api.ukrainealarm.com'

const alertTypeLabels = {
  AIR: 'Повітряна тривога',
  ARTILLERY: 'Загроза артобстрілу',
  URBAN_FIGHTS: 'Вуличні бої',
  CHEMICAL: 'Хімічна загроза',
  NUCLEAR: 'Радіаційна небезпека',
}

const fallbackAlertTypeLabel = 'Інша загроза'

// Джерело тримає два міста-«області» окремо від своїх областей та тестовий регіон для розробників.
const oblastAliases = {
  'м. Запоріжжя та Запорізька територіальна громада': 'Запорізька область',
  'м. Харків та Харківська територіальна громада': 'Харківська область',
  'Тестовий регіон': '',
}

// Міста-«області» на нашій мапі фарбують лише частину області, а не всю область.
const cityScopeAliases = {
  'м. Запоріжжя та Запорізька територіальна громада': 'м. Запоріжжя',
  'м. Харків та Харківська територіальна громада': 'м. Харків',
}

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

export function buildOblastIndex(payload) {
  const index = new Map()
  const visit = (regions, oblast) => {
    for (const region of regions ?? []) {
      const id = String(region.regionId ?? '')
      if (!id) continue
      index.set(id, oblast)
      visit(region.regionChildIds, oblast)
    }
  }

  for (const state of payload?.states ?? []) {
    const oblast = oblastAliases[state.regionName] ?? state.regionName
    if (!oblast) continue
    index.set(String(state.regionId ?? ''), oblast)
    visit(state.regionChildIds, oblast)
  }

  return index
}

function worstLevel(current, next) {
  return current === 'red' || next === 'red' ? 'red' : 'yellow'
}

function summarizeAlertLevels(levels) {
  let alertLevel = 'red'
  let startedAtIso = ''

  for (const level of levels ?? []) {
    if (String(level.alertLevel ?? '').toLowerCase() !== 'yellow') alertLevel = 'red'
    const createdAt = String(level.createdAt ?? '')
    if (createdAt && (!startedAtIso || new Date(createdAt) < new Date(startedAtIso))) startedAtIso = createdAt
  }

  return { alertLevel, startedAtIso }
}

export function normalizeUkraineAlarmFeed(payload, oblastIndex, fetchedAt = new Date().toISOString()) {
  const rows = Array.isArray(payload) ? payload : []
  const alertsByKey = new Map()

  for (const row of rows) {
    const location = String(row.regionName ?? '').trim()
    if (!location) continue

    const isCityState = row.regionType === 'State' && cityScopeAliases[location]
    const scope = row.regionType === 'State' && !isCityState ? 'oblast' : 'raion'
    const region = oblastIndex.get(String(row.regionId ?? ''))
    if (!region) continue

    for (const rawAlert of row.activeAlerts ?? []) {
      const type = alertTypeLabels[String(rawAlert.type ?? '')] ?? fallbackAlertTypeLabel
      const { alertLevel, startedAtIso } = summarizeAlertLevels(rawAlert.activeAlertLevels)
      const startedAt = startedAtIso || String(rawAlert.lastUpdate ?? '')

      const alert = {
        location: cityScopeAliases[location] ?? location,
        region,
        scope,
        type,
        startedAt: formatStartedAt(startedAt),
        startedAtIso: startedAt,
        duration: startedAt ? formatDuration(startedAt) : '',
        alertLevel,
      }

      const key = `${scope}|${region.toLocaleLowerCase('uk')}|${alert.location.toLocaleLowerCase('uk')}|${type}`
      const known = alertsByKey.get(key)
      if (!known || (known.alertLevel === 'yellow' && alert.alertLevel === 'red')) alertsByKey.set(key, alert)
    }
  }

  return {
    source: ukraineAlarmSource,
    fetchedAt,
    alerts: [...alertsByKey.values()],
  }
}
