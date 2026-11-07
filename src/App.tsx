import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Bell,
  CircleCheck,
  Clock3,
  Download,
  History,
  MapPinned,
  RadioTower,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  Wifi,
  WifiOff,
} from 'lucide-react'
import ukraineMap from '@svg-maps/ukraine'
import './App.css'

type AlertState = 'active' | 'nominal' | 'clear' | 'unknown'
type ConnectionState = 'loading' | 'live' | 'error'
type SvgLocation = { id: string; name: string; path: string }
type Region = SvgLocation & { title: string; reportTitle: string }
type OfficialAlert = { location: string; region: string; type: string; startedAt: string; duration: string; alertLevel?: string }
type AlertFeed = { source: string; fetchedAt: string; alerts: OfficialAlert[] }
type TypeFilter = 'all' | 'air' | 'other'
type RegionFilter = 'all' | 'active' | 'favorite'
type UpdateMode = '20s' | 'live'
type ActivityEvent = { id: string; action: 'new' | 'ended'; alert: OfficialAlert; at: string }

const apiBaseUrl = (import.meta.env.VITE_ALERTS_API_URL ?? '').replace(/\/$/, '')
const pollingAvailable = import.meta.env.DEV || Boolean(apiBaseUrl)

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

const statusLabels: Record<AlertState, string> = {
  active: 'Є тривога або загроза',
  nominal: 'Тривала адміністративна позначка',
  clear: 'У джерелі не зазначено',
  unknown: 'Немає даних',
}

const statusOrder: Record<AlertState, number> = {
  active: 0,
  nominal: 1,
  clear: 2,
  unknown: 3,
}

function normalizeLocation(value: string) {
  return value.trim().toLocaleLowerCase('uk').replaceAll('’', "'").replace(/\s+/g, ' ')
}

function getRegionStatuses(alerts: OfficialAlert[]) {
  const activeLocations = new Set(alerts.filter((alert) => !isStandingOccupiedAlert(alert)).map((alert) => normalizeLocation(alert.region || alert.location)))
  const nominalLocations = new Set(alerts.filter(isStandingOccupiedAlert).map((alert) => normalizeLocation(alert.region || alert.location)))
  return Object.fromEntries(
    regions.map((region) => [
      region.id,
      activeLocations.has(normalizeLocation(region.title)) || activeLocations.has(normalizeLocation(region.reportTitle))
        ? 'active'
        : nominalLocations.has(normalizeLocation(region.title)) || nominalLocations.has(normalizeLocation(region.reportTitle))
          ? 'nominal'
          : 'clear',
    ]),
  ) as Record<string, AlertState>
}

function getAlertKey(alert: OfficialAlert) {
  return `${normalizeLocation(alert.location)}|${normalizeLocation(alert.type)}|${normalizeLocation(alert.alertLevel ?? '')}`
}

function isStandingOccupiedAlert(alert: OfficialAlert) {
  const location = normalizeLocation(alert.region || alert.location)
  const isOccupiedArea = location === normalizeLocation('Луганська область')
    || location === normalizeLocation('Автономна Республіка Крим')
  const durationDays = Number(alert.duration.match(/(\d+)\s*д/i)?.[1] ?? 0)
  return isOccupiedArea && durationDays >= 14
}

function isAirAlert(alert: OfficialAlert) {
  return normalizeLocation(alert.type).includes('повітряна тривога')
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

function formatTime(date: Date | null) {
  if (!date) return 'очікування даних'

  return new Intl.DateTimeFormat('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Kyiv',
  }).format(date)
}

