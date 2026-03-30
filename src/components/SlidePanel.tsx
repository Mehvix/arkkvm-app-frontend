import { cn } from '@/lib/utils'
import React from 'react'

export type SlideSide = 'top' | 'bottom' | 'left' | 'right'

export interface SlidePanelProps {
  open: boolean
  side?: SlideSide
  duration?: number // ms
  ease?: string // css timing function, e.g. 'ease-in-out'
  width?: number | string // used for left/right
  height?: number | string // used for top/bottom
  className?: string // wrapper class (fixed container)
  contentClassName?: string // inner content box class
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
  overlay?: boolean // show a dim overlay behind
  overlayClassName?: string
  onOverlayClick?: () => void
  children?: React.ReactNode
  animateOnMount?: boolean // trigger animation when initially mounted and open=true
  expandMode?: 'size' | 'translate' | 'both' // size: animate width/height; translate: slide; both: combine
  position?: 'fixed' | 'inline' // fixed: overlay/drawer style; inline: normal flow block
  closeOnOutside?: boolean // click outside to close (overlay or document area). default: true
}

const sidePositionClass: Record<SlideSide, string> = {
  top: 'left-0 right-0 top-0',
  bottom: 'left-0 right-0 bottom-0',
  left: 'left-0 top-0 bottom-0',
  right: 'right-0 top-0 bottom-0',
}

function hiddenTransform(side: SlideSide) {
  switch (side) {
    case 'top':
      return '-translate-y-full'
    case 'bottom':
      return 'translate-y-full'
    case 'left':
      return '-translate-x-full'
    case 'right':
      return 'translate-x-full'
  }
}

function openTransform(side: SlideSide) {
  switch (side) {
    case 'top':
    case 'bottom':
      return 'translate-y-0'
    case 'left':
    case 'right':
      return 'translate-x-0'
  }
}

export function SlidePanel({
  open,
  side = 'bottom',
  duration = 300,
  ease = 'ease-in-out',
  width,
  height,
  className,
  contentClassName,
  style,
  contentStyle,
  overlay = false,
  overlayClassName,
  onOverlayClick,
  animateOnMount = true,
  expandMode = 'size',
  position = 'fixed',
  closeOnOutside = true,
  children,
}: SlidePanelProps) {
  const [mounted, setMounted] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    // delay one frame to ensure browsers can interpolate from hidden to shown on mount
    if (!mounted) {
      const id = requestAnimationFrame(() => setMounted(true))
      return () => cancelAnimationFrame(id)
    }
  }, [mounted])

  // Outside click to close (works for both inline and fixed)
  React.useEffect(() => {
    if (!(open && closeOnOutside && onOverlayClick)) return
    const handler = (e: MouseEvent) => {
      const panelEl = panelRef.current
      const containerEl = containerRef.current
      const target = e.target as Node | null
      if (!target) return
      // If click is outside both panel and container, treat as outside
      if (
        panelEl &&
        !panelEl.contains(target) &&
        containerEl &&
        !containerEl.contains(target)
      ) {
        onOverlayClick?.()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, closeOnOutside, onOverlayClick])
  // Target size according to side
  const targetSize: React.CSSProperties = {}
  const isVertical = side === 'top' || side === 'bottom'
  if (isVertical) {
    targetSize.height = height ?? 400
    targetSize.width = '100%'
  } else {
    targetSize.width = width ?? 400
    targetSize.height = '100%'
  }

  // Transition style
  const transitionStyle: React.CSSProperties = {
    transitionProperty: [
      expandMode !== 'translate' ? (isVertical ? 'height' : 'width') : '',
      expandMode !== 'size' ? 'transform' : '',
      'opacity',
    ]
      .filter(Boolean)
      .join(', '),
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: ease,
  }

  const panel = (
    <div
      ref={containerRef}
      className={cn(
        position === 'fixed'
          ? cn(
              'fixed z-[1000]',
              sidePositionClass[side],
              open ? 'pointer-events-auto' : 'pointer-events-none'
            )
          : 'relative',
        className
      )}
      style={style}
    >
      <div
        ref={panelRef}
        className={cn(
          // base
          'bg-[var(--bg-secondary)] shadow-lg transform-gpu will-change-transform will-change-opacity overflow-hidden',
          // translate when closed vs open
          expandMode !== 'size'
            ? open && (mounted || !animateOnMount)
              ? openTransform(side)
              : hiddenTransform(side)
            : '',
          // opacity fade
          open && (mounted || !animateOnMount) ? 'opacity-100' : 'opacity-0',
          contentClassName
        )}
        style={{
          // size expansion
          ...(expandMode !== 'translate'
            ? open && (mounted || !animateOnMount)
              ? targetSize
              : isVertical
                ? { height: 0, width: targetSize.width }
                : { width: 0, height: targetSize.height }
            : targetSize),
          ...transitionStyle,
          ...contentStyle,
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )

  // Overlay only applies when position is fixed
  if (!(position === 'fixed' && overlay)) return panel

  return (
    <div
      className="fixed inset-0 z-[999]"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/40',
          open ? 'opacity-100' : 'opacity-0',
          overlayClassName
        )}
        style={transitionStyle}
        onClick={closeOnOutside ? onOverlayClick : undefined}
      />
      {panel}
    </div>
  )
}

export default SlidePanel
