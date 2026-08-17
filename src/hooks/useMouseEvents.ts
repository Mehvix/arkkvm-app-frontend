import { useCallback, useEffect, useRef } from 'react';
import type { MouseInputMode } from '@/components/settings/UsbMouseModeSync';

type AbsMoveHandler = (x: number, y: number, buttons: number) => void
type RelMoveHandler = (params: {
  dx: number
  dy: number
  buttons: number
  x: number
  y: number
}) => void
type ClickEventHandler = (button: number) => void
export type DoubleClickSource = 'mouse' | 'touch'
type DoubleClickEventHandler = (
  button: number,
  x: number,
  y: number,
  source: DoubleClickSource,
) => void

interface MouseEventsOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  onAbsMove?: AbsMoveHandler
  onRelMove?: RelMoveHandler
  onWheel?: (data: {
    deltaX: number
    deltaY: number
    wheelX: number
    wheelY: number
  }) => void
  onClick?: ClickEventHandler
  onDoubleClick?: DoubleClickEventHandler
  onRightClick?: ClickEventHandler
  mode?: MouseInputMode
  videoWidth?: number
  videoHeight?: number
  enabled?: boolean
  scrollThrottling?: number | boolean
  invertScroll?: boolean
  jiggler?: boolean
  isCursorHidden?: boolean
  /** HDMI connection state - when not 'ready', bypass coordinate deduplication to allow wake-from-sleep */
  hdmiConnectionState?: string
}

// Cursor visibility is controlled by the Hide Cursor setting only.
// const POINTER_LOCK_AVAILABLE =
//   window.location.protocol === 'https:' ||
//   window.location.hostname === 'localhost';


const MOUSE_CONSTANTS = {
  MAX_COORDINATE: 32767,
  MAX_DELTA_PER_FRAME: 500,
  INT8_MIN: -128,
  INT8_MAX: 127,
  DEFAULT_THROTTLE_MS: 60,
} as const;

const normalizeWheelDelta = (delta: number): number => {
  if (!Number.isFinite(delta) || delta === 0) {
    return 0;
  }

  const normalized =
    Math.abs(delta) >= 100 ? delta / 100 : Math.sign(delta);

  const clamped = Math.max(-127, Math.min(127, normalized));

  return Math.trunc(clamped) || Math.sign(clamped);
};

const TOUCH_CONSTANTS = {
  DOUBLE_TAP_DELAY: 400,
  DOUBLE_TAP_DISTANCE: 30,
  TAP_DELAY_OFFSET: 50,
} as const;

const JIGGLER_CONSTANTS = {
  IDLE_MS: 20_000,
  PERIOD_MS: 30_000,
  AMPLITUDE: 1,
  RESET_DELAY: 16,
} as const;

const isEventOnVideo = (
  e: PointerEvent | MouseEvent,
  videoRef: React.RefObject<HTMLVideoElement | null>
): boolean => {
  const target = e.target as HTMLElement;
  const video = videoRef.current;
  if (!video || !target) return false;
  // Primary check: event originated directly on or inside the video element.
  if (target === video || video.contains(target)) return true;
  // Fallback: coordinate-based hit-test.
  // When video has no content (sleep/no-signal), use the [data-video-area] overlay rect
  // so that only events inside the signal area trigger wake-from-sleep HID input.
  const videoRect = video.getBoundingClientRect();
  const hasVideoSize = videoRect.width > 0 && videoRect.height > 0;
  const hitRect = hasVideoSize
    ? videoRect
    : (video.closest('.relative')?.querySelector('[data-video-area]')?.getBoundingClientRect() ?? videoRect);
  return (
    e.clientX >= hitRect.left &&
    e.clientX <= hitRect.right &&
    e.clientY >= hitRect.top &&
    e.clientY <= hitRect.bottom
  );
};

const getRelativeMouseAreaRect = (
  video: HTMLVideoElement
): DOMRect | null => {
  return (
    video.parentElement?.getBoundingClientRect() ??
    video.getBoundingClientRect()
  );
};

const isEventInRelativeMouseArea = (
  e: PointerEvent | MouseEvent,
  videoRef: React.RefObject<HTMLVideoElement | null>
): boolean => {
  const video = videoRef.current;
  if (!video) return false;
  const rect = getRelativeMouseAreaRect(video);
  if (!rect) return false;
  return (
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom
  );
};

