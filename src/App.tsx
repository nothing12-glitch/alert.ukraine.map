import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  CircleCheck,
  Clock3,
  Copy,
  Download,
  History,
  Layers,
  MapPinned,
  Maximize2,
  Moon,
  RadioTower,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  Sun,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'
import ukraineMap from '@svg-maps/ukraine'
import UkraineMap from './UkraineMap'
import {
  alertTypeLabel,
  districtWord,
  formatClock,
  formatDateTime,
  formatDuration,
  languageOptions,
  regionTitle,
  regionWord,
  translate,
  type Language,
  type MessageKey,
} from './i18n'
import { useI18n } from './i18n-context'
import type { AlertState, ThreatLevel } from './map-types'
import './App.css'

type ConnectionState = 'loading' | 'live' | 'error'
type SvgLocation = { id: string; name: string; path: string }
type Region = SvgLocation & { title: string; reportTitle: string }
type AlertScope = 'oblast' | 'raion'
type OfficialAlert = {
  location: string
  region: string
  scope?: AlertScope
  type: string
  startedAt: string
  startedAtIso: string
  duration: string
  alertLevel?: string
}
type AlertFeed = { source: string; fetchedAt: string; alerts: OfficialAlert[] }
type TypeFilter = 'all' | 'air' | 'other'
type RegionFilter = 'all' | 'active' | 'favorite'
type UpdateMode = 'poll' | 'live'
type Theme = 'light' | 'dark'
type ActivityEvent = { id: string; action: 'new' | 'ended'; alert: OfficialAlert; at: string }
type ToastEvent = { id: string; action: 'new' | 'ended'; alert: OfficialAlert }

const apiBaseUrl = (import.meta.env.VITE_ALERTS_API_URL ?? '').replace(/\/$/, '')
// Без власного бекенду мапа читає знімок, який опублікує workflow у гілці feed.
const staticFeedUrl = (import.meta.env.VITE_ALERTS_FEED_URL ?? '').trim() ||
  'https://raw.githubusercontent.com/nothing12-glitch/alert.ukraine.map/feed/alerts.json'
const useProxyFeed = import.meta.env.DEV || Boolean(apiBaseUrl)

// Знімок мав би свіжати кожні 5 хвилин; понад чверть години без оновлення — вже підозріло.
const staleAfterMs = 15 * 60_000

// Знімок у гілці feed публікують раз на 5 хвилин, тому міняємо лише відро кешу CDN.
function feedRequestUrl() {
  if (useProxyFeed) return `${apiBaseUrl}/api/alerts`
  return `${staticFeedUrl}?bucket=${Math.floor(Date.now() / 300_000)}`
}

const regionMetadata: Record<string, { title: string; reportTitle: string }> = {
  cherkasy: { title: 'Черкаська область', reportTitle: 'Черкаська область' },
  chernihiv: { title: 'Чернігівська область', reportTitle: 'Чернігівська область' },
  chernivtsi: { title: 'Чернівецька область', reportTitle: 'Чернівецька область' },
  crimea: { title: 'Автономна Республіка Крим', reportTitle: 'Автономна Республіка Крим' },
  dnipropetrovsk: { title: 'Дніпропетровська область', reportTitle: 'Дніпропетровська область' },
  donetsk: { title: 'Донецька область', reportTitle: 'Донецька область' },
  'ivano-frankivsk': { title: 'Івано-Франківська область', reportTitle: 'Івано-Франківська область' },
  kharkiv: { title: 'Харківська область', reportTitle: 'Харківська область' },
  kherson: { title: 'Херсонська область', reportTitle: 'Херсонська область' },
  khmelnytskyi: { title: 'Хмельницька область', reportTitle: 'Хмельницька область' },
  kirovohrad: { title: 'Кіровоградська область', reportTitle: 'Кіровоградська область' },
  kyiv: { title: 'Київська область', reportTitle: 'Київська область' },
  'kyiv-city': { title: 'м. Київ', reportTitle: 'м. Київ' },
  luhansk: { title: 'Луганська область', reportTitle: 'Луганська область' },
  lviv: { title: 'Львівська область', reportTitle: 'Львівська область' },
  mykolaiv: { title: 'Миколаївська область', reportTitle: 'Миколаївська область' },
  odessa: { title: 'Одеська область', reportTitle: 'Одеська область' },
  poltava: { title: 'Полтавська область', reportTitle: 'Полтавська область' },
  rivne: { title: 'Рівненська область', reportTitle: 'Рівненська область' },
  sumy: { title: 'Сумська область', reportTitle: 'Сумська область' },
  ternopil: { title: 'Тернопільська область', reportTitle: 'Тернопільська область' },
  vinnytsia: { title: 'Вінницька область', reportTitle: 'Вінницька область' },
  volyn: { title: 'Волинська область', reportTitle: 'Волинська область' },
  zakarpattia: { title: 'Закарпатська область', reportTitle: 'Закарпатська область' },
  zaporizhia: { title: 'Запорізька область', reportTitle: 'Запорізька область' },
  zhytomyr: { title: 'Житомирська область', reportTitle: 'Житомирська область' },
}

const regions: Region[] = (ukraineMap.locations as SvgLocation[]).map((location) => ({
  ...location,
  ...(regionMetadata[location.id] ?? { title: location.name, reportTitle: location.name }),
}))

const statusKeys: Record<AlertState, MessageKey> = {
  active: 'status.active',
  partial: 'status.partial',
  nominal: 'status.nominal',
  clear: 'status.clear',
  unknown: 'status.unknown',
}

