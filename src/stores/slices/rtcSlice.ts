import type React from 'react';
import type { StateCreator } from 'zustand';
import type { RootState } from '../types';

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
// Define state data properties only (excluding action methods).
export interface WebRTCStateData {
  // Core objects.
  peerConnection: RTCPeerConnection | null
  peerConnectionState: RTCPeerConnectionState | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  dataChannelState: DataChannelState
  dataChannel: RTCDataChannel | null

  // Data channels.
  rpcDataChannel: RTCDataChannel | null
  diskChannel: RTCDataChannel | null
  terminalChannel: RTCDataChannel | null
  serialChannel: RTCDataChannel | null
  inputChannel: RTCDataChannel | null
  inputUnstableChannel: RTCDataChannel | null
  // Runtime stats.
  inboundRtpStats: Map<number, RTCInboundRtpStreamStats>
}

export interface WebRTCState extends WebRTCStateData {
  // Generic setter for data properties only.
  setRtcField: <K extends keyof WebRTCStateData>(
    key: K,
    value: WebRTCStateData[K]
  ) => void

  // Specialized setters for fields requiring additional behavior.
  setRpcDataChannel: (channel: RTCDataChannel | null) => void // Also updates dataChannel.
  setVideoRef: (ref: React.RefObject<HTMLVideoElement>) => void // Set video ref.
  setTerminalChannel: (channel: RTCDataChannel | null) => void
  setDiskChannel: (channel: RTCDataChannel | null) => void
  setSerialChannel: (channel: RTCDataChannel | null) => void
  setInputChannel: (channel: RTCDataChannel | null) => void
  setInputUnstableChannel: (channel: RTCDataChannel | null) => void

  // Reset: close channels/connections and restore initial state.
  resetRTC: () => void
}
// Create RTC slice.
export const createRTCSlice: StateCreator<RootState, [], [], WebRTCState> = (set, get) => ({
  // Initial state.
  peerConnection: null,
  peerConnectionState: null,
  videoRef: { current: null },
  dataChannel: null, // Main channel defaults to RPC.
  dataChannelState: 'closed',
  inboundRtpStats: new Map<number, RTCInboundRtpStreamStats>(),

  // Data channels.
  rpcDataChannel: null,
  diskChannel: null,
  terminalChannel: null,
  serialChannel: null,
  inputChannel: null,
  inputUnstableChannel: null,
  // Generic setter for data properties only.
  setRtcField: <K extends keyof WebRTCStateData>(
    key: K,
    value: WebRTCStateData[K]
  ) => {
    // Handle nested rtc state updates.
    set((state: RootState) => ({
      rtc: {
        ...state.rtc,
        [key]: value,
      },
    }));
  },

  // Specialized setters.
  setRpcDataChannel: channel => {
    // Handle nested rtc state updates.
    set((state: RootState) => ({
      rtc: {
        ...state.rtc,
        rpcDataChannel: channel,
        dataChannel: channel,
      },
    }));
  },
  setVideoRef: (ref: React.RefObject<HTMLVideoElement>) => {
    // Set video ref.
    set((state: RootState) => ({
      rtc: {
        ...state.rtc,
        videoRef: ref,
      },
    }));
  },
  setTerminalChannel: channel => {
    // Handle nested rtc state updates.
    set((state: RootState) => ({
      rtc: {
        ...state.rtc,
        terminalChannel: channel,
        dataChannel: channel,
      },
    }));
  },
  setDiskChannel: channel => {
    // Handle nested rtc state updates.
    set((state: RootState) => ({
      rtc: {
        ...state.rtc,
        diskChannel: channel,
        dataChannel: channel,
      },
    }));
  },

  setSerialChannel: channel => {
    // Handle nested rtc state updates.
    set(state => ({
      rtc: {
        ...state.rtc,
        serialChannel: channel,
        dataChannel: channel,
      },
    }));
  },

  setInputChannel: channel => {
    // Handle nested rtc state updates.
    set((state: RootState) => ({
      rtc: {
        ...state.rtc,
        inputChannel: channel,
      },
    }));
  },

  setInputUnstableChannel: channel => {
    // Handle nested rtc state updates.
    set(state => ({
      rtc: {
        ...state.rtc,
        inputUnstableChannel: channel,
      },
    }));
  },

  // Close all channels/connections and reset to defaults.
  resetRTC: () => {
    const rootState = get();
    const rtc = rootState.rtc;
    try {
      rtc?.rpcDataChannel?.close?.();
    } catch {}
    try {
      rtc?.diskChannel?.close?.();
    } catch {}
    try {
      rtc?.terminalChannel?.close?.();
    } catch {}
    try {
      rtc?.serialChannel?.close?.();
    } catch {}
    try {
      rtc?.dataChannel?.close?.();
    } catch {}
    try {
      rtc?.peerConnection?.close?.();
    } catch {}
    try {
      rtc?.inputChannel?.close?.();
    } catch {}
    try {
      rtc?.inputUnstableChannel?.close?.();
    } catch {}

    set((state: RootState) => ({
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
        // Reset inbound RTP stats to prevent unbounded map growth.
        inboundRtpStats: new Map<number, RTCInboundRtpStreamStats>(),
      },
    }));
  },
});