function App() {
  const [alerts, setAlerts] = useState<OfficialAlert[]>([])
  const [feedSource, setFeedSource] = useState('')
  const [connection, setConnection] = useState<ConnectionState>(pollingAvailable ? 'loading' : 'error')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all')
  const [updateMode, setUpdateMode] = useState<UpdateMode>(() => {
    const storedMode = readStored<UpdateMode>('alert-map-update-mode', '20s')
    return storedMode === 'live' ? 'live' : '20s'
  })
  const [favorites, setFavorites] = useState<string[]>(() => readStored('alert-map-favorites', []))
  const [activityHistory, setActivityHistory] = useState<ActivityEvent[]>(() => readStored('alert-map-history', []))
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => readStored('alert-map-notifications', false) && 'Notification' in window && Notification.permission === 'granted',
  )
  const previousAlerts = useRef<Map<string, OfficialAlert> | null>(null)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/alerts`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const feed = await response.json() as AlertFeed
      if (!Array.isArray(feed.alerts) || !feed.fetchedAt) throw new Error('Некоректна відповідь джерела.')
      const currentAlerts = new Map(feed.alerts.map((alert) => [getAlertKey(alert), alert]))
      const currentKeys = new Set(currentAlerts.keys())
      const previous = previousAlerts.current

      if (previous) {
        const newAlerts = feed.alerts.filter((alert) => !previous.has(getAlertKey(alert)))
        const endedAlerts = [...previous.values()].filter((alert) => !currentKeys.has(getAlertKey(alert)))
        const now = new Date().toISOString()
        const events: ActivityEvent[] = [
          ...newAlerts.map((alert, index) => ({ id: `new-${now}-${index}`, action: 'new' as const, alert, at: now })),
          ...endedAlerts.map((alert, index) => ({ id: `ended-${now}-${index}`, action: 'ended' as const, alert, at: now })),
        ]

        if (events.length) setActivityHistory((current) => [...events, ...current].slice(0, 40))

        if (newAlerts.length && notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Нова загроза на мапі', {
            body: newAlerts.slice(0, 3).map((alert) => `${alert.location}: ${alert.type}`).join('\n'),
          })
        }
      }

      previousAlerts.current = currentAlerts
      setAlerts(feed.alerts)
      setFeedSource(feed.source)
      setUpdatedAt(new Date(feed.fetchedAt))
      setConnection('live')
    } catch {
      setConnection('error')
    } finally {
      setIsRefreshing(false)
    }
  }, [notificationsEnabled])

  useEffect(() => {
    if (updateMode === 'live' || !pollingAvailable) return

    const initialRefresh = window.setTimeout(() => void refresh(), 0)
    const intervalId = window.setInterval(() => void refresh(), 20_000)
    return () => {
      window.clearTimeout(initialRefresh)
      window.clearInterval(intervalId)
    }
  }, [refresh, updateMode])

  useEffect(() => writeStored('alert-map-favorites', favorites), [favorites])
  useEffect(() => writeStored('alert-map-history', activityHistory), [activityHistory])
  useEffect(() => writeStored('alert-map-notifications', notificationsEnabled), [notificationsEnabled])
  useEffect(() => writeStored('alert-map-update-mode', updateMode), [updateMode])

  const typeFilteredAlerts = alerts.filter((alert) => {
    if (typeFilter === 'air') return isAirAlert(alert)
    if (typeFilter === 'other') return !isAirAlert(alert)
    return true
  })
  const statuses = updatedAt
    ? getRegionStatuses(typeFilteredAlerts)
    : Object.fromEntries(regions.map((region) => [region.id, 'unknown'])) as Record<string, AlertState>
  const activeAlerts = typeFilteredAlerts.filter((alert) => !isStandingOccupiedAlert(alert))
  const standingAlertCount = typeFilteredAlerts.filter(isStandingOccupiedAlert).length
  const activeCount = new Set(activeAlerts.map((alert) => normalizeLocation(alert.region || alert.location))).size
  const airAlertCount = activeAlerts.filter(isAirAlert).length
  const otherThreatCount = activeAlerts.length - airAlertCount
  const selectedRegion = regions.find((region) => region.id === selectedId)
  const selectedAlerts = selectedRegion
    ? typeFilteredAlerts.filter((alert) => normalizeLocation(alert.region || alert.location) === normalizeLocation(selectedRegion.title))
    : []
  const sourceUrl = feedSource === 'map.ukrainealarm.com' ? 'https://map.ukrainealarm.com/' : 'https://alerts.in.ua/'
  const visibleRegions = [...regions]
    .filter((region) => {
      const state = statuses[region.id] ?? 'unknown'
      const matchesSearch = region.title.toLocaleLowerCase('uk').includes(search.trim().toLocaleLowerCase('uk'))
      const matchesStatus = regionFilter !== 'active' || state === 'active'
      const matchesFavorite = regionFilter !== 'favorite' || favorites.includes(region.id)
      return matchesSearch && matchesStatus && matchesFavorite
    })
    .sort((left, right) => {
      const leftStatus = statuses[left.id] ?? 'unknown'
      const rightStatus = statuses[right.id] ?? 'unknown'
      return statusOrder[leftStatus] - statusOrder[rightStatus] || left.title.localeCompare(right.title, 'uk')
    })

  const headline = updateMode === 'live'
    ? 'Офіційна карта працює в режимі наживо'
    : !pollingAvailable
      ? 'Підключіть backend для даних нашої мапи'
    : connection === 'loading'
      ? 'Синхронізуємо поточний стан'
      : connection === 'error'
        ? updatedAt ? 'Немає зв’язку з джерелом' : 'Не вдалося отримати дані'
        : activeCount > 0
          ? `Загрози зафіксовані у ${activeCount} регіонах`
          : 'Активних загроз не зафіксовано'

  const toggleFavorite = (regionId: string) => {
    setFavorites((current) => current.includes(regionId)
      ? current.filter((id) => id !== regionId)
      : [...current, regionId])
  }

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
      ['Місце', 'Загроза', 'Початок за джерелом', 'Тривалість за джерелом'],
      ...typeFilteredAlerts.map((alert) => [alert.location, alert.type, alert.startedAt, alert.duration]),
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
        <a className="brand" href="#top" aria-label="Повітряна мапа України">
          <span className="brand-mark"><RadioTower size={20} strokeWidth={2.2} /></span>
          <span className="brand-copy">
            <strong>ПОВІТРЯНА МАПА</strong>
            <span>УКРАЇНА · LIVE</span>
          </span>
        </a>
        <div className="topbar-status" aria-live="polite">
          <span className={`connection-dot connection-${updateMode === 'live' ? 'live' : !pollingAvailable ? 'error' : connection}`} />
          <span>{updateMode === 'live' ? 'ОФІЦІЙНИЙ PUSH' : !pollingAvailable ? 'BACKEND НЕ НАЛАШТОВАНИЙ' : connection === 'live' ? 'ДАНІ ОНОВЛЮЮТЬСЯ' : connection === 'error' ? 'НЕМАЄ ЗВ’ЯЗКУ' : 'З’ЄДНАННЯ'}</span>
        </div>
      </header>

      <section className={`alert-banner ${updateMode === '20s' && activeCount > 0 && connection === 'live' ? 'has-alert' : ''}`} aria-live="polite">
        <div className="banner-icon">
          {updateMode === 'live' ? <RadioTower size={22} /> : connection === 'live' && activeCount === 0 ? <CircleCheck size={22} /> : <ShieldAlert size={22} />}
        </div>
        <div className="banner-copy">
          <span className="eyebrow">СТАН ПО ВСІЙ КРАЇНІ</span>
          <h1>{headline}</h1>
        </div>
        <div className="banner-meta">
          <div className="sync-time"><Clock3 size={15} /><span>{updateMode === 'live' ? 'ПОТІК ВІД ДЖЕРЕЛА' : `ОТРИМАНО ${formatTime(updatedAt)}`}</span></div>
          <button className="refresh-button" type="button" onClick={() => void refresh()} disabled={isRefreshing || updateMode === 'live' || !pollingAvailable} hidden={updateMode === 'live' || !pollingAvailable} aria-label="Оновити дані" title="Оновити дані">
            <RefreshCw size={17} className={isRefreshing ? 'spin' : ''} />
          </button>
        </div>
      </section>

      <div className="update-mode-bar">
        <div className="update-mode-copy">
          <span className="eyebrow">РЕЖИМ ОНОВЛЕННЯ</span>
          <strong>{updateMode === 'live' ? 'Офіційна мапа з push-оновленнями' : pollingAvailable ? 'Автоматична перевірка кожні 20 секунд' : 'Для власної мапи потрібен backend'}</strong>
        </div>
        <div className="update-mode-control" role="group" aria-label="Режим оновлення карти">
          <button type="button" className={updateMode === '20s' ? 'filter-active' : ''} aria-pressed={updateMode === '20s'} onClick={() => setUpdateMode('20s')} disabled={!pollingAvailable} title={pollingAvailable ? 'Оновлювати через backend кожні 20 секунд' : 'Додайте ALERTS_API_URL після розгортання backend'}>
            <RefreshCw size={14} /> 20 сек
          </button>
          <button type="button" className={updateMode === 'live' ? 'filter-active' : ''} aria-pressed={updateMode === 'live'} onClick={() => setUpdateMode('live')} title="Показати офіційну мапу з live-підпискою">
            <RadioTower size={14} /> Наживо
          </button>
        </div>
      </div>

      {!pollingAvailable && updateMode === '20s' && (
        <div className="backend-notice" role="status">
          <WifiOff size={16} />
          <span>Щоб оновлювати цю мапу, розгорніть backend на Render, додайте `ALERTS_IN_UA_TOKEN` у Render Secrets і вкажіть URL сервісу в GitHub variable `ALERTS_API_URL`.</span>
        </div>
      )}

      {pollingAvailable && connection === 'error' && updateMode === '20s' && (
        <div className="stale-notice" role="status">
          <WifiOff size={16} />
          <span>{updatedAt ? `Показано останні отримані дані станом на ${formatTime(updatedAt)}.` : 'Перевірте з’єднання та спробуйте оновити дані.'}</span>
          <button type="button" onClick={() => void refresh()}>Повторити</button>
        </div>
      )}

      <section className="official-live-view" hidden={updateMode !== 'live'} aria-label="Офіційна мапа наживо">
        <div className="official-live-heading">
          <div>
            <span className="eyebrow">ПРЯМА ПІДПИСКА ДЖЕРЕЛА</span>
            <h2>Офіційна карта повітряних тривог</h2>
          </div>
          <a href="https://map.ukrainealarm.com/" target="_blank" rel="noreferrer">Відкрити окремо <ArrowUpRight size={14} /></a>
        </div>
        <iframe
          className="official-live-frame"
          src="https://map.ukrainealarm.com/"
          title="Офіційна карта повітряних тривог України наживо"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="fullscreen"
        />
      </section>

      <div className={`workspace${updateMode === 'live' ? ' is-hidden' : ''}`} id="top">
        <section className="map-section" aria-labelledby="map-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">МОНІТОРИНГ У РЕАЛЬНОМУ ЧАСІ</span>
              <h2 id="map-heading">Карта областей</h2>
            </div>
            <div className="map-count"><MapPinned size={16} /><span>{regions.length} регіонів</span></div>
          </div>

          <div className="metric-strip" aria-label="Статистика активних загроз">
            <div><span>ПОТОЧНИХ</span><strong>{activeAlerts.length.toString().padStart(2, '0')}</strong></div>
            <div><span>ПОВІТРЯНІ</span><strong>{airAlertCount.toString().padStart(2, '0')}</strong></div>
            <div><span>ІНШІ ЗАГРОЗИ</span><strong>{otherThreatCount.toString().padStart(2, '0')}</strong></div>
          </div>

          <div className="type-filter" role="group" aria-label="Фільтр за типом загрози">
            <button type="button" className={typeFilter === 'all' ? 'filter-active' : ''} onClick={() => setTypeFilter('all')}>Усі <span>{alerts.length}</span></button>
            <button type="button" className={typeFilter === 'air' ? 'filter-active' : ''} onClick={() => setTypeFilter('air')}>Повітряні <span>{airAlertCount}</span></button>
            <button type="button" className={typeFilter === 'other' ? 'filter-active' : ''} onClick={() => setTypeFilter('other')}>Інші <span>{otherThreatCount}</span></button>
          </div>

          <div className="map-stage">
            <svg className="ukraine-map" viewBox={ukraineMap.viewBox} role="group" aria-label="Інтерактивна карта повітряних тривог України">
              {regions.map((region) => {
                const state = statuses[region.id] ?? 'unknown'
                const isSelected = selectedId === region.id

                return (
                  <path
                    key={region.id}
                    className={`region-shape state-${state}${isSelected ? ' is-selected' : ''}`}
                    d={region.path}
                    role="button"
                    tabIndex={0}
                    aria-label={`${region.title}: ${statusLabels[state]}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedId(region.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedId(region.id)
                      }
                    }}
                  >
                    <title>{region.title} · {statusLabels[state]}</title>
                  </path>
                )
              })}
            </svg>
            <div className="map-stamp"><span>UA</span><span>48° 23′ N<br />31° 10′ E</span></div>
          </div>

          <div className="map-legend" aria-label="Умовні позначення">
            <span><i className="legend-dot legend-active" />Є тривога / загроза</span>
            <span><i className="legend-dot legend-nominal" />Тривала позначка</span>
            <span><i className="legend-dot legend-clear" />Не вказано джерелом</span>
            {(connection === 'loading' || (connection === 'error' && !updatedAt)) && (
              <span><i className="legend-dot legend-unknown" />{connection === 'loading' ? 'Завантаження' : 'Немає даних'}</span>
            )}
          </div>

          {selectedRegion && (
            <div className="selected-region" aria-live="polite">
              <div className={`selected-indicator state-${statuses[selectedRegion.id] ?? 'unknown'}`} />
              <div className="selected-region-copy">
                <strong>{selectedRegion.title}</strong>
                <span>{statusLabels[statuses[selectedRegion.id] ?? 'unknown']}</span>
                {selectedAlerts.map((alert) => (
                  <span key={`${alert.location}-${alert.type}`} className="selected-alert-type">
                    {isStandingOccupiedAlert(alert) ? 'Тривала позначка · ' : ''}{alert.type}{alert.alertLevel ? ` · ${alert.alertLevel === 'yellow' ? 'жовтий' : 'червоний'} рівень` : ''} · {alert.startedAt} · {alert.duration}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className={`favorite-button${favorites.includes(selectedRegion.id) ? ' is-favorite' : ''}`}
                onClick={() => toggleFavorite(selectedRegion.id)}
                aria-label={favorites.includes(selectedRegion.id) ? 'Вилучити з обраного' : 'Додати до обраного'}
                title={favorites.includes(selectedRegion.id) ? 'Вилучити з обраного' : 'Додати до обраного'}
              >
                <Star size={16} fill={favorites.includes(selectedRegion.id) ? 'currentColor' : 'none'} />
              </button>
              <button type="button" className="clear-selection" onClick={() => setSelectedId(null)} aria-label="Зняти вибір області">×</button>
            </div>
          )}

          <div className="map-caveat">
            <Activity size={14} />
            <span>Мапа показує записи офіційної карти; відсутність позначки не гарантує безпеки. Звіряйтеся з офіційними сповіщеннями.</span>
          </div>
        </section>

        <aside className="region-panel" aria-labelledby="regions-heading">
          <div className="region-panel-heading">
            <div>
              <span className="eyebrow">ПЕРЕЛІК</span>
              <h2 id="regions-heading">Регіони</h2>
            </div>
            <span className="active-counter">{activeCount.toString().padStart(2, '0')} <small>регіонів</small></span>
          </div>

          <label className="search-box">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Знайти область" aria-label="Знайти область" />
          </label>

          <div className="region-filters" role="group" aria-label="Фільтр регіонів">
            <button type="button" className={regionFilter === 'all' ? 'filter-active' : ''} onClick={() => setRegionFilter('all')}>Усі</button>
            <button type="button" className={regionFilter === 'active' ? 'filter-active' : ''} onClick={() => setRegionFilter('active')}>Зі статусом</button>
            <button type="button" className={regionFilter === 'favorite' ? 'filter-active' : ''} onClick={() => setRegionFilter('favorite')}>Обрані <span>{favorites.length}</span></button>
          </div>

          <div className="region-actions">
            <button type="button" onClick={() => void toggleNotifications()} disabled={!('Notification' in window)} aria-pressed={notificationsEnabled} title={notificationsEnabled ? 'Вимкнути сповіщення' : 'Увімкнути сповіщення'}>
              <Bell size={15} /> <span>{notificationsEnabled ? 'Сповіщення увімкнено' : 'Сповіщення'}</span>
            </button>
            <button type="button" onClick={exportAlerts} disabled={!typeFilteredAlerts.length} title="Експортувати відфільтровані загрози у CSV">
              <Download size={15} /> <span>CSV</span>
            </button>
          </div>

          <div className="region-list">
            {visibleRegions.map((region) => {
              const state = statuses[region.id] ?? 'unknown'
              return (
                <button
                  key={region.id}
                  className={`region-row${selectedId === region.id ? ' row-selected' : ''}`}
                  type="button"
                  onClick={() => setSelectedId(region.id)}
                >
                  <span className={`row-marker state-${state}`} />
                  <span className="row-name">{region.title}</span>
                  <span className={`row-status status-label-${state}`}>{statusLabels[state]}</span>
                  <ArrowUpRight size={14} className="row-arrow" />
                </button>
              )
            })}
            {visibleRegions.length === 0 && <p className="empty-results">Область не знайдена</p>}
          </div>

          <div className="region-panel-footer">
            <div className="feed-summary"><span>{standingAlertCount}</span><p>тривалі адміністративні позначки на окупованих територіях показуються окремо від поточних загроз</p></div>
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="source-link">
              <Wifi size={14} /> {feedSource ? `Джерело: ${feedSource}` : 'alerts.in.ua API'} <ArrowUpRight size={13} />
            </a>
          </div>

          <details className="activity-panel">
            <summary><History size={15} /> Журнал змін <span>{activityHistory.length}</span></summary>
            <div className="activity-list">
              {activityHistory.map((event) => (
                <div className="activity-event" key={event.id}>
                  <i className={event.action === 'new' ? 'event-new' : 'event-ended'} />
                  <div>
                    <strong>{event.action === 'new' ? 'Нова загроза' : 'Загрозу знято'}</strong>
                    <span>{event.alert.location} · {event.alert.type}</span>
                    <time>{formatTime(new Date(event.at))}</time>
                  </div>
                </div>
              ))}
              {activityHistory.length === 0 && <p>Зміни з’являться після наступного оновлення джерела.</p>}
            </div>
          </details>
        </aside>
      </div>

      <footer className="app-footer">
        <p>Це інформаційна мапа, не офіційне сповіщення. У разі тривоги дотримуйтеся вказівок місцевої влади та прямуйте в укриття.</p>
        <span>Межі: <a href="https://mapsvg.com/maps/ukraine" target="_blank" rel="noreferrer">MapSVG</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a></span>
      </footer>
    </main>
  )
}

export default App
