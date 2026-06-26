/*
 * @Author: zhanglei
 * @Date: 2026-06-23 19:21:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-06-23 19:38:53
 * @FilePath: /git-arkkvm-app-frontend/src/api/types.ts
 */


// ─────────────────────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────────────────────

/** Auth mode reported by the device. */
export type DeviceAuthMode = 'password' | 'noPassword' | 'no'

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface kvmLoginRequest {
  password: string
}

export interface kvmSetPasswordRequest {
  password: string
}

export interface kvmChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Device
// ─────────────────────────────────────────────────────────────────────────────
export interface kvmLocalDevice {
  deviceId: string
  authMode: DeviceAuthMode
  loopbackOnly: boolean
}
export interface kvmDeviceStatus {
  isSetup: boolean
}
export interface kvmSetupRequest {
  localAuthMode: string
  password: string
  microphoneEmulation: boolean
  camera_emulation: boolean
  auto_update?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Cloud
// ─────────────────────────────────────────────────────────────────────────────

export interface kvmCloudRegisterRequest {
  token: string
}

export interface kvmCloudState {
  connected: boolean
  deviceId?: string
}
export interface kvmWebRTCSessionRequest {
  sdp: string
  type: RTCSdpType
}

export interface kvmIceConfigResponse {
  iceServers?: RTCIceServer | RTCIceServer[]
}
