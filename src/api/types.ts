export interface kvmChangePasswordRequest {
  newPassword?: string
  oldPassword?: string
}

export interface kvmCloudRegisterRequest {
  clientId?: string
  cloudApi?: string
  oidcGoogle?: string
  token?: string
}

export interface kvmCloudState {
  appUrl?: string
  connected?: boolean
  url?: string
}

export interface kvmDeviceStatus {
  isSetup?: boolean
}

export interface kvmLocalDevice {
  authMode?: string
  deviceId?: string
  loopbackOnly?: boolean
}

export interface KvmConsoleLoginRequest {
  password?: string
}

export interface kvmSetPasswordRequest {
  password?: string
}

export interface kvmSetupRequest {
  localAuthMode?: string
  password?: string
}

export interface kvmWebRTCSessionRequest {
  OidcGoogle?: string
  iceServers?: string[]
  ip?: string
  sd?: string
}
