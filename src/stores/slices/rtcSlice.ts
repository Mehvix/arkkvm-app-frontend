import type React from 'react'

// DataChannel Type
export type ChannelTypes =
  | 'rpc'
  | 'disk'
  | 'terminal'
  | 'serial'
  | 'input'
  | 'inputUnstable'
//  DataChannel State
export type DataChannelState = 'open' | 'closing' | 'closed' | 'connecting'

export interface WebRTCStateData {
  peerConnection: RTCPeerConnection | null
  peerConnectionState: RTCPeerConnectionState | null
  videoRef: React.RefObject<HTMLVideoElement>
  dataChannelState: DataChannelState
  dataChannel: RTCDataChannel | null

  rpcDataChannel: RTCDataChannel | null
  diskChannel: RTCDataChannel | null
  terminalChannel: RTCDataChannel | null
  serialChannel: RTCDataChannel | null
  inputChannel: RTCDataChannel | null
  inputUnstableChannel: RTCDataChannel | null

  inboundRtpStats: Map<number, any>
}

export interface WebRTCState extends WebRTCStateData {
  setRtcField: <K extends keyof WebRTCStateData>(
    key: K,
    value: WebRTCStateData[K]
  ) => void

  setRpcDataChannel: (channel: RTCDataChannel | null) => void
  setVideoRef: (ref: React.RefObject<HTMLVideoElement>) => void
  setTerminalChannel: (channel: RTCDataChannel | null) => void
  setDiskChannel: (channel: RTCDataChannel | null) => void
  setSerialChannel: (channel: RTCDataChannel | null) => void
  setInputChannel: (channel: RTCDataChannel | null) => void
  setInputUnstableChannel: (channel: RTCDataChannel | null) => void

  resetRTC: () => void
}

export const createRTCSlice = (set, get) => ({
  peerConnection: null,
  peerConnectionState: null,
  videoRef: { current: null },
  dataChannel: null,
  dataChannelState: 'closed',
  inboundRtpStats: new Map(),

  rpcDataChannel: null,
  diskChannel: null,
  terminalChannel: null,
  serialChannel: null,
  inputChannel: null,
  inputUnstableChannel: null,

  setRtcField: <K extends keyof WebRTCStateData>(
    key: K,
    value: WebRTCStateData[K]
  ) => {
    set(state => ({
      rtc: {
        ...state.rtc,
        [key]: value,
      },
    }))
  },

  setRpcDataChannel: channel => {
    set(state => ({
      rtc: {
        ...state.rtc,
        rpcDataChannel: channel,
        dataChannel: channel,
      },
    }))
  },
  setVideoRef: (ref: React.RefObject<HTMLVideoElement>) => {
    set(state => ({
      rtc: {
        ...state.rtc,
        videoRef: ref,
      },
    }))
  },
  setTerminalChannel: channel => {
    set(state => ({
      rtc: {
        ...state.rtc,
        terminalChannel: channel,
        dataChannel: channel,
      },
    }))
  },
  setDiskChannel: channel => {
    set(state => ({
      rtc: {
        ...state.rtc,
        diskChannel: channel,
        dataChannel: channel,
      },
    }))
  },

  setSerialChannel: channel => {
    set(state => ({
      rtc: {
        ...state.rtc,
        serialChannel: channel,
        dataChannel: channel,
      },
    }))
  },

  setInputUnstableChannel: channel => {
    set(state => ({
      rtc: {
        ...state.rtc,
        inputUnstableChannel: channel,
      },
    }))
  },

  resetRTC: () => {
    const { rtc } = { rtc: get().rtc ?? get() } as any
    try {
      rtc?.rpcDataChannel?.close?.()
    } catch {}
    try {
      rtc?.diskChannel?.close?.()
    } catch {}
    try {
      rtc?.terminalChannel?.close?.()
    } catch {}
    try {
      rtc?.serialChannel?.close?.()
    } catch {}
    try {
      rtc?.dataChannel?.close?.()
    } catch {}
    try {
      rtc?.peerConnection?.close?.()
    } catch {}
    try {
      rtc?.inputChannel?.close?.()
    } catch {}
    try {
      rtc?.inputUnstableChannel?.close?.()
    } catch {}

    set(state => ({
      rtc: {
        ...state.rtc,
        peerConnection: null,
        peerConnectionState: null,
        videoRef: { current: null },
        dataChannel: null,
        rpcDataChannel: null,
        diskChannel: null,
        terminalChannel: null,
        serialChannel: null,
        inputChannel: null,
        inputUnstableChannel: null,

        inboundRtpStats: new Map(),
      },
    }))
  },
})