const levelKeys: Record<ThreatLevel, MessageKey> = {
  red: 'level.red',
  yellow: 'level.yellow',
}

const statusOrder: Record<AlertState, number> = {
  active: 0,
  partial: 1,
  nominal: 2,
  clear: 3,
  unknown: 4,
}

const CLEARED_NOTICE_MS = 5 * 60_000

function normalizeLocation(value: string) {
  return value.trim().toLocaleLowerCase('uk').replaceAll('’', "'").replace(/\s+/g, ' ')
}

// Джерело може не передати рівень; тоді рахуємо червоним — недооцінка небезпеки гірша за переоцінку.
function getAlertLevel(alert: OfficialAlert): ThreatLevel {
  return alert.alertLevel?.toLowerCase() === 'yellow' ? 'yellow' : 'red'
}

function getAlertScope(alert: OfficialAlert): AlertScope {
  if (alert.scope) return alert.scope
  return normalizeLocation(alert.location) === normalizeLocation(alert.region) ? 'oblast' : 'raion'
}

function worstLevel(current: ThreatLevel | undefined, next: ThreatLevel): ThreatLevel {
  return current === 'red' || next === 'red' ? 'red' : 'yellow'
}

type RegionSummary = {
  wholeLevel?: ThreatLevel
  partialLevel?: ThreatLevel
  nominal: boolean
  raions: OfficialAlert[]
}

function summarizeRegions(alerts: OfficialAlert[]) {
  const summaries: Record<string, RegionSummary> = {}

  for (const alert of alerts) {
    const regionId = getAlertRegionId(alert)
    if (!regionId) continue

    const summary = (summaries[regionId] ??= { nominal: false, raions: [] })
    const level = getAlertLevel(alert)

    if (getAlertScope(alert) === 'raion') {
      summary.partialLevel = worstLevel(summary.partialLevel, level)
      summary.raions.push(alert)
    } else if (isStandingOccupiedAlert(alert)) {
      summary.nominal = true
    } else {
      summary.wholeLevel = worstLevel(summary.wholeLevel, level)
    }
  }

  return summaries
}

function getAlertKey(alert: OfficialAlert) {
  return `${normalizeLocation(alert.location)}|${normalizeLocation(alert.type)}|${normalizeLocation(alert.alertLevel ?? '')}`
}

function isStandingOccupiedAlert(alert: OfficialAlert) {
  const location = normalizeLocation(alert.region || alert.location)
  const isOccupiedArea = location === normalizeLocation('Луганська область')
    || location === normalizeLocation('Автономна Республіка Крим')
  const startedAt = new Date(alert.startedAtIso).getTime()
  const durationHours = Number.isFinite(startedAt) ? (Date.now() - startedAt) / 3_600_000 : 0
  // Жива тривога рідко тримається довше кількох годин; уся довшана позначка — це статус окупації.
  return isOccupiedArea && durationHours >= 6
}

function isAirAlert(alert: OfficialAlert) {
  return normalizeLocation(alert.type).includes('повітряна тривога')
}

const regionIdByLocation = new Map<string, string>(
  regions.flatMap((region): [string, string][] => [
    [normalizeLocation(region.title), region.id],
    [normalizeLocation(region.reportTitle), region.id],
  ]),
)

function getAlertRegionId(alert: OfficialAlert) {
  return regionIdByLocation.get(normalizeLocation(alert.region || alert.location))
    ?? regionIdByLocation.get(normalizeLocation(alert.location))
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) as T : fallback
  } catch {
    return fallback
  }
}

function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

let alertAudioContext: AudioContext | null = null

function playAlertTone() {
  try {
    alertAudioContext ??= new AudioContext()
    const context = alertAudioContext
    if (context.state === 'suspended') void context.resume()

    for (const [index, frequency] of [880, 660].entries()) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const from = context.currentTime + index * 0.2

      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, from)
      gain.gain.exponentialRampToValueAtTime(0.12, from + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, from + 0.17)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(from)
      oscillator.stop(from + 0.18)
    }
  } catch {
    return
  }
}

function vibrateDevice(pattern: number[]) {
  const vibrate = (navigator as Navigator & { vibrate?: (pattern: number[]) => boolean }).vibrate
  vibrate?.call(navigator, pattern)
}

function notifyAboutThreats(alerts: OfficialAlert[], soundEnabled: boolean, notificationsEnabled: boolean, lang: Language) {
  if (soundEnabled) {
    playAlertTone()
    vibrateDevice([200, 90, 200])
  }

  if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return

  const locationLabel = (alert: OfficialAlert) => {
    const regionId = getAlertRegionId(alert)
    return regionId
      ? regionTitle(lang, regionId, regions.find((region) => region.id === regionId)?.title ?? alert.location)
      : alert.location
  }
  const levelLabel = (alert: OfficialAlert) => `${translate(lang, getAlertLevel(alert) === 'yellow' ? 'levelWord.yellow' : 'levelWord.red')} ${translate(lang, 'level.word')}`

  const [first, ...rest] = alerts
  const summary = translate(lang, 'notify.summary', {
    location: locationLabel(first),
    type: alertTypeLabel(lang, first.type),
    level: levelLabel(first),
  })
  new Notification(rest.length ? translate(lang, 'notify.newCount', { count: alerts.length }) : translate(lang, 'notify.threat', { location: locationLabel(first) }), {
    body: rest.length ? `${summary}\n${translate(lang, 'notify.more', { count: rest.length })}` : summary,
    tag: 'alert-map-new-threats',
  })
}

