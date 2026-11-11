// Оновлює довідник «regionId → область», з якого карта дізнається, до якої області належить
// район чи громада з /alerts. Потрібен UKRAINE_ALARM_TOKEN; джерело віддає один запит на хвилину.
import { writeFileSync } from 'node:fs'
import { buildOblastIndex, ukraineAlarmRegionsUrl } from '../shared/ukraine-alarm-alerts.mjs'

const token = process.env.UKRAINE_ALARM_TOKEN?.trim()
if (!token) {
  console.error('UKRAINE_ALARM_TOKEN is not configured')
  process.exit(1)
}

const response = await fetch(ukraineAlarmRegionsUrl, {
  headers: { Accept: 'application/json', authorization: token },
})

if (!response.ok) {
  console.error(`${ukraineAlarmRegionsUrl} returned HTTP ${response.status}`)
  process.exit(1)
}

const entries = [...buildOblastIndex(await response.json()).entries()].sort(
  (left, right) => Number(left[0]) - Number(right[0]),
)
const outputFile = new URL('../shared/ukraine-alarm-regions.mjs', import.meta.url)

writeFileSync(
  outputFile,
  `// Автозгенеровано: npm run sync:alarm-regions (джерело: ${ukraineAlarmRegionsUrl}).\n`
  + `export const oblastByRegionId = ${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`,
)

console.log(`Wrote ${entries.length} regions to ${outputFile.pathname}`)
