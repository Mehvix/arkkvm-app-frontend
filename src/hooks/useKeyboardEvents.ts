/**
 * @Purpose: Keyboard events hook for video element
 * @Description: Handles keyboard events on video element with editing state detection
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-31 20:46:42
 */
import { useEffect } from 'react'

interface KeyboardEventsOptions {
  videoRef: React.RefObject<HTMLVideoElement>
  onKeydown?: (event: KeyboardEvent) => void
  onKeyup?: (event: KeyboardEvent) => void
  enabled?: boolean // When false, do not bind listeners
}

export default function useKeyboardEvents(options: KeyboardEventsOptions) {
  const { videoRef, onKeydown, onKeyup, enabled = true } = options

  useEffect(() => {
    if (!enabled) return
    const video = videoRef.current
    if (!video) return
    const isEditing = () => {
      try {
        const el = document.activeElement as HTMLElement | null
        if (!el) return false
        const tag = (el.tagName || '').toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select')
          return true
        if (el.isContentEditable) return true
        return false
      } catch {
        return false
      }
    }

    // Create AbortController instance
    const abortController = new AbortController()
    const signal = abortController.signal
    video.tabIndex = 0 // Make video element focusable
    if (!isEditing()) {
      try {
        video.focus()
      } catch {}
    }

    // Add event listeners, bind to video element
    const keydownHandler = (event: KeyboardEvent) => {
      if (isEditing()) return
      try {
        event.preventDefault()
      } catch {}

      onKeydown && onKeydown(event)
    }
    const keyupHandler = (event: KeyboardEvent) => {
      if (isEditing()) return
      try {
        event.preventDefault()
      } catch {}

      onKeyup && onKeyup(event)
    }

    // Listen to keyboard events
    video.addEventListener('keydown', keydownHandler, { signal })
    video.addEventListener('keyup', keyupHandler, { signal })

    // Cleanup event listeners
    return () => {
      abortController.abort() // Cancel event listeners
      video.removeEventListener('keydown', keydownHandler)
      video.removeEventListener('keyup', keyupHandler)
    }
  }, [videoRef, onKeydown, onKeyup, enabled])
}