function readInitialRegion() {
  const regionId = new URLSearchParams(window.location.search).get('region')
  return regionId && regions.some((region) => region.id === regionId) ? regionId : null
}

function readInitialTheme(): Theme {
  const fromUrl = new URLSearchParams(window.location.search).get('theme')
  if (fromUrl === 'light' || fromUrl === 'dark') return fromUrl
  const stored = readStored<Theme | null>('alert-map-theme', null)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const { lang, setLang, t } = useI18n()
  const [alerts, setAlerts] = useState<OfficialAlert[]>([])
  const [feedSource, setFeedSource] = useState('')
  const [connection, setConnection] = useState<ConnectionState>('loading')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [isFresh, setIsFresh] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(readInitialRegion)
  const [focusRequest, setFocusRequest] = useState<{ regionId: string; token: number } | null>(null)
  const [theme, setTheme] = useState<Theme>(readInitialTheme)
  const [toast, setToast] = useState<{ id: string; events: ToastEvent[] } | null>(null)
  const [clearedAt, setClearedAt] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState(false)
  const [tickAt, setTickAt] = useState(() => Date.now())
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all')
  const [updateMode, setUpdateMode] = useState<UpdateMode>(() => (
    readStored<UpdateMode>('alert-map-update-mode-v2', 'poll') === 'live' ? 'live' : 'poll'
  ))
  const [favorites, setFavorites] = useState<string[]>(() => readStored('alert-map-favorites', []))
  const [activityHistory, setActivityHistory] = useState<ActivityEvent[]>(() => readStored('alert-map-history', []))
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => readStored('alert-map-notifications', false) && 'Notification' in window && Notification.permission === 'granted',
  )
  const [notifyFavoritesOnly, setNotifyFavoritesOnly] = useState(() => readStored('alert-map-notify-favorites-only', false))
  const [notifySound, setNotifySound] = useState(() => readStored('alert-map-notify-sound', true))
  const previousAlerts = useRef<Map<string, OfficialAlert> | null>(null)
  const previousStatuses = useRef<Record<string, AlertState> | null>(null)
  const notifySettings = useRef({ favoritesOnly: notifyFavoritesOnly, sound: notifySound, favorites, lang })

  useEffect(() => {
    notifySettings.current = { favoritesOnly: notifyFavoritesOnly, sound: notifySound, favorites, lang }
  }, [notifyFavoritesOnly, notifySound, favorites, lang])

  useEffect(() => {
    document.title = t('app.title')
  }, [t])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    writeStored('alert-map-theme', theme)
  }, [theme])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (selectedId) params.set('region', selectedId)
    else params.delete('region')
    params.set('lang', lang)
    params.set('theme', theme)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }, [selectedId, lang, theme])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 9000)
    return () => window.clearTimeout(timer)
  }, [toast])

  // Тривалість тривог показуємо від часу джерела, тож перемальовуємо її періодично.
  useEffect(() => {
    const timer = window.setInterval(() => setTickAt(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const applyFeed = useCallback((feed: AlertFeed) => {
    // Показуємо лише області, які є на мапі: Seвастополь та інші окремі міста сюди не входять.
    const feedAlerts = feed.alerts.filter((alert) => getAlertRegionId(alert) !== undefined)
    const currentAlerts = new Map(feedAlerts.map((alert) => [getAlertKey(alert), alert]))
    const currentKeys = new Set(currentAlerts.keys())
    const previous = previousAlerts.current

    if (previous) {
      const newAlerts = feedAlerts.filter((alert) => !previous.has(getAlertKey(alert)))
      const endedAlerts = [...previous.values()].filter((alert) => !currentKeys.has(getAlertKey(alert)))
      const now = new Date().toISOString()
      const events: ActivityEvent[] = [
        ...newAlerts.map((alert, index) => ({ id: `new-${now}-${index}`, action: 'new' as const, alert, at: now })),
        ...endedAlerts.map((alert, index) => ({ id: `ended-${now}-${index}`, action: 'ended' as const, alert, at: now })),
      ]

      if (events.length) {
        setActivityHistory((current) => [...events, ...current].slice(0, 40))
        setToast({ id: now, events: events.slice(0, 4) })
      }

      const { favoritesOnly, sound, favorites: favoriteIds, lang: notificationLang } = notifySettings.current
      const threats = newAlerts.filter((alert) => !isStandingOccupiedAlert(alert))
      const scopedThreats = favoritesOnly
        ? threats.filter((alert) => {
            const regionId = getAlertRegionId(alert)
            return regionId !== undefined && favoriteIds.includes(regionId)
          })
        : threats

      if (scopedThreats.length) notifyAboutThreats(scopedThreats, sound, notificationsEnabled, notificationLang)
    }

    previousAlerts.current = currentAlerts
    setAlerts(feedAlerts)
    setFeedSource(feed.source)
    setUpdatedAt(new Date(feed.fetchedAt))
    setIsFresh(Date.now() - new Date(feed.fetchedAt).getTime() < staleAfterMs)
    setConnection('live')
  }, [notificationsEnabled])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)

    try {
      const response = await fetch(feedRequestUrl(), {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const feed = await response.json() as AlertFeed
      if (!Array.isArray(feed.alerts) || !feed.fetchedAt) throw new Error('Некоректна відповідь джерела.')
      applyFeed(feed)
    } catch {
      setConnection('error')
    } finally {
      setIsRefreshing(false)
    }
  }, [applyFeed])

  // Через знімок дані змінюються раз на 5 хвилин, а через бекенд — раз на хвилину;
  // хвилинний інтервал підходить обом шляхам і не впирається в ліміт джерела.
  useEffect(() => {
    if (updateMode !== 'poll') return

    const initialRefresh = window.setTimeout(() => void refresh(), 0)
    const intervalId = window.setInterval(() => void refresh(), 60_000)
    return () => {
      window.clearTimeout(initialRefresh)
      window.clearInterval(intervalId)
    }
  }, [refresh, updateMode])

  useEffect(() => writeStored('alert-map-favorites', favorites), [favorites])
  useEffect(() => writeStored('alert-map-history', activityHistory), [activityHistory])
  useEffect(() => writeStored('alert-map-notifications', notificationsEnabled), [notificationsEnabled])
  useEffect(() => writeStored('alert-map-notify-favorites-only', notifyFavoritesOnly), [notifyFavoritesOnly])
  useEffect(() => writeStored('alert-map-notify-sound', notifySound), [notifySound])
  useEffect(() => writeStored('alert-map-update-mode-v2', updateMode), [updateMode])

  const typeFilteredAlerts = alerts.filter((alert) => {
    if (typeFilter === 'air') return isAirAlert(alert)
    if (typeFilter === 'other') return !isAirAlert(alert)
    return true
  })
  const summaries = updatedAt ? summarizeRegions(typeFilteredAlerts) : {}
  const statuses = Object.fromEntries(
    regions.map((region): [string, AlertState] => {
      if (!updatedAt) return [region.id, 'unknown']
      const summary = summaries[region.id]
      const state: AlertState = summary?.wholeLevel
        ? 'active'
        : summary?.partialLevel
          ? 'partial'
          : summary?.nominal
            ? 'nominal'
            : 'clear'
      return [region.id, state]
    }),
  ) as Record<string, AlertState>
  const regionLevels = Object.fromEntries(
    regions.flatMap((region): [string, ThreatLevel][] => {
      const summary = summaries[region.id]
      if (!summary) return []
      const level = summary.wholeLevel && summary.partialLevel
        ? worstLevel(summary.wholeLevel, summary.partialLevel)
        : summary.wholeLevel ?? summary.partialLevel
      return level ? [[region.id, level]] : []
    }),
  ) as Record<string, ThreatLevel>
  const partialCounts = Object.fromEntries(
    regions.flatMap((region): [string, number][] => {
      const count = summaries[region.id]?.raions.length ?? 0
      return count ? [[region.id, count]] : []
    }),
  ) as Record<string, number>
  // «Відбій» тримаємо деякий час після зняття тривоги: так видно, що область щойно
  // відійшла, а не просто не має даних.
  useEffect(() => {
    const previous = previousStatuses.current
    previousStatuses.current = statuses
    if (!previous) return
    const ended = regions.filter((region) =>
      (previous[region.id] === 'active' || previous[region.id] === 'partial') && statuses[region.id] === 'clear')
    const realerted = regions.filter((region) => previous[region.id] !== statuses[region.id] && statuses[region.id] !== 'clear')
    if (!ended.length && !realerted.length) return
    const stamp = Date.now()
    setClearedAt((current) => {
      const next = { ...current }
      for (const region of realerted) delete next[region.id]
      for (const region of ended) next[region.id] = stamp
      return next
    })
  }, [statuses])

  const clearedIds = new Set(
    regions
      .filter((region) => statuses[region.id] === 'clear' && tickAt - (clearedAt[region.id] ?? 0) < CLEARED_NOTICE_MS)
      .map((region) => region.id),
  )
  const visualStateOf = (regionId: string) => (clearedIds.has(regionId) ? 'cleared' : statuses[regionId] ?? 'unknown')
  const regionLabels = Object.fromEntries(
    regions.map((region) => {
      const state = statuses[region.id] ?? 'unknown'
      const level = regionLevels[region.id]
      const count = partialCounts[region.id]
      const label = state === 'active' && level
        ? t(levelKeys[level])
        : state === 'partial' && count
          ? `${t('status.partial')} · ${count}`
          : clearedIds.has(region.id)
            ? t('status.cleared')
            : t(statusKeys[state])
      return [region.id, label]
    }),
  ) as Record<string, string>
  const standingAlertCount = typeFilteredAlerts.filter(isStandingOccupiedAlert).length
  const raionAlertCount = typeFilteredAlerts.filter((alert) => getAlertScope(alert) === 'raion').length
  const activeCount = regions.filter((region) => statuses[region.id] === 'active' || statuses[region.id] === 'partial').length
  const redCount = Object.values(regionLevels).filter((level) => level === 'red').length
  const partialRegionCount = Object.keys(partialCounts).length
  const airAlertCount = typeFilteredAlerts.filter(isAirAlert).length
  const otherThreatCount = typeFilteredAlerts.length - airAlertCount
  const selectedRegion = regions.find((region) => region.id === selectedId)
  const selectedAlerts = selectedRegion
    ? typeFilteredAlerts.filter((alert) => getAlertRegionId(alert) === selectedRegion.id && getAlertScope(alert) === 'oblast')
    : []
  const selectedRaions = selectedRegion ? summaries[selectedRegion.id]?.raions ?? [] : []
  const sourceUrl = 'https://map.ukrainealarm.com/'
  const displayTitle = useCallback((region: Region) => regionTitle(lang, region.id, region.title), [lang])
  const mapRegions = useMemo(
    () => regions.map((region) => ({ ...region, title: regionTitle(lang, region.id, region.title) })),
    [lang],
  )
  const displayAlertLocation = useCallback((alert: OfficialAlert) => {
    const regionId = getAlertRegionId(alert)
    const region = regionId ? regions.find((item) => item.id === regionId) : undefined
    return region ? regionTitle(lang, region.id, region.title) : alert.location
  }, [lang])
  const visibleRegions = [...regions]
    .filter((region) => {
      const state = statuses[region.id] ?? 'unknown'
      const matchesSearch = displayTitle(region).toLocaleLowerCase(lang).includes(search.trim().toLocaleLowerCase(lang))
        || region.title.toLocaleLowerCase('uk').includes(search.trim().toLocaleLowerCase('uk'))
      const matchesStatus = regionFilter !== 'active' || state === 'active' || state === 'partial'
      const matchesFavorite = regionFilter !== 'favorite' || favorites.includes(region.id)
      return matchesSearch && matchesStatus && matchesFavorite
    })
    .sort((left, right) => {
      const leftStatus = statuses[left.id] ?? 'unknown'
      const rightStatus = statuses[right.id] ?? 'unknown'
      const leftRank = regionLevels[left.id] === 'yellow' ? 1 : 0
      const rightRank = regionLevels[right.id] === 'yellow' ? 1 : 0
      return statusOrder[leftStatus] - statusOrder[rightStatus] || leftRank - rightRank || displayTitle(left).localeCompare(displayTitle(right), lang)
    })

  const usingOfficialLive = updateMode === 'live'
  const feedReady = connection === 'live'

  const showThreatBanner = !usingOfficialLive && feedReady && activeCount > 0
  const wholeRedCount = regions.filter((region) => summaries[region.id]?.wholeLevel === 'red').length
  const wholeYellowCount = regions.filter((region) => summaries[region.id]?.wholeLevel === 'yellow').length
  const headline = usingOfficialLive
    ? t('headline.official')
    : connection === 'loading'
      ? t('headline.syncing')
      : connection === 'error'
        ? updatedAt ? t('headline.noConnection') : t('headline.fetchFailed')
        : activeCount > 0
          ? wholeRedCount
            ? t('headline.red', { count: wholeRedCount, regions: regionWord(lang, wholeRedCount, 'locative') })
            : wholeYellowCount
              ? t('headline.yellow', { count: wholeYellowCount, regions: regionWord(lang, wholeYellowCount, 'locative') })
              : t('headline.partial', { count: activeCount, regions: regionWord(lang, activeCount, 'locative') })
          : t('headline.none')

  const toggleFavorite = (regionId: string) => {
    setFavorites((current) => current.includes(regionId)
      ? current.filter((id) => id !== regionId)
      : [...current, regionId])
  }

  const focusRegion = (regionId: string) => {
    setSelectedId(regionId)
    setFocusRequest({ regionId, token: Date.now() })
  }

  const copySummary = async (region?: Region) => {
    const scopedRegions = region
      ? [region]
      : regions.filter((item) => statuses[item.id] === 'active' || statuses[item.id] === 'partial')
    const lines = [t('app.title')]

    if (!scopedRegions.length) lines.push(t('headline.none'))
    for (const item of scopedRegions) {
      const parts = [displayTitle(item), regionLabels[item.id]]
      if (statuses[item.id] === 'partial') {
        const districts = (summaries[item.id]?.raions ?? []).map((alert) => alert.location)
        if (districts.length) {
          parts.push(`${districts.slice(0, 6).join(', ')}${districts.length > 6 ? ` +${districts.length - 6}` : ''}`)
        }
      }
      lines.push(`• ${parts.join(' · ')}`)
    }
    lines.push('', window.location.href)

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Без Clipboard API залишається ручне копіювання зі списку.
    }
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = Boolean(target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable))
      if (event.key === 'Escape') {
        if (isTyping) {
          target?.blur()
          setSearch('')
        } else {
          setSelectedId(null)
        }
        return
      }
      if (isTyping) return
      if (event.key === '/') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false)
      return
    }

    if (!('Notification' in window)) return
    const permission = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission
    setNotificationsEnabled(permission === 'granted')
  }

  const exportAlerts = () => {
    const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`
    const rows = [
      [t('csv.location'), t('csv.threat'), t('csv.level'), t('csv.started'), t('csv.duration')],
      ...typeFilteredAlerts.map((alert) => [
        displayAlertLocation(alert),
        alertTypeLabel(lang, alert.type),
        translate(lang, getAlertLevel(alert) === 'yellow' ? 'levelWord.yellow' : 'levelWord.red'),
        formatDateTime(lang, alert.startedAtIso),
        formatDuration(lang, alert.startedAtIso),
      ]),
    ]
    const csv = rows.map((row) => row.map(escapeCell).join(';')).join('\r\n')
    const link = document.createElement('a')
    const exportUrl = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }))
    link.href = exportUrl
    link.download = `povitryani-zagrozy-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(exportUrl), 1000)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-main">
          <a className="brand" href="#top" aria-label={t('brand.aria')}>
            <span className="brand-mark"><RadioTower size={20} strokeWidth={2.2} /></span>
            <span className="brand-copy">
              <strong>{t('brand.title')}</strong>
              <span>{t('brand.subtitle')}</span>
            </span>
          </a>
          <nav className="lang-switch" aria-label={t('lang.aria')}>
            {languageOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                className={lang === option.code ? 'lang-active' : ''}
                aria-pressed={lang === option.code}
                title={option.name}
                lang={option.code}
                onClick={() => setLang(option.code)}
              >
                {option.label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
            aria-pressed={theme === 'dark'}
            title={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        <div className="topbar-status" aria-live="polite">
          <span className={`connection-dot connection-${usingOfficialLive ? 'live' : connection === 'error' || !isFresh ? 'error' : connection}`} />
          <span>{usingOfficialLive ? t('conn.official') : !isFresh ? t('conn.stale') : connection === 'live' ? t('conn.polling') : connection === 'error' ? t('conn.offline') : t('conn.connecting')}</span>
        </div>
      </header>

      {toast && (
        <div className="alert-toast" role="status" aria-live="polite">
          <div className="toast-head">
            <Zap size={15} />
            <strong>{t(toast.events[0].action === 'new' ? 'toast.new' : 'toast.ended')}</strong>
            <button type="button" className="toast-dismiss" onClick={() => setToast(null)} aria-label={t('toast.dismiss')}>×</button>
          </div>
          <ul>
            {toast.events.map((event) => (
              <li key={event.id}>
                <i className={event.action === 'new' ? 'event-new' : 'event-ended'} />
                <span>{displayAlertLocation(event.alert)} · {alertTypeLabel(lang, event.alert.type)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className={`alert-banner${showThreatBanner ? ` has-alert level-${redCount ? 'red' : 'yellow'}` : ''}`} aria-live="polite">
        <div className="banner-icon">
          {usingOfficialLive ? <RadioTower size={22} /> : feedReady && activeCount === 0 ? <CircleCheck size={22} /> : <ShieldAlert size={22} />}
        </div>
        <div className="banner-copy">
          <span className="eyebrow">{showThreatBanner ? (redCount ? t('banner.red') : t('banner.yellow')) : t('banner.country')}</span>
          <h1>{headline}</h1>
        </div>
        <div className="banner-meta">
          {partialRegionCount > 0 && (
            <div className="banner-partial" title={t('banner.partialHint')}>
              <Layers size={15} />
              <span>{t('banner.partial', {
                regions: `${partialRegionCount} ${regionWord(lang, partialRegionCount, 'genitive')}`,
                districts: `${raionAlertCount} ${districtWord(lang, raionAlertCount)}`,
              })}</span>
            </div>
          )}
          <div className="sync-time"><Clock3 size={15} /><span>{usingOfficialLive ? t('banner.stream') : updatedAt ? t('banner.received', { time: formatClock(lang, updatedAt.toISOString()) }) : t('banner.waiting')}</span></div>
          <button className="refresh-button" type="button" onClick={() => void refresh()} disabled={isRefreshing || usingOfficialLive} hidden={usingOfficialLive} aria-label={t('banner.refresh')} title={t('banner.refresh')}>
            <RefreshCw size={17} className={isRefreshing ? 'spin' : ''} />
          </button>
        </div>
      </section>

      <div className="update-mode-bar">
        <div className="update-mode-copy">
          <span className="eyebrow">{t('mode.eyebrow')}</span>
          <strong>{usingOfficialLive ? t('mode.official') : useProxyFeed ? t('mode.polling') : t('mode.snapshot')}</strong>
        </div>
        <div className="update-mode-control" role="group" aria-label={t('mode.aria')}>
          <button type="button" className={updateMode === 'poll' ? 'filter-active' : ''} aria-pressed={updateMode === 'poll'} onClick={() => setUpdateMode('poll')} title={t('mode.pollingHint')}>
            <RefreshCw size={14} /> {t('mode.poll')}
          </button>
          <button type="button" className={usingOfficialLive ? 'filter-active' : ''} aria-pressed={usingOfficialLive} onClick={() => setUpdateMode('live')} title={t('mode.liveHint')}>
            <RadioTower size={14} /> {t('mode.live')}
          </button>
        </div>
      </div>

      {!usingOfficialLive && (connection === 'error' || !isFresh) && (
        <div className="stale-notice" role="status">
          <WifiOff size={16} />
          <span>{!updatedAt
            ? t('stale.polling')
            : isFresh
              ? t('stale.withData', { time: formatClock(lang, updatedAt.toISOString()) })
              : t('stale.frozen', { time: formatClock(lang, updatedAt.toISOString()) })}</span>
          <button type="button" onClick={() => void refresh()}>{t('stale.retry')}</button>
        </div>
      )}

      <section className="official-live-view" hidden={updateMode !== 'live'} aria-label={t('live.aria')}>
        <div className="official-live-heading">
          <div>
            <span className="eyebrow">{t('live.eyebrow')}</span>
            <h2>{t('live.title')}</h2>
          </div>
          <a href="https://map.ukrainealarm.com/" target="_blank" rel="noreferrer">{t('live.open')} <ArrowUpRight size={14} /></a>
        </div>
        <iframe
          className="official-live-frame"
          src="https://map.ukrainealarm.com/"
          title={t('live.frame')}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="fullscreen"
        />
      </section>

      <div className={`workspace${usingOfficialLive ? ' is-hidden' : ''}`} id="top">
        <section className="map-section" aria-labelledby="map-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t('map.eyebrow')}</span>
              <h2 id="map-heading">{t('map.title')}</h2>
            </div>
            <div className="map-count"><MapPinned size={16} /><span>{t('regions.count', { count: regions.length, regions: regionWord(lang, regions.length) })}</span></div>
          </div>

          <div className="metric-strip" aria-label={t('map.statsAria')}>
            <div><span>{t('map.current')}</span><strong>{activeCount.toString().padStart(2, '0')}</strong></div>
            <div><span>{t('map.red')}</span><strong>{wholeRedCount.toString().padStart(2, '0')}</strong></div>
            <div className="metric-yellow"><span>{t('map.yellow')}</span><strong>{wholeYellowCount.toString().padStart(2, '0')}</strong></div>
            <div className="metric-partial" title={t('map.partialHint')}><span>{t('map.partial')}</span><strong>{partialRegionCount.toString().padStart(2, '0')}</strong></div>
          </div>

          <div className="type-filter" role="group" aria-label={t('filter.typeAria')}>
            <button type="button" className={typeFilter === 'all' ? 'filter-active' : ''} onClick={() => setTypeFilter('all')}>{t('filter.all')} <span>{typeFilteredAlerts.length}</span></button>
            <button type="button" className={typeFilter === 'air' ? 'filter-active' : ''} onClick={() => setTypeFilter('air')}>{t('filter.air')} <span>{airAlertCount}</span></button>
            <button type="button" className={typeFilter === 'other' ? 'filter-active' : ''} onClick={() => setTypeFilter('other')}>{t('filter.other')} <span>{otherThreatCount}</span></button>
          </div>

          <UkraineMap
            regions={mapRegions}
            statuses={statuses}
            levels={regionLevels}
            partialCounts={partialCounts}
            labels={regionLabels}
            selectedId={selectedId}
            focusRequest={focusRequest}
            onSelect={setSelectedId}
            onFocusRegion={focusRegion}
            viewBox={ukraineMap.viewBox}
          />

          <div className="map-legend" aria-label={t('legend.aria')}>
            <span><i className="legend-dot legend-red" />{t('level.red')}</span>
            <span><i className="legend-dot legend-yellow" />{t('level.yellow')}</span>
            <span><i className="legend-dot legend-partial" />{t('legend.partial')}</span>
            <span><i className="legend-dot legend-nominal" />{t('legend.nominal')}</span>
            <span><i className="legend-dot legend-clear" />{t('legend.clear')}</span>
            {(connection === 'loading' || (connection === 'error' && !updatedAt)) && (
              <span><i className="legend-dot legend-unknown" />{connection === 'loading' ? t('legend.loading') : t('legend.noData')}</span>
            )}
          </div>

          {selectedRegion && (
            <div className="selected-region" aria-live="polite">
              <div className={`selected-indicator state-${visualStateOf(selectedRegion.id)}${regionLevels[selectedRegion.id] ? ` level-${regionLevels[selectedRegion.id]}` : ''}`} />
              <div className="selected-region-copy">
                <strong>{displayTitle(selectedRegion)}</strong>
                <span>{regionLabels[selectedRegion.id]}</span>
                {selectedAlerts.slice(0, 5).map((alert) => (
                  <span key={`${alert.location}-${alert.type}`} className="selected-alert-type">
                    {isStandingOccupiedAlert(alert) ? t('selected.markerPrefix') : ''}
                    {displayAlertLocation(alert)} · {alertTypeLabel(lang, alert.type)} · {translate(lang, getAlertLevel(alert) === 'yellow' ? 'levelWord.yellow' : 'levelWord.red')} {t('level.word')} · {formatDateTime(lang, alert.startedAtIso)} · {formatDuration(lang, alert.startedAtIso)}
                  </span>
                ))}
                {selectedAlerts.length > 5 && (
                  <span className="selected-alert-type">{t('selected.more', { count: selectedAlerts.length - 5 })}</span>
                )}
                {selectedRaions.length > 0 && (
                  <div className="raion-block" title={t('selected.raionsHint')}>
                    <span className="raion-heading">{t('selected.raions', { districts: `${selectedRaions.length} ${districtWord(lang, selectedRaions.length)}` })}</span>
                    <div className="raion-chips">
                      {selectedRaions.slice(0, 12).map((alert) => (
                        <span key={`${alert.location}-${alert.type}`} className={`raion-chip level-${getAlertLevel(alert)}`}>
                          {alert.location}
                        </span>
                      ))}
                      {selectedRaions.length > 12 && (
                        <span className="raion-chip raion-more">+{selectedRaions.length - 12}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="selected-actions">
                <button
                  type="button"
                  className="selected-action"
                  onClick={() => focusRegion(selectedRegion.id)}
                  aria-label={t('selected.zoom')}
                  title={t('selected.zoom')}
                >
                  <Maximize2 size={15} />
                </button>
                <button
                  type="button"
                  className={`selected-action${copied ? ' is-copied' : ''}`}
                  onClick={() => void copySummary(selectedRegion)}
                  aria-label={t('selected.copy')}
                  title={copied ? t('selected.copied') : t('selected.copy')}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
                <button
                  type="button"
                  className={`favorite-button${favorites.includes(selectedRegion.id) ? ' is-favorite' : ''}`}
                  onClick={() => toggleFavorite(selectedRegion.id)}
                  aria-label={favorites.includes(selectedRegion.id) ? t('selected.removeFav') : t('selected.addFav')}
                  title={favorites.includes(selectedRegion.id) ? t('selected.removeFav') : t('selected.addFav')}
                >
                  <Star size={16} fill={favorites.includes(selectedRegion.id) ? 'currentColor' : 'none'} />
                </button>
                <button type="button" className="clear-selection" onClick={() => setSelectedId(null)} aria-label={t('selected.clear')}>×</button>
              </div>
            </div>
          )}

          <div className="map-caveat">
            <Activity size={14} />
            <span>{t('caveat')}</span>
          </div>
        </section>

        <aside className="region-panel" aria-labelledby="regions-heading">
          <div className="region-panel-heading">
            <div>
              <span className="eyebrow">{t('panel.eyebrow')}</span>
              <h2 id="regions-heading">{t('panel.title')}</h2>
            </div>
            <span className="active-counter">{activeCount.toString().padStart(2, '0')} <small>{regionWord(lang, activeCount)}</small></span>
          </div>

          <label className="search-box" title={t('panel.searchHint')}>
            <Search size={16} />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('panel.search')}
              aria-label={t('panel.search')}
              aria-keyshortcuts="/"
            />
            {search && (
              <button type="button" className="search-clear" onClick={() => setSearch('')} aria-label={t('panel.clearSearch')}>
                ×
              </button>
            )}
          </label>

          <div className="region-filters" role="group" aria-label={t('panel.filterAria')}>
            <button type="button" className={regionFilter === 'all' ? 'filter-active' : ''} onClick={() => setRegionFilter('all')}>{t('panel.filterAll')}</button>
            <button type="button" className={regionFilter === 'active' ? 'filter-active' : ''} onClick={() => setRegionFilter('active')}>{t('panel.filterActive')}</button>
            <button type="button" className={regionFilter === 'favorite' ? 'filter-active' : ''} onClick={() => setRegionFilter('favorite')}>{t('panel.favorites')} <span>{favorites.length}</span></button>
          </div>

          <div className="region-actions">
            <button type="button" className={notificationsEnabled ? 'filter-active' : ''} onClick={() => void toggleNotifications()} disabled={!('Notification' in window)} aria-pressed={notificationsEnabled} title={notificationsEnabled ? t('panel.notificationsOnHint') : t('panel.notificationsOffHint')}>
              <Bell size={15} /> <span>{notificationsEnabled ? t('panel.notificationsOn') : t('panel.notifications')}</span>
            </button>
            <button type="button" onClick={exportAlerts} disabled={!typeFilteredAlerts.length} title={t('panel.csvHint')}>
              <Download size={15} /> <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => void copySummary()}
              className={copied ? 'is-copied' : ''}
              title={copied ? t('selected.copied') : t('panel.copySummaryHint')}
              aria-label={t('panel.copySummary')}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />} <span>{t('panel.copySummary')}</span>
            </button>
          </div>

          <p className="panel-shortcuts">{t('panel.shortcuts')}</p>

          <div className="region-actions notify-options" role="group" aria-label={t('panel.notifyAria')}>
            <button
              type="button"
              className={notifyFavoritesOnly ? 'filter-active' : ''}
              aria-pressed={notifyFavoritesOnly}
              onClick={() => setNotifyFavoritesOnly((current) => !current)}
              title={t('panel.favOnlyHint')}
            >
              <Star size={15} /> <span>{t('panel.favOnly', { count: favorites.length })}</span>
            </button>
            <button
              type="button"
              className={notifySound ? 'filter-active' : ''}
              aria-pressed={notifySound}
              onClick={() => setNotifySound((current) => !current)}
              title={t('panel.soundHint')}
            >
              <Bell size={15} /> <span>{t('panel.sound')}</span>
            </button>
          </div>

          {notifyFavoritesOnly && favorites.length === 0 && (
            <p className="notify-hint">{t('panel.notifyHint')}</p>
          )}

          <div className="region-list">
            {visibleRegions.map((region) => {
              const visualState = visualStateOf(region.id)
              const level = regionLevels[region.id]
              return (
                <button
                  key={region.id}
                  className={`region-row${selectedId === region.id ? ' row-selected' : ''}`}
                  type="button"
                  onClick={() => setSelectedId(region.id)}
                >
                  <span className={`row-marker state-${visualState}${level ? ` level-${level}` : ''}`} />
                  <span className="row-name">{displayTitle(region)}</span>
                  <span className={`row-status status-label-${visualState}${level ? ` level-${level}` : ''}`}>{regionLabels[region.id]}</span>
                  <ArrowUpRight size={14} className="row-arrow" />
                </button>
              )
            })}
            {visibleRegions.length === 0 && <p className="empty-results">{t('panel.empty')}</p>}
          </div>

          <div className="region-panel-footer">
            <div className="feed-summary"><span>{standingAlertCount}</span><p>{t('panel.standing', { count: standingAlertCount })}</p></div>
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="source-link">
              <Wifi size={14} /> {t('panel.source', { source: feedSource || 'api.ukrainealarm.com' })} <ArrowUpRight size={13} />
            </a>
          </div>

          <details className="activity-panel">
            <summary><History size={15} /> {t('panel.log')} <span>{activityHistory.length}</span></summary>
            <div className="activity-list">
              {activityHistory.map((event) => (
                <div className="activity-event" key={event.id}>
                  <i className={event.action === 'new' ? 'event-new' : 'event-ended'} />
                  <div>
                    <strong>{event.action === 'new' ? t('panel.logNew') : t('panel.logEnded')}</strong>
                    <span>{displayAlertLocation(event.alert)} · {alertTypeLabel(lang, event.alert.type)}</span>
                    <time>{formatClock(lang, event.at)}</time>
                  </div>
                </div>
              ))}
              {activityHistory.length === 0 && <p>{t('panel.logEmpty')}</p>}
            </div>
          </details>
        </aside>
      </div>

      <footer className="app-footer">
        <p>{t('footer.disclaimer')}</p>
        <span>
          {t('footer.borders')} <a href="https://mapsvg.com/maps/ukraine" target="_blank" rel="noreferrer">MapSVG</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
          {feedSource && <> · {t('footer.data')} <a href={sourceUrl} target="_blank" rel="noreferrer">{t('footer.alarmSource')}</a></>}
        </span>
      </footer>
    </main>
  )
}

export default App
