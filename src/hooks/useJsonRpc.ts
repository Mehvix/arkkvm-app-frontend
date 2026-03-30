import { useRTCStore } from '@/stores'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

export interface JsonRpcError {
  code: number
  data?: string
  message: string
}

export interface JsonRpcSuccessResponse {
  jsonrpc: string
  result: boolean | number | object | string | []
  id: string | number
}

export interface JsonRpcErrorResponse {
  jsonrpc: string
  error: JsonRpcError
  id: string | number
}

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse

interface MethodParamsMap {
  keyboardReport: { keys: number[]; modifier: number }
  relMouseReport: { dx: number; dy: number; buttons: number }
  absMouseReport: { x: number; y: number; buttons: number }
  wheelReport: { wheelY: number }
  getKeyboardLayout: void
  setKeyboardLayout: { layout: string }
  getKeyboardLedState: void

  getVideoState: void
  getUpdateStatus: void
  getDeviceID: void

  getCloudState: void
  getTLSState: void
  deregisterDevice: void
  setCloudUrl: { apiUrl: string; appUrl: string }
  setTLSState: {
    state: {
      mode: 'disabled' | 'self-signed' | 'custom'
      certificate?: string
      privateKey?: string
    }
  }
  mouseWheel: { deltaX: number; deltaY: number }
  mouseClick: { button: number }
  keyEvent: { type: 'keydown' | 'keyup'; key: string; keyCode: string }
  ping: void
  reboot: { force?: boolean }
  deregisterDevice: void
  getCloudState: void
  getNetworkState: void
  getNetworkSettings: void
  setNetworkSettings: { settings: Record<string, any> }
  renewDHCPLease: void
  getUSBState: void
  unmountImage: void
  rpcMountBuiltInImage: { filename: string }
  setJigglerState: { enabled: boolean }
  getJigglerState: void
  sendWOLMagicPacket: { macAddress: string }
  getStreamQualityFactor: void
  setStreamQualityFactor: { factor: number }
  getAutoUpdateState: void
  setAutoUpdateState: { enabled: boolean }
  getEDID: void
  setEDID: { edid: string }
  getDevChannelState: void
  setDevChannelState: { enabled: boolean }
  tryUpdate: void
  getDevModeState: void
  setDevModeState: { enabled: boolean }
  getSSHKeyState: void
  setSSHKeyState: { sshKey: string }
  getTLSState: void
  setTLSState: {
    state: {
      mode: 'disabled' | 'self-signed' | 'custom'
      certificate?: string
      privateKey?: string
    }
  }
  setMassStorageMode: { mode: string }
  getMassStorageMode: void
  isUpdatePending: void
  getUsbEmulationState: void
  setUsbEmulationState: { enabled: boolean }
  getUsbConfig: void
  setUsbConfig: { usbConfig: Record<string, any> }
  checkMountUrl: { url: string }
  getVirtualMediaState: void
  getStorageSpace: void
  mountWithHTTP: { url: string; mode: string }
  mountWithWebRTC: { filename: string; size: number; mode: string }
  mountWithStorage: { filename: string; mode: string }
  listStorageFiles: void
  deleteStorageFile: { filename: string }
  startStorageFileUpload: { filename: string; size: number }
  getWakeOnLanDevices: void
  setWakeOnLanDevices: { params: Record<string, any> }
  resetConfig: void
  setDisplayRotation: { params: Record<string, any> }
  getDisplayRotation: void
  setBacklightSettings: { params: Record<string, any> }
  getBacklightSettings: void
  getDCPowerState: void
  setDCPowerState: { enabled: boolean }
  setDCRestoreState: { state: Record<string, any> }
  getActiveExtension: void
  setActiveExtension: { extensionId: string }
  getATXState: void
  setATXPowerAction: { action: string }
  getSerialSettings: void
  setSerialSettings: { settings: Record<string, any> }
  getUsbDevices: void
  setUsbDevices: { devices: any[] | Record<string, any> }
  setUsbDeviceState: { device: string; enabled: boolean }
  setCloudUrl: { apiUrl: string; appUrl: string }
  getKeyboardMacros: void
  setKeyboardMacros: { params: Record<string, any> }
  getLocalLoopbackOnly: void
  setLocalLoopbackOnly: { enabled: boolean }
}

