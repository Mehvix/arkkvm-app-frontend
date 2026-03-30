import { useEffect, useRef, useCallback } from 'react'

export interface SignalEvents {
  onOpen?: () => void
  onMessage?: (data: string) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
}

export const useRtcSignal = (url: string, events: SignalEvents) => {
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = events.onOpen || null
    ws.onmessage = e => events.onMessage?.(e.data)
    ws.onclose = events.onClose || null
    ws.onerror = events.onError || null
  }, [url, events])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  const send = useCallback((msg: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { send, connect, disconnect, wsRef }
}