const isEventBlockedByOverlay = (e: Event): boolean => {
  const target = e.target as HTMLElement;
  if (!target) return false;
  // Check if target or any ancestor has data-kvm-ignore attribute
  if (target.closest('[data-kvm-ignore="true"]')) return true;
  return !!target.closest(
    '[role="dialog"], [role="alertdialog"], [data-radix-dialog-overlay], [data-radix-popover-content], [data-slot="dialog-overlay"], [data-slot="dialog-content"], [data-panel], [data-sidebar]'
  );
};

const isTouchLikePointer = (e: PointerEvent): boolean => {
  return e.pointerType === 'touch' || e.pointerType === 'pen';
};

const getControlSurface = (
  videoRef: React.RefObject<HTMLVideoElement | null>
): HTMLElement | null => {
  const video = videoRef.current;
  return (
    video?.closest('[data-kvm-control-surface="true"]') as HTMLElement | null
  ) ?? video?.parentElement ?? null;
};

const focusControlSurface = (
  videoRef: React.RefObject<HTMLVideoElement | null>
): void => {
  const surface = getControlSurface(videoRef);
  try {
    surface?.focus({ preventScroll: true });
  } catch {}
};

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
    invertScroll = false,
    jiggler,
    isCursorHidden = false,
  } = options;
  const enabled = options.enabled ?? true;

  const throttleMs =
    typeof scrollThrottling === 'number'
      ? Math.max(0, scrollThrottling)
      : scrollThrottling
        ? MOUSE_CONSTANTS.DEFAULT_THROTTLE_MS
        : 0;

  const latestPointer = useRef<{
    x: number
    y: number
    buttons: number
  } | null>(null);
  const lastSent = useRef<{ x: number; y: number; buttons: number } | null>(
    null
  );
  const blockWheelEventRef = useRef(false);
  const wheelBlockTimerRef = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const lastActivityTs = useRef<number>(Date.now());
  const jigglerTimer = useRef<number | null>(null);

  const transform = useRef({
    scale: 1,
    offX: 0,
    offY: 0,
    vw: videoWidth,
    vh: videoHeight,
  });

  const virtualPos = useRef<{ x: number; y: number } | null>(null);
  const isLockedRef = useRef(false);

  const recomputeTransform = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const vw = v.videoWidth || videoWidth;
    const vh = v.videoHeight || videoHeight;
    const rect = v.getBoundingClientRect();
    const scale = Math.min(rect.width / vw, rect.height / vh);
    const displayW = vw * scale;
    const displayH = vh * scale;
    const offX = rect.left + (rect.width - displayW) / 2;
    const offY = rect.top + (rect.height - displayH) / 2;
    transform.current = { scale, offX, offY, vw, vh };

  }, [videoRef, videoWidth, videoHeight]);

  const scheduleFlush = useCallback(() => {
    if (!onAbsMove) {

      return;
    }
    if (rafId.current) {

      return;
    }
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      const lp = latestPointer.current;
      if (!lp) {

        return;
      }
      const last = lastSent.current;
      const hdmiNotReady = options.hdmiConnectionState !== 'ready';
      // Bypass deduplication when HDMI has no signal (S3/sleep state) to allow wake-from-sleep
      if (
        !last ||
        last.x !== lp.x ||
        last.y !== lp.y ||
        last.buttons !== lp.buttons ||
        hdmiNotReady
      ) {

        onAbsMove(lp.x, lp.y, lp.buttons);
        lastSent.current = lp;
      } else {

      }
    });
  }, [onAbsMove, options.hdmiConnectionState]);

  const computeAbsPayload = (e: PointerEvent) => {
    const v = videoRef.current;
    if (v) {
      const vw = v.videoWidth || videoWidth;
      const vh = v.videoHeight || videoHeight;
      const rect = v.getBoundingClientRect();
      const scale = Math.min(rect.width / vw, rect.height / vh);
      const displayW = vw * scale;
      const displayH = vh * scale;
      const offX = rect.left + (rect.width - displayW) / 2;
      const offY = rect.top + (rect.height - displayH) / 2;
      transform.current = { scale, offX, offY, vw, vh };
    }

    const t = transform.current;
    // Guard against invalid transform when video has no signal (zero dimensions)
    if (t.scale <= 0 || t.vw <= 0 || t.vh <= 0) {
      return { x: 0, y: 0, buttons: e.buttons || 0 };
    }
    const rx = e.clientX - t.offX;
    const ry = e.clientY - t.offY;
    if (rx < 0 || ry < 0 || rx > t.vw * t.scale || ry > t.vh * t.scale)
      return null;
    const x = Math.floor(rx / t.scale);
    const y = Math.floor(ry / t.scale);
    // Guard against NaN from divide-by-zero when video dimensions are 1
    const normalizedX = t.vw > 1 ? Math.round((x / (t.vw - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE) : 0;
    const normalizedY = t.vh > 1 ? Math.round((y / (t.vh - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE) : 0;
    return {
      x: normalizedX,
      y: normalizedY,
      buttons: e.buttons || 0,
    };
  };


  const absMouseMovePointerEvent = useCallback(
    (e: PointerEvent) => {
      if (!onAbsMove) return;
      if (isEventBlockedByOverlay(e)) return;
      if (!isEventOnVideo(e, videoRef)) return;
      focusControlSurface(videoRef);
      lastActivityTs.current = Date.now();
      const t = transform.current;

      if (mode === 'relative' && isLockedRef.current) {
        if (!virtualPos.current) {
          virtualPos.current = {
            x: Math.floor(t.vw / 2),
            y: Math.floor(t.vh / 2),
          };
        }
        const dx = e.movementX / (t.scale || 1);
        const dy = e.movementY / (t.scale || 1);
        const nx = Math.max(
          0,
          Math.min(t.vw - 1, Math.round(virtualPos.current.x + dx))
        );
        const ny = Math.max(
          0,
          Math.min(t.vh - 1, Math.round(virtualPos.current.y + dy))
        );
        virtualPos.current = { x: nx, y: ny };
        const absX = Math.round((nx / (t.vw - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE);
        const absY = Math.round((ny / (t.vh - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE);
        latestPointer.current = { x: absX, y: absY, buttons: e.buttons || 0 };
        scheduleFlush();
        return;
      }

      const payload = computeAbsPayload(e);
      if (!payload) {

        return;
      }
      latestPointer.current = payload;
      scheduleFlush();
    },
    [onAbsMove, mode, scheduleFlush]
  );

  const lastClientRef = useRef<{ x: number; y: number } | null>(null);
  const relAggRef = useRef<{ dx: number; dy: number; buttons: number }>({
    dx: 0,
    dy: 0,
    buttons: 0,
  });
  const relRafIdRef = useRef<number | null>(null);
  const clampI8 = (n: number) =>
    Math.max(MOUSE_CONSTANTS.INT8_MIN, Math.min(MOUSE_CONSTANTS.INT8_MAX, n));
  const relMouseMovePointerEvent = useCallback(
    (e: PointerEvent) => {
      if (!onRelMove || mode !== 'relative') return;
      if (isEventBlockedByOverlay(e)) return;
      // When pointer lock is active, movement is unbounded by element edges.
      if (!isLockedRef.current && !isEventInRelativeMouseArea(e, videoRef)) return;
      focusControlSurface(videoRef);
      lastActivityTs.current = Date.now();
      let { movementX, movementY, buttons } = e;

      if (!isLockedRef.current) {
        const lc = lastClientRef.current;
        if (lc) {
          movementX = e.clientX - lc.x;
          movementY = e.clientY - lc.y;
        }
        lastClientRef.current = { x: e.clientX, y: e.clientY };
      }

      const dxRaw = movementX || 0;
      const dyRaw = movementY || 0;
      relAggRef.current.dx += dxRaw;
      relAggRef.current.dy += dyRaw;
      relAggRef.current.buttons = buttons || 0;
      if (relRafIdRef.current == null) {
        relRafIdRef.current = requestAnimationFrame(() => {
          relRafIdRef.current = null;
          let { dx, dy, buttons } = relAggRef.current;
          relAggRef.current = { dx: 0, dy: 0, buttons };

          dx = Math.max(-MOUSE_CONSTANTS.MAX_DELTA_PER_FRAME, Math.min(MOUSE_CONSTANTS.MAX_DELTA_PER_FRAME, dx));
          dy = Math.max(-MOUSE_CONSTANTS.MAX_DELTA_PER_FRAME, Math.min(MOUSE_CONSTANTS.MAX_DELTA_PER_FRAME, dy));
          dx = Math.trunc(dx);
          dy = Math.trunc(dy);
          while (dx !== 0 || dy !== 0) {
            const stepX = clampI8(dx);
            const stepY = clampI8(dy);
            if (stepX === 0 && stepY === 0) break;
            onRelMove({
              dx: stepX,
              dy: stepY,
              buttons,
              y: movementY,
              x: movementX,
            });
            dx -= stepX;
            dy -= stepY;
          }
        });
      }
    },
    [onRelMove, mode]
  );

  // const requestPointerLock = useCallback(() => {
  //   if (mode !== 'relative' || !POINTER_LOCK_AVAILABLE) return;
  //   const v = videoRef.current;
  //   if (!v) return;
  //   try {
  //     v.requestPointerLock();
  //   } catch {}
  // }, [mode, videoRef]);
  const onWheelInternal = useCallback(
    (e: WheelEvent) => {
      if (isEventBlockedByOverlay(e)) return;

      lastActivityTs.current = Date.now();

      if (!onWheel) return;

      recomputeTransform();

      const t = transform.current;
      const rx = e.clientX - t.offX;
      const ry = e.clientY - t.offY;

      const inArea =
        rx >= 0 &&
        ry >= 0 &&
        rx <= t.vw * t.scale &&
        ry <= t.vh * t.scale;

      if (!inArea) return;

      e.preventDefault();

      if (throttleMs > 0 && blockWheelEventRef.current) {
        return;
      }

      const wheelY =
        (invertScroll ? 1 : -1) * normalizeWheelDelta(e.deltaY);

      const wheelX =
        (invertScroll ? -1 : 1) * normalizeWheelDelta(e.deltaX);

      if (wheelY === 0 && wheelX === 0) {
        return;
      }
      onWheel({
        deltaX: ~~e.deltaX,
        deltaY: ~~e.deltaY,
        wheelX: ~~wheelX,
        wheelY:~~wheelY,
      });

      if (throttleMs > 0) {
        blockWheelEventRef.current = true;

        if (wheelBlockTimerRef.current !== null) {
          window.clearTimeout(wheelBlockTimerRef.current);
        }

        wheelBlockTimerRef.current = window.setTimeout(() => {
          blockWheelEventRef.current = false;
          wheelBlockTimerRef.current = null;
        }, throttleMs);
      }
    },
    [onWheel, throttleMs, recomputeTransform, isEventBlockedByOverlay, invertScroll]
  );

  const inEffectiveAreaByClient = (clientX: number, clientY: number) => {
    const t = transform.current;
    const rx = clientX - t.offX;
    const ry = clientY - t.offY;
    return !(rx < 0 || ry < 0 || rx > t.vw * t.scale || ry > t.vh * t.scale);
  };

  const handleClick = useCallback(
    (e: MouseEvent) => {
      // Cursor visibility is controlled by the Hide Cursor setting only.
      // if (mode === 'relative' && POINTER_LOCK_AVAILABLE) {
      //   requestPointerLock();
      // }
      if (!onClick) return;
      if (isEventBlockedByOverlay(e)) return;
      if (!isEventOnVideo(e, videoRef)) return;
      lastActivityTs.current = Date.now();
      if (!inEffectiveAreaByClient(e.clientX, e.clientY)) return;
      if (e.detail >= 2) return;
      onClick(e.button);
    },
    [onClick]
  );

  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      if (!onDoubleClick) return;
      if (isEventBlockedByOverlay(e)) return;
      if (!isEventOnVideo(e, videoRef)) return;
      lastActivityTs.current = Date.now();
      if (!inEffectiveAreaByClient(e.clientX, e.clientY)) return;
      const payload = computeAbsPayload(e as unknown as PointerEvent);
      if (!payload) return;
      onDoubleClick(e.button, payload.x, payload.y, 'mouse');
    },
    [onDoubleClick]
  );

  const handleRightClick = useCallback(
    (e: MouseEvent) => {
      // Check if event should be blocked before preventing default
      if (isEventBlockedByOverlay(e)) {
        // Allow native context menu for settings panel
        return;
      }
      e.preventDefault();
      if (!onRightClick) return;
      if (!isEventOnVideo(e, videoRef)) return;
      lastActivityTs.current = Date.now();
      if (!inEffectiveAreaByClient(e.clientX, e.clientY)) return;
      onRightClick(e.button);
    },
    [onRightClick]
  );

  const absPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!onAbsMove) return;
      if (isEventBlockedByOverlay(e)) return;
      if (!isEventOnVideo(e, videoRef)) return;
      focusControlSurface(videoRef);
      try {
        getControlSurface(videoRef)?.setPointerCapture(e.pointerId);
      } catch {}
      const payload = computeAbsPayload(e);
      if (!payload) return;
      lastSent.current = payload;
      onAbsMove(payload.x, payload.y, payload.buttons);
    },
    [onAbsMove, videoRef]
  );

  const absPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!onAbsMove) return;
      if (isEventBlockedByOverlay(e)) return;
      if (!isEventOnVideo(e, videoRef)) return;
      try {
        getControlSurface(videoRef)?.releasePointerCapture(e.pointerId);
      } catch {}
      const payload = computeAbsPayload(e);
      if (!payload) return;
      lastSent.current = payload;
      onAbsMove(payload.x, payload.y, payload.buttons);
    },
    [onAbsMove, videoRef]
  );

  const relPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!onRelMove || mode !== 'relative') return;
      if (isEventBlockedByOverlay(e)) return;
      if (!isLockedRef.current && !isEventInRelativeMouseArea(e, videoRef)) return;
      focusControlSurface(videoRef);
      if (isTouchLikePointer(e)) {
        try {
          getControlSurface(videoRef)?.setPointerCapture(e.pointerId);
        } catch {}
      }
      const buttons = e.buttons || 0;
      onRelMove({
        dx: 0,
        dy: 0,
        buttons,
        x: e.movementX || 0,
        y: e.movementY || 0,
      });
    },
    [onRelMove, mode, videoRef]
  );

  const relPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!onRelMove || mode !== 'relative') return;
      if (isEventBlockedByOverlay(e)) return;
      if (!isLockedRef.current && !isEventInRelativeMouseArea(e, videoRef)) return;
      if (isTouchLikePointer(e)) {
        try {
          getControlSurface(videoRef)?.releasePointerCapture(e.pointerId);
        } catch {}
      }
      const buttons = e.buttons || 0;
      onRelMove({
        dx: 0,
        dy: 0,
        buttons,
        x: e.movementX || 0,
        y: e.movementY || 0,
      });
    },
    [onRelMove, mode, videoRef]
  );

  const releasePointerState = useCallback(() => {
    latestPointer.current = null;
    lastClientRef.current = null;
    relAggRef.current = { dx: 0, dy: 0, buttons: 0 };

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    if (relRafIdRef.current) {
      cancelAnimationFrame(relRafIdRef.current);
      relRafIdRef.current = null;
    }

    if (mode === 'relative') {
      onRelMove?.({
        dx: 0,
        dy: 0,
        buttons: 0,
        x: 0,
        y: 0,
      });
      return;
    }

    const last = lastSent.current;
    if (last) {
      onAbsMove?.(last.x, last.y, 0);
    }
  }, [mode, onAbsMove, onRelMove]);

  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const tapTimeoutRef = useRef<number | null>(null);
  const touchEndTimerRef = useRef<number | null>(null); // Track touchEnd setTimeout
  const jigglerResetTimerRef = useRef<number | null>(null); // Track jiggler reset setTimeout
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      if (!touch) return;

      const now = Date.now();
      const currentTap = {
        time: now,
        x: touch.clientX,
        y: touch.clientY,
      };

      let isDoubleClick = false;
      if (lastTapRef.current) {
        const timeDiff = now - lastTapRef.current.time;
        const distance = Math.sqrt(
          Math.pow(currentTap.x - lastTapRef.current.x, 2) +
            Math.pow(currentTap.y - lastTapRef.current.y, 2)
        );

        if (timeDiff < TOUCH_CONSTANTS.DOUBLE_TAP_DELAY && distance < TOUCH_CONSTANTS.DOUBLE_TAP_DISTANCE) {
          isDoubleClick = true;
          lastTapRef.current = null;

          if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
            tapTimeoutRef.current = null;
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
            });
            const payload = computeAbsPayload(fakePointer);
            if (payload) {
              onDoubleClick(0, payload.x, payload.y, 'touch');
            }
          }
          return;
        } else {
          lastTapRef.current = currentTap;
        }
      } else {
        lastTapRef.current = currentTap;
      }

      if (!isDoubleClick) {
        tapTimeoutRef.current = window.setTimeout(() => {
          const pointerEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0,
            buttons: 1,
            pointerId: 1,
            pointerType: 'touch',
          });

          if (mode === 'relative') {
            relPointerDown(pointerEvent);
          } else {
            absPointerDown(pointerEvent);
          }

          tapTimeoutRef.current = null;
        }, TOUCH_CONSTANTS.DOUBLE_TAP_DELAY / 2);
      }
    },
    [mode, relPointerDown, absPointerDown, onDoubleClick]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];

      if (!touch) return;

      const pointerEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        buttons: 1,
        pointerId: 1,
        pointerType: 'touch',
      });
      if (mode === 'relative') {
        relMouseMovePointerEvent(pointerEvent);
      } else {
        absMouseMovePointerEvent(pointerEvent);
      }
    },
    [mode, relMouseMovePointerEvent, absMouseMovePointerEvent]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const touch = e.changedTouches[0];
      if (!touch) return;

      // Clear previous touchEnd timer to prevent leaks
      if (touchEndTimerRef.current) {
        clearTimeout(touchEndTimerRef.current);
        touchEndTimerRef.current = null;
      }

      if (tapTimeoutRef.current) {
        touchEndTimerRef.current = window.setTimeout(
          () => {
            touchEndTimerRef.current = null;
            const pointerEvent = new PointerEvent('pointerup', {
              bubbles: true,
              cancelable: true,
              clientX: touch.clientX,
              clientY: touch.clientY,
              button: 0,
              buttons: 0,
              pointerId: 1,
              pointerType: 'touch',
            });

            if (mode === 'relative') {
              relPointerUp(pointerEvent);
            } else {
              absPointerUp(pointerEvent);
            }
          },
          TOUCH_CONSTANTS.DOUBLE_TAP_DELAY / 2 + TOUCH_CONSTANTS.TAP_DELAY_OFFSET
        ) as unknown as number;
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
        });

        if (mode === 'relative') {
          relPointerUp(pointerEvent);
        } else {
          absPointerUp(pointerEvent);
        }
      }
    },
    [mode, relPointerUp, absPointerUp]
  );

  const handleTouchCancel = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      releasePointerState();
    },
    [releasePointerState]
  );

  useEffect(() => {
    if (!enabled) return;
    const v = videoRef.current;
    const isRelativeMouseMode = mode === 'relative';
    if (!v) return;

    recomputeTransform();
    const resizeObs = new ResizeObserver((_entries) => {

      requestAnimationFrame(() => {

        recomputeTransform();
      });
    });
    resizeObs.observe(v);


    if (v.parentElement) {
      resizeObs.observe(v.parentElement);

      if (v.parentElement.parentElement) {
        resizeObs.observe(v.parentElement.parentElement);

      }
    }

    const intersectionObs = new IntersectionObserver(
      () => {
        requestAnimationFrame(() => {
          recomputeTransform();
        });
      },
      { threshold: [0, 0.1, 0.5, 0.9, 1.0] }
    );
    intersectionObs.observe(v);

    const onWindowResize = () => {
      requestAnimationFrame(() => {
        recomputeTransform();
      });
    };
    window.addEventListener('resize', onWindowResize);

    v.addEventListener('loadedmetadata', recomputeTransform);
    const controlSurface = getControlSurface(videoRef);
    const handleSurfaceEnter = () => {
      focusControlSurface(videoRef);
    };
    const handleSurfaceLeave = () => {
      releasePointerState();
    };
    const handleSurfaceBlur = () => {
      releasePointerState();
    };
    controlSurface?.addEventListener('mouseenter', handleSurfaceEnter);
    controlSurface?.addEventListener('pointermove', handleSurfaceEnter, {
      passive: true,
    });
    controlSurface?.addEventListener('mouseleave', handleSurfaceLeave);
    controlSurface?.addEventListener('blur', handleSurfaceBlur);

    const targetElement: EventTarget = document;
    targetElement.addEventListener(
      'pointermove',
      isRelativeMouseMode
        ? (relMouseMovePointerEvent as EventListener)
        : (absMouseMovePointerEvent as EventListener),
      { passive: true }
    );
    if (isRelativeMouseMode) {
      targetElement.addEventListener('pointerdown', relPointerDown as EventListener, {
        passive: true,
      });
      targetElement.addEventListener('pointerup', relPointerUp as EventListener, {
        passive: true,
      });
      targetElement.addEventListener('pointercancel', releasePointerState as EventListener, {
        passive: true,
      });
    } else {
      targetElement.addEventListener('pointerdown', absPointerDown as EventListener, {
        passive: true,
      });
      targetElement.addEventListener('pointerup', absPointerUp as EventListener, {
        passive: true,
      });
      targetElement.addEventListener('pointercancel', releasePointerState as EventListener, {
        passive: true,
      });
    }

    document.addEventListener('wheel', onWheelInternal as EventListener, {
      passive: false,
    });

    const onVis = () => {
      if (document.hidden) releasePointerState();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', releasePointerState);

    const onLockChange = () => {
      const locked = document.pointerLockElement === v;
      isLockedRef.current = locked;
      lastClientRef.current = null;
    };
    document.addEventListener('pointerlockchange', onLockChange);

    // Cursor visibility is controlled by the Hide Cursor setting only.
    // const handleVideoClickForPointerLock = () => {
    //   if (isRelativeMouseMode && POINTER_LOCK_AVAILABLE && !isLockedRef.current) {
    //     try {
    //       v.requestPointerLock();
    //     } catch {}
    //   }
    // };
    // v.addEventListener('click', handleVideoClickForPointerLock);

    targetElement.addEventListener('click', handleClick as EventListener);
    targetElement.addEventListener('dblclick', handleDoubleClick as EventListener);
    targetElement.addEventListener('contextmenu', handleRightClick as EventListener);

    if (!isCursorHidden) {
      v.addEventListener('touchstart', handleTouchStart as EventListener, {
        passive: false,
      });
      v.addEventListener('touchmove', handleTouchMove as EventListener, {
        passive: false,
      });
      v.addEventListener('touchend', handleTouchEnd as EventListener, { passive: false });
      v.addEventListener('touchcancel', handleTouchCancel as EventListener, { passive: false });
    }

    return () => {
      try {
        resizeObs.disconnect();
        intersectionObs.disconnect();
      } catch {}
      v.removeEventListener('loadedmetadata', recomputeTransform);
      controlSurface?.removeEventListener('mouseenter', handleSurfaceEnter);
      controlSurface?.removeEventListener('pointermove', handleSurfaceEnter);
      controlSurface?.removeEventListener('mouseleave', handleSurfaceLeave);
      controlSurface?.removeEventListener('blur', handleSurfaceBlur);
      window.removeEventListener('resize', onWindowResize);

      document.removeEventListener(
        'pointermove',
        relMouseMovePointerEvent as EventListener
      );
      document.removeEventListener(
        'pointermove',
        absMouseMovePointerEvent as EventListener
      );
      document.removeEventListener('pointerdown', relPointerDown as EventListener);
      document.removeEventListener('pointerup', relPointerUp as EventListener);
      document.removeEventListener('pointerdown', absPointerDown as EventListener);
      document.removeEventListener('pointerup', absPointerUp as EventListener);
      document.removeEventListener('pointercancel', releasePointerState as EventListener);
      document.removeEventListener('wheel', onWheelInternal as EventListener);
      document.removeEventListener('click', handleClick as EventListener);
      document.removeEventListener('dblclick', handleDoubleClick as EventListener);
      document.removeEventListener('contextmenu', handleRightClick as EventListener);
      // v.removeEventListener('click', handleVideoClickForPointerLock);

      if (!isCursorHidden) {
        v.removeEventListener('touchstart', handleTouchStart as EventListener);
        v.removeEventListener('touchmove', handleTouchMove as EventListener);
        v.removeEventListener('touchend', handleTouchEnd as EventListener);
        v.removeEventListener('touchcancel', handleTouchCancel as EventListener);
      }

      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', releasePointerState);
      document.removeEventListener('pointerlockchange', onLockChange);

      if (wheelBlockTimerRef.current) {
        window.clearTimeout(wheelBlockTimerRef.current);
        wheelBlockTimerRef.current = null;
      }
      blockWheelEventRef.current = false;
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      // Clear touchEnd timer
      if (touchEndTimerRef.current) {
        clearTimeout(touchEndTimerRef.current);
        touchEndTimerRef.current = null;
      }
    };
  }, [
    videoRef,
    recomputeTransform,
    absMouseMovePointerEvent,
    relMouseMovePointerEvent,
    absPointerDown,
    absPointerUp,
    relPointerDown,
    relPointerUp,
    releasePointerState,
    onWheelInternal,
    handleClick,
    handleDoubleClick,
    handleRightClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    mode,
    enabled,
    throttleMs,
    isCursorHidden,
  ]);

  useEffect(() => {
    if (!enabled || !jiggler) {
      if (jigglerTimer.current) {
        clearTimeout(jigglerTimer.current);
        jigglerTimer.current = null;
      }
      return;
    }

    if (jigglerTimer.current) {
      clearTimeout(jigglerTimer.current);
      jigglerTimer.current = null;
    }

    const scheduleJiggle = () => {
      jigglerTimer.current = window.setTimeout(() => {
        if (document.hidden) {
          scheduleJiggle();
          return;
        }
        if (mode === 'relative' ? !onRelMove : !onAbsMove) {
          scheduleJiggle();
          return;
        }
        const now = Date.now();
        if (now - lastActivityTs.current < JIGGLER_CONSTANTS.IDLE_MS) {
          scheduleJiggle();
          return;
        }

        try {
          // Clear previous jiggler reset timer
          if (jigglerResetTimerRef.current) {
            clearTimeout(jigglerResetTimerRef.current);
            jigglerResetTimerRef.current = null;
          }

          if (mode === 'relative' && onRelMove) {
            onRelMove({ dx: JIGGLER_CONSTANTS.AMPLITUDE, dy: 0, buttons: 0, x: JIGGLER_CONSTANTS.AMPLITUDE, y: 0 });
            jigglerResetTimerRef.current = window.setTimeout(
              () => {
                jigglerResetTimerRef.current = null;
                onRelMove({ dx: -JIGGLER_CONSTANTS.AMPLITUDE, dy: 0, buttons: 0, x: -JIGGLER_CONSTANTS.AMPLITUDE, y: 0 });
              },
              JIGGLER_CONSTANTS.RESET_DELAY
            ) as unknown as number;
          } else if (onAbsMove) {
            const t = transform.current;
            const centerX = Math.round(((t.vw - 1) / 2 / (t.vw - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE);
            const centerY = Math.round(((t.vh - 1) / 2 / (t.vh - 1)) * MOUSE_CONSTANTS.MAX_COORDINATE);
            const base = lastSent.current ??
              latestPointer.current ?? { x: centerX, y: centerY, buttons: 0 };
            const x1 = Math.max(0, Math.min(MOUSE_CONSTANTS.MAX_COORDINATE, base.x + JIGGLER_CONSTANTS.AMPLITUDE));
            const y1 = base.y;
            const x2 = Math.max(0, Math.min(MOUSE_CONSTANTS.MAX_COORDINATE, base.x));
            const y2 = base.y;
            onAbsMove(x1, y1, 0);
            jigglerResetTimerRef.current = window.setTimeout(
              () => {
                jigglerResetTimerRef.current = null;
                onAbsMove(x2, y2, 0);
              },
              JIGGLER_CONSTANTS.RESET_DELAY
            ) as unknown as number;
          }
        } catch {
          /* ignore */
        }
        scheduleJiggle();
      }, JIGGLER_CONSTANTS.PERIOD_MS) as unknown as number;
    };

    scheduleJiggle();

    return () => {
      if (jigglerTimer.current) {
        clearTimeout(jigglerTimer.current);
        jigglerTimer.current = null;
      }
      // Also clear the jiggler reset timer
      if (jigglerResetTimerRef.current) {
        clearTimeout(jigglerResetTimerRef.current);
        jigglerResetTimerRef.current = null;
      }
    };
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
  ]);
}