type MethodName = keyof MethodParamsMap
export type JsonRpcRequest<M extends MethodName> = {
  jsonrpc: '2.0'
  method: M
  id: number
} & (MethodParamsMap[M] extends void ? {} : { params: MethodParamsMap[M] })

type ToastMessageOption = string | { text: string } | { prefix: string }

export type JsonRpcSend<M extends MethodName = MethodName> =
  MethodParamsMap[M] extends void
    ? {
        method: M
        onResponse?: (resp: JsonRpcResponse) => void
        onError?: (err: any) => void
        successMessage?: ToastMessageOption
        errorMessage?: ToastMessageOption
      }
    : {
        method: M
        params: MethodParamsMap[M]
        onResponse?: (resp: JsonRpcResponse) => void
        onError?: (err: any) => void
        successMessage?: ToastMessageOption
        errorMessage?: ToastMessageOption
        showUnhandledErrorToast?: boolean
      }

type RpcStore = {
  callbackStore: Map<string, (resp: JsonRpcResponse) => void>
  pendingTimers: Map<string, number>
  requestCounter: number
}

declare global {
  // eslint-disable-next-line no-var
  var __jsonrpcStore__: RpcStore | undefined
}

function getStore(): RpcStore {
  if (!globalThis.__jsonrpcStore__) {
    globalThis.__jsonrpcStore__ = {
      callbackStore: new Map(),
      pendingTimers: new Map(),
      requestCounter: 0,
    }
  }
  return globalThis.__jsonrpcStore__
}

const { callbackStore, pendingTimers } = getStore()
let requestCounter = getStore().requestCounter

function clearPending(id: number | string) {
  const key = String(id)
  callbackStore.delete(key)
  const t = pendingTimers.get(key)
  if (t) {
    clearTimeout(t)
    pendingTimers.delete(key)
  }
}

function clearAllPending() {
  callbackStore.forEach((_cb, key) => {
    const t = pendingTimers.get(key)
    if (t) {
      clearTimeout(t)
      pendingTimers.delete(key)
    }
    callbackStore.delete(key)
  })
}

export interface UseJsonRpcOptions {
  // When the incoming message is a JsonRpcErrorResponse not handled by a pending callback,
  // show a toast automatically. If a function is provided, use its return as the message
  // (returning undefined will suppress the toast). Default: false.
  showUnhandledErrorToast?:
    | boolean
    | ((resp: JsonRpcErrorResponse) => string | undefined)
  // Toast for ANY incoming JsonRpcErrorResponse (even if a callback exists). Default: false.
  // If a function is provided, use its return as the message (undefined suppresses toast).
  showIncomingErrorToast?:
    | boolean
    | ((resp: JsonRpcErrorResponse) => string | undefined)
}

