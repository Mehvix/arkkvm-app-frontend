import type { JsonRpcSend, MethodName } from '@/hooks/useJsonRpc'

declare global {
  interface Window {
    __arkkvm_rpc__?: {
      send: <M extends MethodName>(call: JsonRpcSend<M>) => number | undefined
    }

    __arkkvm_state__?: {
      isChannelReady: boolean
      peerState: RTCPeerConnectionState | string
      usbState: string
      hdmiConnectionState: string
    }

    __arkkvm_extension_api__?: {
      sendAbsMouseMove: (x: number, y: number, buttons?: number) => boolean
      sendRelMouseMove: (dx: number, dy: number, buttons?: number) => boolean
      sendWheel: (wheelY: number) => boolean
      sendKeyboard: (keyCode: number, pressed: boolean) => boolean
      getStatus: () => {
        hasRPC: boolean
        isChannelReady: boolean
        peerState: string
        usbState: string
        hdmiState: string
      }
    }
  }
}

export {}
