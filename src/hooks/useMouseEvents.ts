import { useCallback, useEffect, useRef } from 'react'

type AbsMoveHandler = (x: number, y: number, buttons: number) => void
type RelMoveHandler = (params: {
  dx: number
  dy: number
  buttons: number
  x: number
  y: number
}) => void
type ClickEventHandler = (button: number) => void
type DoubleClickEventHandler = (button: number, x: number, y: number) => void

interface MouseEventsOptions {
  videoRef: React.RefObject<HTMLVideoElement>
  onAbsMove?: AbsMoveHandler
  onRelMove?: RelMoveHandler
  onWheel?: (data: { deltaX: number; deltaY: number; wheelY: number }) => void
  onClick?: ClickEventHandler
  onDoubleClick?: DoubleClickEventHandler
  onRightClick?: ClickEventHandler
  mode?: 'absolute' | 'relative'
  videoWidth?: number
  videoHeight?: number
  enabled?: boolean
  scrollThrottling?: number | boolean
  jiggler?: boolean
  isCursorHidden?: boolean
}

const POINTER_LOCK_AVAILABLE =
  window.location.protocol === 'https:' ||
  window.location.hostname === 'localhost'

const FULLSCREEN_AVAILABLE = document.fullscreenEnabled

const MOUSE_CONSTANTS = {
  MAX_COORDINATE: 32767,
  MAX_DELTA_PER_FRAME: 500,
  INT8_MIN: -128,
  INT8_MAX: 127,
  SCROLL_THRESHOLD: 100,
  SCROLL_CLAMP_MIN: -127,
  SCROLL_CLAMP_MAX: 127,
  DEFAULT_THROTTLE_MS: 60,
} as const

const TOUCH_CONSTANTS = {
  DOUBLE_TAP_DELAY: 400,
  DOUBLE_TAP_DISTANCE: 30,
  TAP_DELAY_OFFSET: 50,
} as const

const JIGGLER_CONSTANTS = {
  IDLE_MS: 20_000,
  PERIOD_MS: 30_000,
  AMPLITUDE: 1,
  RESET_DELAY: 16,
} as const

const isEventOnVideo = (
  e: PointerEvent | MouseEvent,
  videoRef: React.RefObject<HTMLVideoElement>
): boolean => {
  const target = e.target as HTMLElement
  const video = videoRef.current
  if (!video || !target) return false
  return target === video || video.contains(target)
}

const isEventBlockedByOverlay = (e: Event): boolean => {
  const target = e.target as HTMLElement
  if (!target) return false
  return !!target.closest(
    '[role="dialog"], [role="alertdialog"], [data-radix-dialog-overlay], [data-radix-popover-content], [data-slot="dialog-overlay"], [data-slot="dialog-content"], [data-panel], [data-sidebar]'
  )
}

