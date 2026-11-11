import ClipperLib from 'clipper-lib'

// Координати карти — дробові одиниці viewBox, а Clipper працює з цілими,
// тому все множимо на 100 (точність до 0.01 одиниці).
const SCALE = 100

type Ring = Array<[number, number]>

const bandCache = new Map<string, string>()

function ringsFromPath(d: string): Ring[] {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? []
  const rings: Ring[] = []
  let current: Ring = []
  let cursor: [number, number] = [0, 0]
  let start: [number, number] = [0, 0]
  let command = 'M'

  const numberAt = (index: number) => Number(tokens[index])

  for (let i = 0; i < tokens.length; ) {
    const token = tokens[i]
    if (/^[A-Za-z]$/.test(token)) {
      command = token
      i += 1
      continue
    }

    const relative = command === command.toLowerCase()
    const letter = command.toUpperCase()

    if (letter === 'M' || letter === 'L') {
      const x = numberAt(i)
      const y = numberAt(i + 1)
      cursor = relative ? [cursor[0] + x, cursor[1] + y] : [x, y]
      if (letter === 'M') {
        if (current.length > 2) rings.push(current)
        current = []
        start = cursor
        command = relative ? 'l' : 'L'
      }
      current.push(cursor)
      i += 2
    } else if (letter === 'H' || letter === 'V') {
      const value = numberAt(i)
      cursor = letter === 'H'
        ? [relative ? cursor[0] + value : value, cursor[1]]
        : [cursor[0], relative ? cursor[1] + value : value]
      current.push(cursor)
      i += 1
    } else if (letter === 'Z') {
      if (current.length > 2) rings.push(current)
      current = []
      cursor = start
      i += 1
    } else {
      throw new Error(`Unsupported path command: ${command}`)
    }
  }

  if (current.length > 2) rings.push(current)
  return rings
}

function toClipperPath(ring: Ring) {
  return ring.map(([x, y]) => ({ X: Math.round(x * SCALE), Y: Math.round(y * SCALE) }))
}

// Clipper зміщує замкнений контур «наліво» від напрямку обходу, тому всі кільця
// спершу приводимо до однієї орієнтації: додатна площа = зовнішнє зміщення.
function normalizeOrientation(ring: Ring): Ring {
  let sum = 0
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    sum += a[0] * b[1] - b[0] * a[1]
  }
  return sum >= 0 ? ring : [...ring].reverse()
}

function offsetRings(rings: Ring[], delta: number) {
  // jtRound: на гострих кутах miter дає голки завдовжки з половину області, а
  // заокруглення лишень на ширину стрічки виглядає так само, як штрих із
  // stroke-linejoin: round, який був раніше.
  const offset = new ClipperLib.ClipperOffset(0, 20)
  for (const ring of rings) {
    offset.AddPath(toClipperPath(normalizeOrientation(ring)), ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon)
  }
  const solution: ClipperLib.Paths = []
  offset.Execute(solution, delta * SCALE)
  return solution
}

function toPathData(rings: Array<Array<{ X: number; Y: number }>>): string {
  return rings
    .map((ring) => {
      const points = ring.map((point) => `${(point.X / SCALE).toFixed(1)} ${(point.Y / SCALE).toFixed(1)}`)
      return points.length ? `M${points.join('L')}Z` : ''
    })
    .join('')
}

// Стрічка завширшки width, що росте від межі області назовні: зовнішнє зміщення
// мінус сама фігура. Саме різниця, а не «всерединнє» зміщення: у тонких виступів
// і малих областей внутрішнє зміщення або зникає, або розпадається на шматки, і
// тоді стрічка зафарбувала б середину області.
function bandFromPath(d: string, width: number): string {
  if (!(width > 0)) return ''
  const rings = ringsFromPath(d)
  if (!rings.length) return ''
  const subject = offsetRings(rings, width)
  const clip = rings.map((ring) => toClipperPath(normalizeOrientation(ring)))
  const clipper = new ClipperLib.Clipper()
  clipper.AddPaths(subject, ClipperLib.PolyType.ptSubject, true)
  clipper.AddPaths(clip, ClipperLib.PolyType.ptClip, true)
  const solution: ClipperLib.Paths = []
  clipper.Execute(
    ClipperLib.ClipType.ctDifference,
    solution,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  )
  return toPathData(solution)
}

// Перерахування стрічки на великій області — одиниці мілісекунд, тому тримаємо
// готові рядки: область змінюється лише при наведенні, а ширина — при зумі.
export function cachedBand(id: string, d: string, width: number): string {
  const key = `${id}@${width.toFixed(3)}`
  const cached = bandCache.get(key)
  if (cached !== undefined) return cached
  if (bandCache.size > 120) bandCache.clear()
  const band = bandFromPath(d, width)
  bandCache.set(key, band)
  return band
}
