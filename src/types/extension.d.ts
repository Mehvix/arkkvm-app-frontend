/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-11-28 22:34:26
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-03-26 22:40:55
 */


import type { JsonRpcSend, MethodName } from '@/hooks/useJsonRpc';

declare global {
  interface Window {
    /**
     * ArkKVM Extension RPC API
     */
    __arkkvm_rpc__?: {
      send: <M extends MethodName>(call: JsonRpcSend<M>) => number | undefined
    }

    /**
     * ArkKVM Extension State API
     */
    __arkkvm_state__?: {
      isChannelReady: boolean
      peerState: RTCPeerConnectionState | string
      usbState: string
      hdmiConnectionState: string
    }

    /**
     * ArkKVM Extension Injected API
     */
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

export { };
