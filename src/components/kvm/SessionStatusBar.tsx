/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-06 02:08:49
 */
import { useVideoRenderFps } from '@/hooks/useVideoRenderFps'
import { useAppStore } from '@/stores'
import { cn } from '@/utils'
import { memo, useMemo, useRef } from 'react'
import { useShallow } from 'zustand/shallow'
import { keys, modifiers } from '../VirtualKeyboard/data/hidKeyCodes'

interface SessionStatusBarProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>
  peerState?: string
}

const LED_BASE_CLASS =
  'text-[12px] rounded-[4px] px-[6px] py-[2px] border-[1px]'
const LED_ACTIVE_CLASS = 'text-[var(--primary)] border-[var(--primary)]'
const LED_INACTIVE_CLASS = 'text-[var(--text-secondary)] border-[var(--border)]'

const SessionStatusBar = ({ videoRef, peerState }: SessionStatusBarProps) => {
  const emptyVideoRef = useRef<HTMLVideoElement | null>(null)

  // Batch store subscriptions with shallow comparison for better performance
  const {
    showDiagnosticInfo,
    showPressedKeys,
    showKeyboardLeds,
    videoWidth,
    videoHeight,
    containerWidth,
    containerHeight,
    mouseX,
    mouseY,
    hidUsbState,
    usbState,
    hdmiConnectionState,
    hidKeysDownState,
    keysDownState,
  } = useAppStore(
    useShallow(s => ({
      showDiagnosticInfo: s.showDiagnosticInfo,
      showPressedKeys: s.showPressedKeys,
      showKeyboardLeds: s.showKeyboardLeds,
      videoWidth: s.videoWidth,
      videoHeight: s.videoHeight,
      containerWidth: s.containerWidth,
      containerHeight: s.containerHeight,
      mouseX: s.mouseX,
      mouseY: s.mouseY,
      hidUsbState: s.hidUsbState,
      usbState: s.usbState,
      hdmiConnectionState: s.hdmiConnectionState,
      hidKeysDownState: s.hidKeysDownState,
      keysDownState: s.keysDownState,
    }))
  )

  const keyboardLedState = useAppStore(s => s.ui?.keyboardLedState)

  const videoFps = useVideoRenderFps(
    showDiagnosticInfo && videoRef ? videoRef : emptyVideoRef,
    [peerState, showDiagnosticInfo]
  )

  const actualUsbState = hidUsbState ?? usbState
  const actualKeysDownState = hidKeysDownState ?? keysDownState
  const displayKeys = useMemo(() => {
    if (!showPressedKeys) return ''
    const activeModifierMask = actualKeysDownState?.modifier || 0
    const keysDown = actualKeysDownState?.keys || []
    const modifierNames = Object.entries(modifiers)
      .filter(([_, mask]) => (activeModifierMask & mask) !== 0)
      .map(([name]) => name)
    const keyNames = Object.entries(keys)
      .filter(([_, value]) => keysDown.includes(value))
      .map(([name]) => name)

    return [...modifierNames, ...keyNames].join(', ')
  }, [actualKeysDownState, showPressedKeys])

  // Only calculate rendered size when diagnostic info is shown
  const rendered = useMemo(() => {
    if (!showDiagnosticInfo) return { w: 0, h: 0 }
    const vw = Number(videoWidth) || 0
    const vh = Number(videoHeight) || 0
    const cw = Number(containerWidth) || 0
    const ch = Number(containerHeight) || 0
    if (!vw || !vh || !cw || !ch) return { w: cw, h: ch }
    const scale = Math.min(cw / vw, ch / vh)
    return { w: Math.round(vw * scale), h: Math.round(vh * scale) }
  }, [
    showDiagnosticInfo,
    videoWidth,
    videoHeight,
    containerWidth,
    containerHeight,
  ])

  // Only calculate LED states when keyboard LEDs are shown
  const ledStates = useMemo(() => {
    if (!showKeyboardLeds)
      return { isCapsOn: false, isNumOn: false, isScrollOn: false }
    return {
      isCapsOn: !!keyboardLedState?.caps_lock,
      isNumOn: !!keyboardLedState?.num_lock,
      isScrollOn: !!keyboardLedState?.scroll_lock,
    }
  }, [showKeyboardLeds, keyboardLedState])

  if (!showDiagnosticInfo && !showPressedKeys && !showKeyboardLeds) {
    return null
  }
  return (
    <div className="flex bg-[var(--bg-secondary)] items-center justify-between px-[32px] py-[6px] border-t border-[var(--border-color)]">
      <ul className="status-bar h-[24px] text-sub flex items-center gap-[26px]">
        {showDiagnosticInfo && (
          <>
            <li>
              Resolution: {videoWidth}x{videoHeight}
            </li>
            <li>
              Video Size: {rendered.w}x{rendered.h}
            </li>
            <li>
              Pointer: {mouseX}x{mouseY}
            </li>
            <li>FPS: {videoFps !== null ? videoFps.toFixed(1) : 'N/A'}</li>
            <li>USB State: {actualUsbState}</li>
            <li>HDMI State: {hdmiConnectionState}</li>
          </>
        )}
        {showPressedKeys && <li>Keys: {displayKeys}</li>}
      </ul>

      {showKeyboardLeds && (
        <div className="flex gap-[8px]">
          <span
            className={cn(
              LED_BASE_CLASS,
              ledStates.isCapsOn ? LED_ACTIVE_CLASS : LED_INACTIVE_CLASS
            )}
          >
            Caps Lock
          </span>
          <span
            className={cn(
              LED_BASE_CLASS,
              ledStates.isNumOn ? LED_ACTIVE_CLASS : LED_INACTIVE_CLASS
            )}
          >
            Num Lock
          </span>
          <span
            className={cn(
              LED_BASE_CLASS,
              ledStates.isScrollOn ? LED_ACTIVE_CLASS : LED_INACTIVE_CLASS
            )}
          >
            Scroll Lock
          </span>
        </div>
      )}
    </div>
  )
}
export default memo(SessionStatusBar)
