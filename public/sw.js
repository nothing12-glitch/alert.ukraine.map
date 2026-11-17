/* Service worker «Повітряної мапи».
   Правило просте: мапа має відкритися завжди. Оболонку тримаємо в кеші й віддаємо з
   мережі, лише коли вона відповідає; знімок тривоги навпаки — спершу свіжий, а коли
   мережі немає, останній збережений. */

const SHELL_CACHE = 'alert-map-shell-v1'
const DATA_CACHE = 'alert-map-data-v1'
const DATA_LIMIT = 24

// Файл живе в корені збірки, тому base збігається з BASE_PATH публікації на Pages.
const base = self.location.pathname.replace(/[^/]*$/, '')
// Плейсхолдер замінює збірка (див. vite.config.ts): імена бандлів із хешем вручну не вгадати,
// а без них перший офлайн-візит показав би порожню сторінку.
const precachedAssets = __PRECACHED_ASSETS__
const shellUrls = [base, `${base}index.html`, `${base}manifest.webmanifest`, `${base}widget.html`, ...precachedAssets]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(shellUrls))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL_CACHE, DATA_CACHE])
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

function isSnapshot(url) {
  return /alerts(-\d{8}-\d{4})?\.json$/.test(url.pathname)
}

function byUrl(entries) {
  return entries.sort((left, right) => left.url.localeCompare(right.url))
}

async function trimSnapshots() {
  const cache = await caches.open(DATA_CACHE)
  const keys = byUrl(await cache.keys())
  const surplus = keys.length - DATA_LIMIT
  if (surplus <= 0) return
  await Promise.all(keys.slice(0, surplus).map((entry) => cache.delete(entry)))
}

async function networkFirstSnapshot(request) {
  const cache = await caches.open(DATA_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone()).then(trimSnapshots, () => undefined)
    }
    return response
  } catch (error) {
    const stored = await cache.match(request)
    if (stored) return stored
    // Наступної хвилини в кеші немає: візьмемо найсвіжіший з хвилинних знімків
    // (їхні назви — це час у UTC), а вже потім рухомий alerts.json.
    const saved = byUrl((await cache.matchAll()).filter((entry) => entry.ok))
    const dated = saved.filter((entry) => /alerts-\d{8}-\d{4}\.json$/.test(new URL(entry.url).pathname))
    const fallback = (dated.length ? dated : saved).at(-1)
    if (fallback) return fallback
    throw error
  }
}

async function networkFirstShell(request) {
  const cache = await caches.open(SHELL_CACHE)
  // Ключ — шлях навігації: інакше офлайн-віджет отримав би замість себе головну мапу.
  const key = new URL(request.url).pathname
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(key, response.clone()).catch(() => undefined)
    }
    return response
  } catch (error) {
    const stored = await cache.match(key)
    if (stored) return stored
    throw error
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(SHELL_CACHE)
  const stored = await cache.match(request)
  if (stored) return stored
  const response = await fetch(request)
  if (response.ok) {
    cache.put(request, response.clone()).catch(() => undefined)
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (isSnapshot(url)) {
    event.respondWith(networkFirstSnapshot(request))
    return
  }

  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShell(request))
    return
  }

  if (url.pathname.startsWith(base)) {
    event.respondWith(cacheFirstAsset(request))
  }
})
