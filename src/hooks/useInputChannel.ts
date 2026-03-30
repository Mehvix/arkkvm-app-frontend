/**
 * @Purpose: Input channel hook for WebRTC data channel
 * @Description: Handles keyboard and mouse input reports via WebRTC data channel
 * @version:
 * @Author: zhanglei
 * @Date: 2025-12-23 13:56:50
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-09 16:19:54
 */
import { useRTCStore } from '@/stores'
import { createLogger } from '@/utils/logger'
import { useCallback, useEffect, useMemo, useRef } from 'react'

const logger = createLogger('useInputChannel')
let i = 0
type InputMethodParamsMap = {
  keyboardReport: { keys: number[]; modifier: number }
  relMouseReport: { dx: number; dy: number; buttons: number }
  absMouseReport: { x: number; y: number; buttons: number }
  wheelReport: { wheelY: number }
}

type InputMethodName = keyof InputMethodParamsMap

type InputSend<M extends InputMethodName> = {
  method: M
  params: InputMethodParamsMap[M]
}

type InputFrame<M extends InputMethodName> = {
  jsonrpc: '2.0'
  method: M
  params: InputMethodParamsMap[M]
  id: number
}

export function useInputChannel() {
  const inputChannel = useRTCStore(s => s.inputChannel)
  const inputUnstableChannel = useRTCStore(s => s.inputUnstableChannel)
  const isChannelReady = !!inputChannel && inputChannel.readyState === 'open'

  const channelRef = useRef<RTCDataChannel | null>(null)
  const idRef = useRef(0)

  useEffect(() => {
    channelRef.current = inputChannel ?? null
  }, [inputChannel])
  useEffect(() => {
    if (inputUnstableChannel?.readyState === 'open') {
      channelRef.current = inputUnstableChannel
    }
  }, [inputUnstableChannel])

  const send = useCallback(
    <M extends InputMethodName>(
      call: InputSend<M>,
      channel?: RTCDataChannel | null
    ) => {
      // If channel is provided, use it; otherwise use channelRef.current
      const ch = channel ?? channelRef.current
      if (!ch || ch.readyState !== 'open') return undefined
      idRef.current += 1
      if (idRef.current > Number.MAX_SAFE_INTEGER) idRef.current = 1

      const payload: InputFrame<M> = {
        jsonrpc: '2.0',
        method: call.method,
        params: call.params,
        id: idRef.current,
      }

      try {
        ch.send(JSON.stringify(payload))
        return payload.id
      } catch {
        return undefined
      }
    },
    []
  )

  const sendKeyboardReport = useCallback(
    (report: InputMethodParamsMap['keyboardReport']) => {
      send({ method: 'keyboardReport', params: report })
    },
    [send]
  )

  const sendRelMouseReport = useCallback(
    (report: InputMethodParamsMap['relMouseReport']) => {
      if (
        !Number.isInteger(report.dx) ||
        !Number.isInteger(report.dy) ||
        !Number.isInteger(report.buttons)
      ) {
        logger.warn(
          'sendRelMouseReport: Invalid parameters, must be integers',
          report
        )
        return
      }

      send({ method: 'relMouseReport', params: report })
    },
    [send]
  )

  const sendAbsMouseReport = useCallback(
    (report: InputMethodParamsMap['absMouseReport']) => {
      if (
        !Number.isInteger(report.x) ||
        !Number.isInteger(report.y) ||
        !Number.isInteger(report.buttons)
      ) {
        logger.warn(
          'sendAbsMouseReport: Invalid parameters, must be integers',
          report
        )
        return
      }
      send({ method: 'absMouseReport', params: report }, inputUnstableChannel)
    },
    [send, inputUnstableChannel]
  )

  const sendWheelReport = useCallback(
    (report: InputMethodParamsMap['wheelReport']) =>
      send({ method: 'wheelReport', params: report }),
    [send]
  )

  return useMemo(
    () => ({
      send,
      sendKeyboardReport,
      sendRelMouseReport,
      sendAbsMouseReport,
      sendWheelReport,
      isChannelReady,
    }),
    [
      send,
      sendKeyboardReport,
      sendRelMouseReport,
      sendAbsMouseReport,
      sendWheelReport,
      isChannelReady,
    ]
  )
}

export type UseInputChannelHandle = ReturnType<typeof useInputChannel>
