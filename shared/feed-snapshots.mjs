export const alertsFileName = 'alerts.json'

const pad = (value) => String(value).padStart(2, '0')

// Ім'я знімка на хвилину: URL такого файла ніколи не змінюється, тому
// п'ятихвилинний кеш raw.githubusercontent не може видати старі дані під свіжим адресом.
export function minuteStamp(at) {
  return `${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}-${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}`
}

export function snapshotFileName(stamp) {
  return `alerts-${stamp}.json`
}

export function isSnapshotFileName(name) {
  return /^alerts-\d{8}-\d{4}\.json$/.test(name)
}
