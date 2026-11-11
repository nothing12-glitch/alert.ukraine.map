import { execFile } from 'node:child_process'
import { copyFile, mkdir, readFile, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { alertsFileName, isSnapshotFileName, minuteStamp } from '../shared/feed-snapshots.mjs'

const publishScript = 'scripts/publish-ukraine-alarm-feed.mjs'
const snapshotDirectory = '.feed'
const pushDirectory = '.feed-push'
const workflowFile = 'alerts-feed.yml'

const loopMinutes = Number(process.env.LOOP_MINUTES ?? 300)
const intervalMs = Number(process.env.LOOP_INTERVAL_SECONDS ?? 60) * 1000
const retentionMinutes = Number(process.env.SNAPSHOT_RETENTION_MINUTES ?? 12)
const maxConsecutiveFailures = 10
const requestTimeoutMs = 15_000
const pushTimeoutMs = 90_000

// Публікуємо через кілька секунд після початку хвилини, щоб файл завжди мав позначку
// вже завершеної хвилини: браузер ніколи не просить знімок, якого ще не існує, а 404
// raw.githubusercontent кешується на п'ять хвилин.
const publishLeadMs = 8_000

function log(message) {
  console.log(new Date().toISOString(), message)
}

function run(command, args, options = {}) {
  const { timeout = requestTimeoutMs, ...rest } = options
  return new Promise((resolve, reject) => {
    execFile(command, args, { ...rest, timeout }, (error, stdout, stderr) => {
      if (error) {
        reject(Object.assign(error, { output: `${stdout}${stderr}` }))
        return
      }
      resolve(`${stdout}${stderr}`)
    })
  })
}

function redact(value) {
  const secrets = [process.env.UKRAINE_ALARM_TOKEN, process.env.GITHUB_TOKEN].filter(Boolean)
  return secrets.reduce((text, secret) => text.replaceAll(secret, '[redacted]'), String(value))
}

function feedRemoteUrl(token, repository) {
  const host = (process.env.GITHUB_SERVER_URL ?? 'https://github.com').replace(/^https?:\/\//, '')
  return `https://x-access-token:${token}@${host}/${repository}`
}

function snapshotDate(fileName) {
  const [, year, month, day, hour, minute] = fileName.match(/^alerts-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})\.json$/)
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
}

async function publishSnapshot() {
  await run(process.execPath, [publishScript, `--dir=${snapshotDirectory}`])
}

async function pruneSnapshots(now) {
  const oldest = now.getTime() - retentionMinutes * 60_000
  const stale = (await readdir(snapshotDirectory)).filter((name) => isSnapshotFileName(name) && snapshotDate(name) < oldest)
  await Promise.all(stale.map((name) => rm(path.join(snapshotDirectory, name))))
}

const identity = ['-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com']
const git = (args, options) => run('git', args, { cwd: pushDirectory, ...options })

// Чернетковий репозиторій не перестворюється щохвилини: тоді push віддає лише нові
// blobs замість усього вмісту, і хвилинний ритм не ламається через повільний бої.
// На гілці feed завжди лежить один коміт — його перевипускаємо через --amend.
let pushRepoReady = false

async function preparePushRepo() {
  if (pushRepoReady) return
  await mkdir(pushDirectory, { recursive: true })
  await git(['init', '--quiet'])
  await git([...identity, 'commit', '--quiet', '--allow-empty', '-m', 'Alerts feed scratch'])
  pushRepoReady = true
}

async function pushFeedBranch(token, repository) {
  await preparePushRepo()

  const files = [alertsFileName, ...(await readdir(snapshotDirectory)).filter(isSnapshotFileName)]
  await Promise.all(files.map((name) => copyFile(path.join(snapshotDirectory, name), path.join(pushDirectory, name))))

  await git(['add', '-A'])
  await git([...identity, 'commit', '--amend', '--quiet', '--allow-empty', '-m', 'Update alerts feed snapshot'])
  await git(['push', '--quiet', '--force', feedRemoteUrl(token, repository), 'HEAD:feed'], { timeout: pushTimeoutMs })
}

function api(pathname, token, init = {}) {
  const base = process.env.GITHUB_API_URL ?? 'https://api.github.com'
  return fetch(`${base}${pathname}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  })
}

async function activeRunCount(token, repository) {
  const runId = Number(process.env.GITHUB_RUN_ID ?? 0)
  const response = await api(`/repos/${repository}/actions/workflows/${workflowFile}/runs?per_page=20`, token)
  if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}`)

  const body = await response.json()
  return (body.workflow_runs ?? []).filter((entry) => entry.status !== 'completed' && entry.id !== runId).length
}

async function dispatchSuccessor(token, repository, ref) {
  // У dispatch-запиті дозволено лише `ref` (і `inputs`): зайві ключі GitHub карає 422.
  const response = await api(`/repos/${repository}/actions/workflows/${workflowFile}/dispatches`, token, {
    method: 'POST',
    body: JSON.stringify({ ref }),
  })
  if (!response.ok) throw new Error(`dispatch returned HTTP ${response.status} ${redact(await response.text())}`)
}

async function describeSnapshot() {
  const feed = JSON.parse(await readFile(path.join(snapshotDirectory, alertsFileName), 'utf8'))
  return `${feed.alerts.length} alerts as ${minuteStamp(new Date(feed.fetchedAt))}`
}

async function main() {
  const token = process.env.GITHUB_TOKEN?.trim()
  const repository = process.env.GITHUB_REPOSITORY?.trim()
  const ref = process.env.GITHUB_REF_NAME ?? 'main'
  if (!token || !repository) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY must be set.')

  // Cron слугує наглядачем: ланцюжок безперервних запусків уже тримає хвилинний ритм,
  // тому за плановим тригером стартуємо лише коли ланцюжок перервався.
  if (process.env.GITHUB_EVENT_NAME === 'schedule') {
    const others = await activeRunCount(token, repository)
    if (others) {
      log(`Feed loop is already running (${others} active); scheduled check-in skipped.`)
      return
    }
    log('No active feed loop; scheduled check-in takes over.')
  }

  const budgetMs = loopMinutes * 60_000
  const startedAt = Date.now()
  let failures = 0

  while (Date.now() - startedAt < budgetMs) {
    const iterationStartedAt = Date.now()
    try {
      await publishSnapshot()
      await pruneSnapshots(new Date())
      await pushFeedBranch(token, repository)
      failures = 0
      log(`Published ${await describeSnapshot()} in ${((Date.now() - iterationStartedAt) / 1000).toFixed(1)}s.`)
    } catch (error) {
      failures += 1
      log(`Iteration failed (${failures}/${maxConsecutiveFailures}): ${redact(error.output ?? error.message ?? error)}`)
      if (failures >= maxConsecutiveFailures) {
        log('Too many consecutive failures; leaving the restart to the scheduled watchdog.')
        return
      }
    }

    const now = Date.now()
    const nextSlot = Math.floor(now / intervalMs) * intervalMs + intervalMs + publishLeadMs
    const remaining = budgetMs - (now - startedAt)
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, Math.min(nextSlot - now, remaining))))
  }

  try {
    const others = await activeRunCount(token, repository)
    if (others) {
      log(`Another run is already queued or active (${others}); not starting a second chain.`)
      return
    }
    await dispatchSuccessor(token, repository, ref)
    log('Dispatched the next feed loop run.')
  } catch (error) {
    log(`Could not dispatch the next run: ${redact(error.message ?? error)}. The scheduled watchdog will restart the loop.`)
  }
}

await main()
