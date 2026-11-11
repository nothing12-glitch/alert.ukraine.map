import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { useI18n } from './i18n-context'
import type { AlertState, ThreatLevel } from './map-types'

type MapRegion = { id: string; title: string; path: string }
type Viewport = { x: number; y: number; width: number; height: number }
type Props = {
  regions: MapRegion[]
  statuses: Record<string, AlertState>
  levels: Record<string, ThreatLevel>
  labels: Record<string, string>
  selectedId: string | null
  focusRequest: { regionId: string; token: number } | null
  onSelect: (regionId: string | null) => void
  onFocusRegion: (regionId: string) => void
  viewBox: string
}

const MAX_ZOOM = 6
const ZOOM_STEP = 1.5
const WHEEL_DURATION = 180
const BUTTON_DURATION = 240
const RESET_DURATION = 280
const FOCUS_DURATION = 420

function parseViewBox(viewBox: string): Viewport {
  const [x, y, width, height] = viewBox.trim().split(/[\s,]+/).map(Number)
  return { x, y, width, height }
}

function clampViewport(viewport: Viewport, base: Viewport): Viewport {
  const width = Math.min(base.width, Math.max(base.width / MAX_ZOOM, viewport.width))
  const height = width * (base.height / base.width)
  const spareX = base.width - width
  const spareY = base.height - height
  return {
    x: spareX <= 0.01 ? base.x + spareX / 2 : Math.min(base.x + spareX, Math.max(base.x, viewport.x)),
    y: spareY <= 0.01 ? base.y + spareY / 2 : Math.min(base.y + spareY, Math.max(base.y, viewport.y)),
    width,
    height,
  }
}

function scaleViewport(current: Viewport, base: Viewport, nextWidth: number, anchor: { x: number; y: number }): Viewport {
  const width = Math.min(base.width, Math.max(base.width / MAX_ZOOM, nextWidth))
  const height = width * (base.height / base.width)
  const ratioX = (anchor.x - current.x) / current.width
  const ratioY = (anchor.y - current.y) / current.height
  return clampViewport({ x: anchor.x - ratioX * width, y: anchor.y - ratioY * height, width, height }, base)
}

function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  const matrix = svg.getScreenCTM()
  return matrix ? point.matrixTransform(matrix.inverse()) : { x: 0, y: 0 }
}