export function useMouseEvents(options: MouseEventsOptions) {
  const {
    videoRef,
    onAbsMove,
    onRelMove,
    onWheel,
    onClick,
    onDoubleClick,
    onRightClick,
    videoWidth = 1920,
    videoHeight = 1080,
    mode = 'absolute',
    scrollThrottling,
    jiggler,
    isCursorHidden = false,
  } = options
  const enabled = options.enabled ?? true
  const blockWheelEventRef = useRef(false)

  const throttleMs =
    typeof scrollThrottling === 'number'
      ? Math.max(0, scrollThrottling)
      : scrollThrottling
        ? MOUSE_CONSTANTS.DEFAULT_THROTTLE_MS
        : 0

  const latestPointer = useRef<{
    x: number
    y: number
    buttons: number
  } | null>(null)
  const lastSent = useRef<{ x: number; y: number; buttons: number } | null>(
    null
  )
  const wheelAcc = useRef(0)
  const wheelTimer = useRef<number | null>(null)
  const rafId = useRef<number | null>(null)
  const lastActivityTs = useRef<number>(Date.now())
  const jigglerTimer = useRef<number | null>(null)

  const transform = useRef({
    scale: 1,
    offX: 0,
    offY: 0,
    vw: videoWidth,
    vh: videoHeight,
  })

  const virtualPos = useRef<{ x: number; y: number } | null>(null)
  const isLockedRef = useRef(false)

  const recomputeTransform = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    const vw = v.videoWidth || videoWidth
    const vh = v.videoHeight || videoHeight
    const rect = v.getBoundingClientRect()
    const scale = Math.min(rect.width / vw, rect.height / vh)
    const displayW = vw * scale
    const displayH = vh * scale
    const offX = rect.left + (rect.width - displayW) / 2
    const offY = rect.top + (rect.height - displayH) / 2
    transform.current = { scale, offX, offY, vw, vh }
  }, [videoRef, videoWidth, videoHeight])

  const scheduleFlush = useCallback(() => {
    if (!onAbsMove) return
    if (rafId.current) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      const lp = latestPointer.current
      if (!lp) return
      const last = lastSent.current
      if (
        !last ||
        last.x !== lp.x ||
        last.y !== lp.y ||
        last.buttons !== lp.buttons
      ) {
        onAbsMove(lp.x, lp.y, lp.buttons)
        lastSent.current = lp
      }
    })
  }, [onAbsMove])

  const computeAbsPayload = (e: PointerEvent) => {
    const v = videoRef.current
    if (v) {
      const vw = v.videoWidth || videoWidth
      const vh = v.videoHeight || videoHeight
      const rect = v.getBoundingClientRect()
      const scale = Math.min(rect.width / vw, rect.height / vh)
      const displayW = vw * scale
      const displayH = vh * scale
      const offX = rect.left + (rect.width - displayW) / 2
      const offY = rect.top + (rect.height - displayH) / 2
      transform.current = { scale, offX, offY, vw, vh }
    }

    const t = transform.current
    const rx = e.clientX - t.offX
    const ry = e.clientY - t.offY
    if (rx < 0 || ry < 0 || rx > t.vw * t.scale || ry > t.vh * t.scale)
      return null
    const x = Math.floor(rx / t.scale)
    const y = Math.floor(ry / t.scale)
    return {
      x: Math.round((x / (t.vw - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE),
      y: Math.round((y / (t.vh - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE),
      buttons: e.buttons || 0,
    }
  }

  const absMouseMovePointerEvent = useCallback(
    (e: PointerEvent) => {
      if (!onAbsMove) return
      if (isEventBlockedByOverlay(e)) return
      if (!isEventOnVideo(e, videoRef)) return
      lastActivityTs.current = Date.now()
      const t = transform.current

      if (mode === 'relative' && isLockedRef.current) {
        if (!virtualPos.current) {
          virtualPos.current = {
            x: Math.floor(t.vw / 2),
            y: Math.floor(t.vh / 2),
          }
        }
        const dx = e.movementX / (t.scale || 1)
        const dy = e.movementY / (t.scale || 1)
        const nx = Math.max(
          0,
          Math.min(t.vw - 1, Math.round(virtualPos.current.x + dx))
        )
        const ny = Math.max(
          0,
          Math.min(t.vh - 1, Math.round(virtualPos.current.y + dy))
        )
        virtualPos.current = { x: nx, y: ny }
        const absX = Math.round(
          (nx / (t.vw - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE
        )
        const absY = Math.round(
          (ny / (t.vh - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE
        )
        latestPointer.current = { x: absX, y: absY, buttons: e.buttons || 0 }
        scheduleFlush()
        return
      }

      const payload = computeAbsPayload(e)
      if (!payload) return
      latestPointer.current = payload
      scheduleFlush()
    },
    [onAbsMove, mode, scheduleFlush]
  )

  const lastClientRef = useRef<{ x: number; y: number } | null>(null)
  const relAggRef = useRef<{ dx: number; dy: number; buttons: number }>({
    dx: 0,
    dy: 0,
    buttons: 0,
  })
  const relRafIdRef = useRef<number | null>(null)
  const clampI8 = (n: number) =>
    Math.max(MOUSE_CONSTANTS.INT8_MIN, Math.min(MOUSE_CONSTANTS.INT8_MAX, n))
  const relMouseMovePointerEvent = useCallback(
    (e: PointerEvent) => {
      if (!onRelMove || mode !== 'relative') return
      if (isEventBlockedByOverlay(e)) return

      if (!isLockedRef.current && !isEventOnVideo(e, videoRef)) return
      lastActivityTs.current = Date.now()
      let { movementX, movementY, buttons } = e as any

      if (!isLockedRef.current) {
        const lc = lastClientRef.current
        if (lc) {
          movementX = e.clientX - lc.x
          movementY = e.clientY - lc.y
        }
        lastClientRef.current = { x: e.clientX, y: e.clientY }
      }

      const dxRaw = movementX || 0
      const dyRaw = movementY || 0
      relAggRef.current.dx += dxRaw
      relAggRef.current.dy += dyRaw
      relAggRef.current.buttons = buttons || 0
      if (relRafIdRef.current == null) {
        relRafIdRef.current = requestAnimationFrame(() => {
          relRafIdRef.current = null
          let { dx, dy, buttons } = relAggRef.current
          relAggRef.current = { dx: 0, dy: 0, buttons }

          dx = Math.max(
            -MOUSE_CONSTANTS.MAX_DELTA_PER_FRAME,
            Math.min(MOUSE_CONSTANTS.MAX_DELTA_PER_FRAME, dx)
          )
          dy = Math.max(
            -MOUSE_CONSTANTS.MAX_DELTA_PER_FRAME,
            Math.min(MOUSE_CONSTANTS.MAX_DELTA_PER_FRAME, dy)
          )
          dx = Math.trunc(dx)
          dy = Math.trunc(dy)
          while (dx !== 0 || dy !== 0) {
            const stepX = clampI8(dx)
            const stepY = clampI8(dy)
            if (stepX === 0 && stepY === 0) break
            onRelMove({
              dx: stepX,
              dy: stepY,
              buttons,
              y: movementY,
              x: movementX,
            })
            dx -= stepX
            dy -= stepY
          }
        })
      }
    },
    [onRelMove, mode]
  )

  const requestPointerLock = useCallback(() => {
    if (mode !== 'relative' || !POINTER_LOCK_AVAILABLE) return
    const v = videoRef.current
    if (!v) return
    try {
      v.requestPointerLock()
    } catch {}
  }, [mode, videoRef])
  const onWheelInternal = useCallback(
    (e: WheelEvent) => {
      if (throttleMs > 0 && blockWheelEventRef.current) {
        e.preventDefault()
        return
      }
      if (isEventBlockedByOverlay(e)) return
      lastActivityTs.current = Date.now()
      if (!onWheel) return

      const t = transform.current
      const rx = e.clientX - t.offX
      const ry = e.clientY - t.offY
      const inArea = !(
        rx < 0 ||
        ry < 0 ||
        rx > t.vw * t.scale ||
        ry > t.vh * t.scale
      )
      if (!inArea) return

      const { deltaX, deltaY } = e
      wheelAcc.current += deltaY
      if (wheelTimer.current) return
      wheelTimer.current = window.setTimeout(() => {
        const total = wheelAcc.current
        wheelAcc.current = 0
        if (wheelTimer.current) clearTimeout(wheelTimer.current)
        wheelTimer.current = null

        const isAccel = Math.abs(total) >= MOUSE_CONSTANTS.SCROLL_THRESHOLD
        const accelScrollValue = total / MOUSE_CONSTANTS.SCROLL_THRESHOLD
        const noAccelScrollValue = Math.sign(total)
        const scrollValue = isAccel ? accelScrollValue : noAccelScrollValue
        const clamped = Math.max(
          MOUSE_CONSTANTS.SCROLL_CLAMP_MIN,
          Math.min(MOUSE_CONSTANTS.SCROLL_CLAMP_MAX, scrollValue)
        )
        const wheelY = -clamped
        onWheel({ deltaX, deltaY: total, wheelY })

        if (throttleMs > 0) {
          blockWheelEventRef.current = true
          setTimeout(() => {
            blockWheelEventRef.current = false
          }, throttleMs)
        }
      }, throttleMs) as unknown as number
    },
    [onWheel, throttleMs]
  )

  const inEffectiveAreaByClient = (clientX: number, clientY: number) => {
    const t = transform.current
    const rx = clientX - t.offX
    const ry = clientY - t.offY
    return !(rx < 0 || ry < 0 || rx > t.vw * t.scale || ry > t.vh * t.scale)
  }

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (mode === 'relative' && POINTER_LOCK_AVAILABLE) {
        requestPointerLock()
      }
      if (!onClick) return
      if (isEventBlockedByOverlay(e)) return
      if (!isEventOnVideo(e, videoRef)) return
      lastActivityTs.current = Date.now()
      if (!inEffectiveAreaByClient(e.clientX, e.clientY)) return
      if (e.detail >= 2) return
      onClick(e.button)
    },
    [onClick, mode, requestPointerLock]
  )

  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      if (!onDoubleClick) return
      if (isEventBlockedByOverlay(e)) return
      if (!isEventOnVideo(e, videoRef)) return
      lastActivityTs.current = Date.now()
      if (!inEffectiveAreaByClient(e.clientX, e.clientY)) return
      const payload = computeAbsPayload(e as unknown as PointerEvent)
      if (!payload) return
      onDoubleClick(e.button, payload.x, payload.y)
    },
    [onDoubleClick]
  )

  const handleRightClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      if (!onRightClick) return
      if (isEventBlockedByOverlay(e)) return
      if (!isEventOnVideo(e, videoRef)) return
      lastActivityTs.current = Date.now()
      if (!inEffectiveAreaByClient(e.clientX, e.clientY)) return
      onRightClick(e.button)
    },
    [onRightClick]
  )

  const absPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!onAbsMove) return
      if (isEventBlockedByOverlay(e)) return
      if (!isEventOnVideo(e, videoRef)) return
      const payload = computeAbsPayload(e)
      if (!payload) return
      lastSent.current = null
      onAbsMove(payload.x, payload.y, payload.buttons)
    },
    [onAbsMove]
  )

  const absPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!onAbsMove) return
      if (isEventBlockedByOverlay(e)) return
      if (!isEventOnVideo(e, videoRef)) return
      const payload = computeAbsPayload(e)
      if (!payload) return
      lastSent.current = null
      onAbsMove(payload.x, payload.y, payload.buttons)
    },
    [onAbsMove]
  )

  const relPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!onRelMove || mode !== 'relative') return
      if (isEventBlockedByOverlay(e)) return
      if (!isLockedRef.current && !isEventOnVideo(e, videoRef)) return
      const buttons = (e as any).buttons || 0
      onRelMove({
        dx: 0,
        dy: 0,
        buttons,
        x: (e as any).movementX || 0,
        y: (e as any).movementY || 0,
      })
    },
    [onRelMove, mode]
  )

  const relPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!onRelMove || mode !== 'relative') return
      if (isEventBlockedByOverlay(e)) return
      if (!isLockedRef.current && !isEventOnVideo(e, videoRef)) return
      const buttons = (e as any).buttons || 0
      onRelMove({
        dx: 0,
        dy: 0,
        buttons,
        x: (e as any).movementX || 0,
        y: (e as any).movementY || 0,
      })
    },
    [onRelMove, mode]
  )

  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null)
  const tapTimeoutRef = useRef<number | null>(null)
  const touchEndTimerRef = useRef<number | null>(null) // Track touchEnd setTimeout
  const jigglerResetTimerRef = useRef<number | null>(null) // Track jiggler reset setTimeout
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const touch = e.touches[0]
      if (!touch) return

      const now = Date.now()
      const currentTap = {
        time: now,
        x: touch.clientX,
        y: touch.clientY,
      }

      let isDoubleClick = false
      if (lastTapRef.current) {
        const timeDiff = now - lastTapRef.current.time
        const distance = Math.sqrt(
          Math.pow(currentTap.x - lastTapRef.current.x, 2) +
            Math.pow(currentTap.y - lastTapRef.current.y, 2)
        )

        if (
          timeDiff < TOUCH_CONSTANTS.DOUBLE_TAP_DELAY &&
          distance < TOUCH_CONSTANTS.DOUBLE_TAP_DISTANCE
        ) {
          isDoubleClick = true
          lastTapRef.current = null

          if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current)
            tapTimeoutRef.current = null
          }

          if (onDoubleClick) {
            const fakePointer = new PointerEvent('pointerdown', {
              bubbles: true,
              cancelable: true,
              clientX: currentTap.x,
              clientY: currentTap.y,
              button: 0,
              buttons: 1,
              pointerId: 1,
              pointerType: 'touch',
            })
            const payload = computeAbsPayload(fakePointer)
            if (payload) {
              onDoubleClick(0, payload.x, payload.y)
            }
          }
          return
        } else {
          lastTapRef.current = currentTap
        }
      } else {
        lastTapRef.current = currentTap
      }

      if (!isDoubleClick) {
        tapTimeoutRef.current = setTimeout(() => {
          const pointerEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0,
            buttons: 1,
            pointerId: 1,
            pointerType: 'touch',
          })

          if (mode === 'relative') {
            relPointerDown(pointerEvent)
          } else {
            absPointerDown(pointerEvent)
          }

          tapTimeoutRef.current = null
        }, TOUCH_CONSTANTS.DOUBLE_TAP_DELAY / 2)
      }
    },
    [mode, relPointerDown, absPointerDown, onDoubleClick]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const touch = e.touches[0]
      if (!touch) return

      const pointerEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        buttons: 1,
        pointerId: 1,
        pointerType: 'touch',
      })

      if (mode === 'relative') {
        relMouseMovePointerEvent(pointerEvent)
      } else {
        absMouseMovePointerEvent(pointerEvent)
      }
    },
    [mode, relMouseMovePointerEvent, absMouseMovePointerEvent]
  )

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const touch = e.changedTouches[0]
      if (!touch) return

      // Clear previous touchEnd timer to prevent leaks
      if (touchEndTimerRef.current) {
        clearTimeout(touchEndTimerRef.current)
        touchEndTimerRef.current = null
      }

      if (tapTimeoutRef.current) {
        touchEndTimerRef.current = window.setTimeout(
          () => {
            touchEndTimerRef.current = null
            const pointerEvent = new PointerEvent('pointerup', {
              bubbles: true,
              cancelable: true,
              clientX: touch.clientX,
              clientY: touch.clientY,
              button: 0,
              buttons: 0,
              pointerId: 1,
              pointerType: 'touch',
            })

            if (mode === 'relative') {
              relPointerUp(pointerEvent)
            } else {
              absPointerUp(pointerEvent)
            }
          },
          TOUCH_CONSTANTS.DOUBLE_TAP_DELAY / 2 +
            TOUCH_CONSTANTS.TAP_DELAY_OFFSET
        ) as unknown as number
      } else {
        const pointerEvent = new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          clientX: touch.clientX,
          clientY: touch.clientY,
          button: 0,
          buttons: 0,
          pointerId: 1,
          pointerType: 'touch',
        })

        if (mode === 'relative') {
          relPointerUp(pointerEvent)
        } else {
          absPointerUp(pointerEvent)
        }
      }
    },
    [mode, relPointerUp, absPointerUp]
  )

  useEffect(() => {
    if (!enabled) {
      return
    }
    const v = videoRef.current
    const isRelativeMouseMode = mode === 'relative'
    if (!v) return

    recomputeTransform()
    const resizeObs = new ResizeObserver(entries => {
      requestAnimationFrame(() => {
        recomputeTransform()
      })
    })
    resizeObs.observe(v)

    if (v.parentElement) {
      resizeObs.observe(v.parentElement)

      if (v.parentElement.parentElement) {
        resizeObs.observe(v.parentElement.parentElement)
      }
    }

    const intersectionObs = new IntersectionObserver(
      () => {
        requestAnimationFrame(() => {
          recomputeTransform()
        })
      },
      { threshold: [0, 0.1, 0.5, 0.9, 1.0] }
    )
    intersectionObs.observe(v)

    const onWindowResize = () => {
      requestAnimationFrame(() => {
        recomputeTransform()
      })
    }
    window.addEventListener('resize', onWindowResize)

    v.addEventListener('loadedmetadata', recomputeTransform)

    const targetElement: EventTarget = document
    targetElement.addEventListener(
      'pointermove',
      isRelativeMouseMode
        ? relMouseMovePointerEvent
        : (absMouseMovePointerEvent as any),
      { passive: true }
    )
    if (isRelativeMouseMode) {
      targetElement.addEventListener('pointerdown', relPointerDown as any, {
        passive: true,
      })
      targetElement.addEventListener('pointerup', relPointerUp as any, {
        passive: true,
      })
    } else {
      targetElement.addEventListener('pointerdown', absPointerDown as any, {
        passive: true,
      })
      targetElement.addEventListener('pointerup', absPointerUp as any, {
        passive: true,
      })
    }

    document.addEventListener('wheel', onWheelInternal as any, {
      passive: throttleMs <= 0,
    })

    const onVis = () => {
      if (document.hidden) latestPointer.current = null
    }
    document.addEventListener('visibilitychange', onVis)

    const onLockChange = () => {
      const locked = document.pointerLockElement === v
      isLockedRef.current = locked
      lastClientRef.current = null
    }
    document.addEventListener('pointerlockchange', onLockChange)

    const handleVideoClickForPointerLock = () => {
      if (
        isRelativeMouseMode &&
        POINTER_LOCK_AVAILABLE &&
        !isLockedRef.current
      ) {
        try {
          v.requestPointerLock()
        } catch {}
      }
    }
    v.addEventListener('click', handleVideoClickForPointerLock)

    targetElement.addEventListener('click', handleClick as any)
    targetElement.addEventListener('dblclick', handleDoubleClick as any)
    targetElement.addEventListener('contextmenu', handleRightClick as any)

    if (!isCursorHidden) {
      v.addEventListener('touchstart', handleTouchStart as any, {
        passive: false,
      })
      v.addEventListener('touchmove', handleTouchMove as any, {
        passive: false,
      })
      v.addEventListener('touchend', handleTouchEnd as any, { passive: false })
    }

    return () => {
      try {
        resizeObs.disconnect()
        intersectionObs.disconnect()
      } catch {}
      v.removeEventListener('loadedmetadata', recomputeTransform as any)
      window.removeEventListener('resize', onWindowResize)

      document.removeEventListener(
        'pointermove',
        relMouseMovePointerEvent as any
      )
      document.removeEventListener(
        'pointermove',
        absMouseMovePointerEvent as any
      )
      document.removeEventListener('pointerdown', relPointerDown as any)
      document.removeEventListener('pointerup', relPointerUp as any)
      document.removeEventListener('pointerdown', absPointerDown as any)
      document.removeEventListener('pointerup', absPointerUp as any)
      document.removeEventListener('wheel', onWheelInternal as any)
      document.removeEventListener('click', handleClick as any)
      document.removeEventListener('dblclick', handleDoubleClick as any)
      document.removeEventListener('contextmenu', handleRightClick as any)
      v.removeEventListener('click', handleVideoClickForPointerLock)

      if (!isCursorHidden) {
        v.removeEventListener('touchstart', handleTouchStart as any)
        v.removeEventListener('touchmove', handleTouchMove as any)
        v.removeEventListener('touchend', handleTouchEnd as any)
      }

      document.removeEventListener('visibilitychange', onVis)
      document.removeEventListener('pointerlockchange', onLockChange)

      if (wheelTimer.current) {
        clearTimeout(wheelTimer.current)
        wheelTimer.current = null
      }
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current)
        tapTimeoutRef.current = null
      }
      // Clear touchEnd timer
      if (touchEndTimerRef.current) {
        clearTimeout(touchEndTimerRef.current)
        touchEndTimerRef.current = null
      }
    }
  }, [
    videoRef,
    recomputeTransform,
    absMouseMovePointerEvent,
    onWheelInternal,
    handleClick,
    handleDoubleClick,
    handleRightClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    mode,
    requestPointerLock,
    enabled,
    throttleMs,
    isCursorHidden,
  ])

  useEffect(() => {
    if (!enabled || !jiggler) {
      if (jigglerTimer.current) {
        clearTimeout(jigglerTimer.current)
        jigglerTimer.current = null
      }
      return
    }

    if (jigglerTimer.current) {
      clearTimeout(jigglerTimer.current)
      jigglerTimer.current = null
    }

    const scheduleJiggle = () => {
      jigglerTimer.current = window.setTimeout(() => {
        if (document.hidden) {
          scheduleJiggle()
          return
        }
        if (mode === 'relative' ? !onRelMove : !onAbsMove) {
          scheduleJiggle()
          return
        }
        const now = Date.now()
        if (now - lastActivityTs.current < JIGGLER_CONSTANTS.IDLE_MS) {
          scheduleJiggle()
          return
        }

        try {
          // Clear previous jiggler reset timer
          if (jigglerResetTimerRef.current) {
            clearTimeout(jigglerResetTimerRef.current)
            jigglerResetTimerRef.current = null
          }

          if (mode === 'relative' && onRelMove) {
            onRelMove({
              dx: JIGGLER_CONSTANTS.AMPLITUDE,
              dy: 0,
              buttons: 0,
              x: JIGGLER_CONSTANTS.AMPLITUDE,
              y: 0,
            })
            jigglerResetTimerRef.current = window.setTimeout(() => {
              jigglerResetTimerRef.current = null
              onRelMove({
                dx: -JIGGLER_CONSTANTS.AMPLITUDE,
                dy: 0,
                buttons: 0,
                x: -JIGGLER_CONSTANTS.AMPLITUDE,
                y: 0,
              })
            }, JIGGLER_CONSTANTS.RESET_DELAY) as unknown as number
          } else if (onAbsMove) {
            const t = transform.current
            const centerX = Math.round(
              ((t.vw - 1) / 2 / (t.vw - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE
            )
            const centerY = Math.round(
              ((t.vh - 1) / 2 / (t.vh - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE
            )
            const base = lastSent.current ??
              latestPointer.current ?? { x: centerX, y: centerY, buttons: 0 }
            const x1 = Math.max(
              0,
              Math.min(
                MOUSE_CONSTANTS.MAX_COORDINATE,
                base.x + JIGGLER_CONSTANTS.AMPLITUDE
              )
            )
            const y1 = base.y
            const x2 = Math.max(
              0,
              Math.min(MOUSE_CONSTANTS.MAX_COORDINATE, base.x)
            )
            const y2 = base.y
            onAbsMove(x1, y1, 0)
            jigglerResetTimerRef.current = window.setTimeout(() => {
              jigglerResetTimerRef.current = null
              onAbsMove(x2, y2, 0)
            }, JIGGLER_CONSTANTS.RESET_DELAY) as unknown as number
          }
        } catch {
          /* ignore */
        }
        scheduleJiggle()
      }, JIGGLER_CONSTANTS.PERIOD_MS) as unknown as number
    }

    scheduleJiggle()

    return () => {
      if (jigglerTimer.current) {
        clearTimeout(jigglerTimer.current)
        jigglerTimer.current = null
      }
      // Also clear the jiggler reset timer
      if (jigglerResetTimerRef.current) {
        clearTimeout(jigglerResetTimerRef.current)
        jigglerResetTimerRef.current = null
      }
    }
  }, [
    enabled,
    jiggler,
    onRelMove,
    onAbsMove,
    mode,
    transform,
    lastActivityTs,
    lastSent,
    latestPointer,
  ])
}
