import React, { useEffect, useId, useRef, useState } from 'react'

export type GridBackgroundProps = {
  /** Size of each grid cell in px (both width and height). Default 200. */
  cellSize?: number
  /** Container className to customize positioning/z-index/etc. */
  className?: string
  /** Optional inline opacity for the whole backdrop (0~1). */
  opacity?: number
  /** Tailwind/CSS classes for the grid stroke (SVG). */
  strokeClassName?: string
  /** Tailwind/CSS classes for the soft fill blobs (inner SVG). */
  fillClassName?: string
  /** Optional children rendered above the background grid */
  children?: React.ReactNode

  /** Optional watermark logo node rendered per grid cell (e.g. <IconLogo />) */
  watermarkLogo?: React.ReactNode
  /** Multiple watermark logos to cycle through per placed cell */
  watermarkLogos?: React.ReactNode[]
  /** Probability [0~1] that a cell shows a logo. Default 0.12 */
  watermarkDensity?: number
  /** Place exactly N logos with quasi-even distribution (overrides density when provided) */
  watermarkCount?: number
  /** Logo size ratio relative to cell size. Default 0.3 */
  watermarkScale?: number
  /** Deterministic seed for irregular distribution */
  watermarkSeed?: number
}

/**
 * GridBackground
 * Absolute full-screen grid backdrop with mask & subtle blobs.
 * - `cellSize` controls the pattern's width/height for the grid.
 */
export const GridBackground: React.FC<GridBackgroundProps> = ({
  cellSize = 200,
  className = '',
  opacity,
  strokeClassName = 'absolute inset-x-0 top-0 -z-10 h-full w-full mask-radial-[32rem_32rem] mask-radial-from-white mask-radial-to-transparent mask-radial-at-center stroke-gray-300 dark:stroke-slate-300/20',
  fillClassName = 'overflow-visible fill-blue-100 dark:fill-blue-900/30',
  children,
  watermarkLogo,
  watermarkLogos,
  watermarkDensity = 0.12,
  watermarkCount,
  watermarkScale = 0.3,
  watermarkSeed = 8192,
}) => {
  const patternIdRaw = useId()
  const patternId = `grid-${patternIdRaw.replace(/[:]/g, '')}`
  const containerClass = ['relative isolate overflow-hidden', className]
    .filter(Boolean)
    .join(' ')

  // Measure container for watermark layout
  const rootRef = useRef<HTMLDivElement>(null)
  const [{ cols, rows, width, height }, setLayout] = useState({
    cols: 0,
    rows: 0,
    width: 0,
    height: 0,
  })
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      if (!rect) return
      const w = Math.floor(rect.width)
      const h = Math.floor(rect.height)
      const c = Math.max(1, Math.ceil(w / cellSize))
      const r = Math.max(1, Math.ceil(h / cellSize))
      setLayout({ cols: c, rows: r, width: w, height: h })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [cellSize])

  // Deterministic pseudo-random based on index + seed
  const rand = (i: number) => {
    let x = (i + watermarkSeed) | 0
    x ^= x << 13
    x ^= x >> 17
    x ^= x << 5
    // Normalize to 0..1
    return ((x >>> 0) % 10000) / 10000
  }

  // Morton (Z-order) index to linearize 2D cells with spatial locality
  const morton = (x: number, y: number) => {
    const part1by1 = (n: number) => {
      n &= 0xffff
      n = (n | (n << 8)) & 0x00ff00ff
      n = (n | (n << 4)) & 0x0f0f0f0f
      n = (n | (n << 2)) & 0x33333333
      n = (n | (n << 1)) & 0x55555555
      return n
    }
    return (part1by1(y) << 1) | part1by1(x)
  }

  return (
    <div className={containerClass} ref={rootRef}>
      <svg
        className={strokeClassName}
        aria-hidden="true"
        style={opacity != null ? { opacity } : undefined}
      >
        <defs>
          <pattern
            id={patternId}
            width={cellSize}
            height={cellSize}
            x="50%"
            y={-1}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M.5 ${cellSize}V.5H${cellSize}`}
              fill="none"
              stroke="rgba(148,163,184,0.25)" /* slate-400 ~ 25% */
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
          </pattern>
        </defs>

        <svg x="50%" y={-1} className={fillClassName}>
          <path
            d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
            strokeWidth={0}
          />
        </svg>

        <rect
          width="100%"
          height="100%"
          strokeWidth={0}
          fill={`url(#${patternId})`}
        />
      </svg>
      {(!!watermarkLogo || (watermarkLogos && watermarkLogos.length)) &&
        cols > 0 &&
        rows > 0 && (
          <div
            className="absolute inset-0 -z-0 pointer-events-none grid place-items-center"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            }}
          >
            {(() => {
              const total = cols * rows
              const size = Math.max(8, Math.floor(cellSize * watermarkScale))
              const logos =
                watermarkLogos && watermarkLogos.length
                  ? watermarkLogos
                  : [watermarkLogo as React.ReactNode]

              // Build ordered cell list (Morton order)
              const cells = Array.from({ length: total }, (_, i) => ({
                col: i % cols,
                row: Math.floor(i / cols),
              })).sort((a, b) => morton(a.col, a.row) - morton(b.col, b.row))

              let indices: number[] = []
              if (typeof watermarkCount === 'number' && watermarkCount > 0) {
                const N = Math.min(watermarkCount, total)
                const stride = Math.max(1, Math.floor(total / N))
                const start = Math.floor(rand(123456) * stride)
                for (let k = 0; k < N; k++) {
                  indices.push((start + k * stride) % total)
                }
              } else {
                // Density path
                indices = cells
                  .map((_, idx) => idx)
                  .filter(idx => rand(idx) < watermarkDensity)
              }

              return cells.map((_, orderedIdx) => {
                const chosen = indices.includes(orderedIdx)
                if (!chosen) return <div key={orderedIdx} />
                const logoIdx = orderedIdx % logos.length
                const op = rand(orderedIdx * 97 + 7) < 0.5 ? 0 : 1
                return (
                  <div
                    key={orderedIdx}
                    className="flex items-center justify-center"
                    style={{ opacity: op }}
                  >
                    <div style={{ width: size, height: size }}>
                      {logos[logoIdx]}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      {children}
    </div>
  )
}

export default GridBackground