export function useJsonRpc(
  onRequest?: (payload: JsonRpcRequest<MethodName>) => void,
  options?: UseJsonRpcOptions
) {
  const rpcDataChannel = useRTCStore(s => s.rpcDataChannel)

  // Track channel readiness via state + event listeners so it updates on disconnect
  const [isChannelReady, setIsChannelReady] = useState(() =>
    Boolean(rpcDataChannel && rpcDataChannel.readyState === 'open')
  )
  useEffect(() => {
    const ch = rpcDataChannel
    const check = () =>
      setIsChannelReady(Boolean(ch && ch.readyState === 'open'))
    check()
    if (!ch) return
    ch.addEventListener('open', check)
    ch.addEventListener('close', check)
    ch.addEventListener('error', check)
    return () => {
      ch.removeEventListener('open', check)
      ch.removeEventListener('close', check)
      ch.removeEventListener('error', check)
    }
  }, [rpcDataChannel])
  const channelRef = useRef<RTCDataChannel | null>(null)
  useEffect(() => {
    channelRef.current = rpcDataChannel ?? null
  }, [rpcDataChannel])

  const send = useCallback(<M extends MethodName>(call: JsonRpcSend<M>) => {
    const {
      method,
      params,
      onResponse,
      onError,
      successMessage,
      errorMessage,
      showUnhandledErrorToast,
    } = call
    const compose = (opt?: ToastMessageOption, detail?: string) => {
      if (!opt) return undefined
      if (typeof opt === 'string') return opt
      if ('text' in opt) return opt.text
      if ('prefix' in opt)
        return detail ? `${opt.prefix}: ${detail}` : opt.prefix
      return undefined
    }
    const ch = channelRef.current
    if (!ch) {
      const msg = compose(errorMessage, 'RPC data channel does not exist')
      if (msg) toast.error(msg)
      onError?.(new Error('RPC data channel does not exist'))
      return undefined
    }
    if (ch.readyState !== 'open') {
      const msg = compose(errorMessage, `Channel state is ${ch.readyState}`)
      if (msg) toast.error(msg)
      onError?.(new Error(`Channel state is ${ch.readyState}`))
      return undefined
    }

    if (ch.bufferedAmount > 1_000_000) {
    }
    requestCounter++
    if (requestCounter > Number.MAX_SAFE_INTEGER) {
      requestCounter = 1
    }

    getStore().requestCounter = requestCounter
    const base = { jsonrpc: '2.0' as const, method, id: requestCounter }
    const payload = (
      'params' in call ? { ...base, params } : { ...base, params: {} as any }
    ) as JsonRpcRequest<M>
    const wrappedOnResponse = onResponse
      ? (resp: JsonRpcResponse) => {
          if (!('error' in resp)) {
            const detail =
              (resp as any)?.result?.data || (resp as any)?.result?.message
            const msg = compose(successMessage, detail)
            if (msg) toast.success(msg)
          } else {
            const msg = compose(
              errorMessage,
              resp.error?.data || resp.error?.message
            )
            if (msg && showUnhandledErrorToast) toast.error(msg)
            onError?.(resp.error)
          }
          onResponse(resp)
        }
      : undefined

    if (wrappedOnResponse) {
      callbackStore.set(String(payload.id), wrappedOnResponse)
    }

    try {
      const jsonStr = JSON.stringify(payload)
      ch.send(jsonStr)
      return payload.id
    } catch (err) {
      const msg = compose(errorMessage, (err as Error)?.message)
      if (msg && showUnhandledErrorToast) toast.error(msg)
      onError?.(err)
      return undefined
    }
  }, [])

  const sendAsync = useCallback(
    <M extends MethodName>(
      call: JsonRpcSend<M>,
      opts?: {
        timeout?: number
        resultOnly?: boolean
        showUnhandledErrorToast?:
          | boolean
          | ((resp: JsonRpcErrorResponse) => string | undefined)
      }
    ): Promise<any> => {
      const timeout = opts?.timeout ?? 30000
      const resultOnly = opts?.resultOnly ?? false
      const showUnhandledErrorToast = opts?.showUnhandledErrorToast ?? false
      return new Promise((resolve, reject) => {
        const id = send<M>({
          ...(call as any),
          showUnhandledErrorToast: false,
          onResponse: resp => {
            clearPending((resp as any).id as number)

            if ('error' in resp) {
              try {
                if (typeof showUnhandledErrorToast === 'function') {
                  const msg = showUnhandledErrorToast(resp)
                  if (msg) toast.error(msg)
                } else if (showUnhandledErrorToast) {
                  const dataText =
                    typeof resp.error.data === 'string'
                      ? resp.error.data
                      : resp.error.data
                        ? JSON.stringify(resp.error.data)
                        : undefined
                  const msg =
                    dataText ||
                    resp.error.message ||
                    `RPC Error ${resp.error.code}`
                  toast.error(msg)
                }
              } catch {}
              if (resultOnly) {
                resolve({
                  success: false,
                  error: resp.error,
                })
                // reject(new Error(resp.error.message || 'RPC Error'))
              } else {
                resolve({ ...resp, success: false })
              }
              return
            }

            if (resultOnly) {
              resolve(resp.result)
            } else {
              resolve({ ...resp, success: true })
            }
          },
        })

        if (typeof id !== 'number') {
          return
        }

        const key = String(id)
        const timer = window.setTimeout(() => {
          clearPending(key)
          resolve({
            success: false,
            error: {
              code: -32001,
              message: `RPC request timed out: ${(call as any).method} (#${id}) - ${timeout}ms`,
            },
          })
          // reject(
          //   new Error(
          //     `RPC request timed out: ${(call as any).method} (#${id}) - ${timeout}ms`
          //   )
          // )
        }, timeout)
        pendingTimers.set(key, timer)
      })
    },
    [send]
  )

  useEffect(() => {
    if (!rpcDataChannel) return

    const messageHandler = async (e: MessageEvent) => {
      try {
        let text: string | undefined
        const data = e.data as unknown
        if (typeof data === 'string') {
          text = data
        } else if (data instanceof ArrayBuffer) {
          text = new TextDecoder().decode(new Uint8Array(data))
        } else if (data instanceof Blob) {
          text = await data.text()
        } else {
          return
        }
        const payload = JSON.parse(text) as
          | JsonRpcResponse
          | JsonRpcRequest<MethodName>

        if ('method' in payload) {
          if (onRequest) onRequest(payload)
          return
        }

        if ('error' in payload) {
          const optAny = options?.showIncomingErrorToast
          if (optAny) {
            try {
              if (typeof optAny === 'function') {
                const m = optAny(payload)
                if (m) toast.error(m)
              } else {
                const dataText =
                  typeof payload.error.data === 'string'
                    ? payload.error.data
                    : payload.error.data
                      ? JSON.stringify(payload.error.data)
                      : undefined
                toast.error(
                  dataText ||
                    `[RPC Error ${payload.error.code}] ${payload.error.message}`
                )
              }
            } catch {}
          }
        }

        const hasId =
          Object.prototype.hasOwnProperty.call(payload, 'id') &&
          (payload as any).id != null
        const key = hasId ? String((payload as any).id) : undefined
        const callback = key ? callbackStore.get(key) : undefined
        if (callback) {
          callback(payload)
          if (key) {
            callbackStore.delete(key)
            clearPending(key)
          }
        }

        if (!callback && !hasId && 'error' in payload) {
          const opt = options?.showUnhandledErrorToast
          const dataText =
            typeof payload.error.data === 'string'
              ? payload.error.data
              : payload.error.data
                ? JSON.stringify(payload.error.data)
                : undefined
          const defaultMsg =
            dataText ||
            `[RPC Error ${payload.error.code}] ${payload.error.message}`
          try {
            if (typeof opt === 'function') {
              const msg = opt(payload)
              if (msg) toast.error(msg)
            } else if (opt) {
              toast.error(defaultMsg)
            }
          } catch {}
        }
      } catch (err) {}
    }

    const closeHandler = () => {
      clearAllPending()
    }

    const errorHandler = () => {
      clearAllPending()
    }

    rpcDataChannel.addEventListener('message', messageHandler as any)
    rpcDataChannel.addEventListener('close', closeHandler as any)
    rpcDataChannel.addEventListener('error', errorHandler as any)

    return () => {
      try {
        rpcDataChannel.removeEventListener('message', messageHandler as any)
        rpcDataChannel.removeEventListener('close', closeHandler as any)
        rpcDataChannel.removeEventListener('error', errorHandler as any)
      } catch {}
    }
  }, [rpcDataChannel, onRequest, options?.showUnhandledErrorToast])

  return useMemo(
    () => [send, isChannelReady, sendAsync] as const,
    [send, isChannelReady, sendAsync]
  )
}

export type JsonRpcHandle = ReturnType<typeof useJsonRpc>
