// Мапа малюється з живого SVG-вузла: клон з інлайновими стилями, щоб знімок не залежав
// від таблиці стилів сторінки — у відрисованому окремим документом SVG її просто немає.
const exportedProperties = [
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-opacity',
  'stroke-width',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'opacity',
  'visibility',
  'display',
  'vector-effect',
  'paint-order',
] as const

export type MapImageInfo = {
  fileName: string
  title: string
  timestamp: string
  headline: string
  counts: string
  footer: string
  isRed: boolean
}

const padding = 18
const headerHeight = 62
const footerHeight = 40
const gridStep = 30

function css(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function withInlineStyles(source: SVGSVGElement): SVGSVGElement {
  const clone = source.cloneNode(true) as SVGSVGElement
  const live = [source, ...source.querySelectorAll('*')]
  const copies = [clone, ...clone.querySelectorAll('*')]
  for (let index = 0; index < copies.length; index += 1) {
    const copy = copies[index]
    const node = live[index]
    if (!copy || !node) continue
    const computed = getComputedStyle(node)
    const declarations = exportedProperties
      .map((property) => `${property}:${computed.getPropertyValue(property).trim()}`)
      .join(';')
    copy.setAttribute('style', `${copy.getAttribute('style') ?? ''};${declarations}`)
  }
  return clone
}

function toImage(svg: SVGSVGElement, width: number, height: number) {
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }))
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('map svg did not render'))
    }
    image.src = url
  })
}

function drawGrid(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, line: string) {
  ctx.strokeStyle = line
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let offset = gridStep; offset < width; offset += gridStep) {
    ctx.moveTo(Math.round(x + offset) + 0.5, y)
    ctx.lineTo(Math.round(x + offset) + 0.5, y + height)
  }
  for (let offset = gridStep; offset < height; offset += gridStep) {
    ctx.moveTo(x, Math.round(y + offset) + 0.5)
    ctx.lineTo(x + width, Math.round(y + offset) + 0.5)
  }
  ctx.stroke()
}

export async function exportMapImage(svg: SVGSVGElement, info: MapImageInfo) {
  const width = Math.round(svg.clientWidth)
  const height = Math.round(svg.clientHeight)
  if (!width || !height) return

  const image = await toImage(withInlineStyles(svg), width, height)
  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = (width + padding * 2) * scale
  canvas.height = (headerHeight + height + footerHeight) * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(scale, scale)

  const canvasColor = css('--canvas', '#f2f5f0')
  const inkColor = css('--ink', '#17231e')
  const mutedColor = css('--muted', '#748078')
  const lineColor = css('--line', '#d8e0da')
  const sans = css('--sans', 'system-ui, sans-serif')
  const mono = css('--mono', 'Consolas, monospace')

  ctx.fillStyle = canvasColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.textBaseline = 'alphabetic'
  ctx.font = `700 19px ${sans}`
  ctx.fillStyle = inkColor
  ctx.textAlign = 'left'
  ctx.fillText(info.title, padding, padding + 15)

  ctx.font = `11px ${mono}`
  ctx.fillStyle = mutedColor
  ctx.textAlign = 'right'
  ctx.fillText(info.timestamp, canvas.width / scale - padding, padding + 13)

  ctx.font = `600 15px ${sans}`
  ctx.fillStyle = info.isRed ? css('--alert', '#d94d3d') : inkColor
  ctx.textAlign = 'left'
  ctx.fillText(info.headline, padding, padding + 40)

  ctx.font = `11px ${mono}`
  ctx.fillStyle = mutedColor
  ctx.textAlign = 'right'
  ctx.fillText(info.counts, canvas.width / scale - padding, padding + 38)

  const mapX = padding
  const mapY = headerHeight
  ctx.fillStyle = getComputedStyle(svg.parentElement ?? svg).backgroundColor || canvasColor
  ctx.fillRect(mapX, mapY, width, height)
  drawGrid(ctx, mapX, mapY, width, height, lineColor)
  ctx.drawImage(image, mapX, mapY, width, height)
  ctx.strokeStyle = lineColor
  ctx.strokeRect(mapX + 0.5, mapY + 0.5, width - 1, height - 1)

  ctx.font = `11px ${mono}`
  ctx.fillStyle = mutedColor
  ctx.textAlign = 'left'
  ctx.fillText(info.footer, padding, headerHeight + height + 24)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return

  const link = document.createElement('a')
  const downloadUrl = URL.createObjectURL(blob)
  link.href = downloadUrl
  link.download = info.fileName
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
}