export default function UkraineMap({
  regions,
  statuses,
  levels,
  labels,
  selectedId,
  focusRequest,
  onSelect,
  onFocusRegion,
  viewBox,
}: Props) {
  const { t } = useI18n()
  const base = useMemo(() => parseViewBox(viewBox), [viewBox])
  const [viewport, setViewport] = useState<Viewport>(base)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomLabelRef = useRef<HTMLSpanElement>(null)
  const viewportRef = useRef<Viewport>(base)
  const frameRef = useRef(0)
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({})
  const drag = useRef<{ pointerId: number; startX: number; startY: number; viewport: Viewport; scale: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const isFullyZoomedOut = viewport.width >= base.width - 0.01
  const zoomPercent = Math.round((base.width / viewport.width) * 100)
  const hatchScale = viewport.width / base.width
  const hatchTile = 12 * hatchScale
  const hoveredRegion = hoveredId ? regions.find((region) => region.id === hoveredId) : undefined

  const applyViewport = useCallback((next: Viewport) => {
    viewportRef.current = next
    const svg = svgRef.current
    if (svg) svg.setAttribute('viewBox', `${next.x} ${next.y} ${next.width} ${next.height}`)
    if (zoomLabelRef.current) zoomLabelRef.current.textContent = `${Math.round((base.width / next.width) * 100)}%`
  }, [base])

  // React-стан оновлюється лише коли жест завершився: під час анімації патерн-штри-
  // хування не перераховується, інакше кожен кадр примусово перефарбовує всю карту.
  const commitViewport = useCallback((next: Viewport) => {
    applyViewport(next)
    setViewport(next)
  }, [applyViewport])

  const animateTo = useCallback((target: Viewport, duration: number) => {
    window.cancelAnimationFrame(frameRef.current)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commitViewport(target)
      return
    }

    const from = viewportRef.current
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      applyViewport({
        x: from.x + (target.x - from.x) * eased,
        y: from.y + (target.y - from.y) * eased,
        width: from.width + (target.width - from.width) * eased,
        height: from.height + (target.height - from.height) * eased,
      })
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(step)
      } else {
        frameRef.current = 0
        setViewport(viewportRef.current)
      }
    }
    frameRef.current = window.requestAnimationFrame(step)
  }, [applyViewport, commitViewport])

  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const handleWheel = (event: WheelEvent) => {
      const svg = svgRef.current
      if (!svg) return
      event.preventDefault()
      const anchor = toSvgPoint(svg, event.clientX, event.clientY)
      const current = viewportRef.current
      animateTo(scaleViewport(current, base, current.width * Math.exp(event.deltaY * 0.0015), anchor), WHEEL_DURATION)
    }

    stage.addEventListener('wheel', handleWheel, { passive: false })
    return () => stage.removeEventListener('wheel', handleWheel)
  }, [animateTo, base])

  const zoomBy = useCallback((factor: number) => {
    const current = viewportRef.current
    animateTo(scaleViewport(current, base, current.width / factor, {
      x: current.x + current.width / 2,
      y: current.y + current.height / 2,
    }), BUTTON_DURATION)
  }, [animateTo, base])

  const resetView = useCallback(() => {
    animateTo(base, RESET_DURATION)
  }, [animateTo, base])

  useEffect(() => {
    if (!focusRequest) return
    const node = pathRefs.current[focusRequest.regionId]
    if (!node) return
    const box = node.getBBox()
    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2
    const width = Math.min(base.width, Math.max(box.width * 2.6, base.width / 4))
    const height = width * (base.height / base.width)
    animateTo(clampViewport({ x: centerX - width / 2, y: centerY - height / 2, width, height }, base), FOCUS_DURATION)
  }, [focusRequest, animateTo, base])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        zoomBy(ZOOM_STEP)
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        zoomBy(1 / ZOOM_STEP)
      } else if (event.key === '0') {
        event.preventDefault()
        resetView()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [zoomBy, resetView])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if ((event.target as Element).closest('.map-controls')) return
    window.cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
    commitViewport(viewportRef.current)
    const scale = svgRef.current?.getScreenCTM()?.a ?? 1
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, viewport: viewportRef.current, scale, moved: false }
    suppressClick.current = false
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return

    const dx = (event.clientX - current.startX) / current.scale
    const dy = (event.clientY - current.startY) / current.scale
    if (!current.moved) {
      if (Math.hypot(dx, dy) * current.scale < 4) return
      current.moved = true
      setIsPanning(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    applyViewport(clampViewport({ ...current.viewport, x: current.viewport.x - dx, y: current.viewport.y - dy }, base))
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return
    if (drag.current.moved) {
      suppressClick.current = true
      setViewport(viewportRef.current)
    }
    drag.current = null
    setIsPanning(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const selectRegion = (regionId: string) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    onSelect(regionId)
  }

  return (
    <div
      ref={stageRef}
      className={`map-stage${isPanning ? ' is-panning' : ''}${isFullyZoomedOut ? '' : ' is-zoomed'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <svg
        ref={svgRef}
        className="ukraine-map"
        viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
        role="group"
        aria-label={t('map.aria')}
      >
        <defs>
          <pattern id="partial-hatch-red" width={hatchTile} height={hatchTile} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={hatchTile} height={hatchTile} className="hatch-bg hatch-red" />
            <line x1="0" y1="0" x2="0" y2={hatchTile} strokeWidth={3.6 * hatchScale} className="hatch-line hatch-red" />
          </pattern>
          <pattern id="partial-hatch-yellow" width={hatchTile} height={hatchTile} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={hatchTile} height={hatchTile} className="hatch-bg hatch-yellow" />
            <line x1="0" y1="0" x2="0" y2={hatchTile} strokeWidth={3.6 * hatchScale} className="hatch-line hatch-yellow" />
          </pattern>
        </defs>

        {regions.map((region) => {
          const state = statuses[region.id] ?? 'unknown'
          const level = levels[region.id]
          const label = labels[region.id] ?? ''
          const isSelected = selectedId === region.id
          const ariaLabel = `${region.title}: ${label}`

          return (
            <path
              key={region.id}
              ref={(node) => {
                pathRefs.current[region.id] = node
              }}
              className={`region-shape state-${state}${level ? ` level-${level}` : ''}${isSelected ? ' is-selected' : ''}`}
              d={region.path}
              role="button"
              tabIndex={0}
              aria-label={ariaLabel}
              aria-pressed={isSelected}
              onClick={() => selectRegion(region.id)}
              onDoubleClick={() => onFocusRegion(region.id)}
              onMouseEnter={() => setHoveredId(region.id)}
              onMouseLeave={() => setHoveredId((current) => (current === region.id ? null : current))}
              onFocus={() => setHoveredId(region.id)}
              onBlur={() => setHoveredId((current) => (current === region.id ? null : current))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(region.id)
                }
              }}
            >
              <title>{ariaLabel}</title>
            </path>
          )
        })}

        {hoveredRegion && (
          <g className="region-outline-layer" aria-hidden="true">
            <path className="region-outline-halo" d={hoveredRegion.path} />
            <path className="region-outline-line" d={hoveredRegion.path} />
          </g>
        )}
      </svg>

      <div className="map-controls" role="group" aria-label={t('map.zoomAria')}>
        <button
          type="button"
          onClick={() => zoomBy(ZOOM_STEP)}
          disabled={viewport.width <= base.width / MAX_ZOOM + 0.01}
          aria-label={t('map.zoomIn')}
          title={t('map.zoomInHint')}
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / ZOOM_STEP)}
          disabled={isFullyZoomedOut}
          aria-label={t('map.zoomOut')}
          title={t('map.zoomOutHint')}
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={resetView}
          disabled={isFullyZoomedOut}
          aria-label={t('map.zoomReset')}
          title={t('map.zoomReset')}
        >
          <RotateCcw size={15} />
        </button>
        <span className="map-zoom-level" ref={zoomLabelRef}>{zoomPercent}%</span>
      </div>

      <div className="map-stamp"><span>UA</span><span>48° 23′ N<br />31° 10′ E</span></div>
    </div>
  )
}
