/**
 * Automatically generated API module - 2025-07-28
 * Generated from /Users/zhanglei/Desktop/work/nuts/project/AkrKVM/frontend/scripts/swagger.json
 */

import { request, RequestConfig } from './request'
import {
  kvmChangePasswordRequest,
  kvmCloudRegisterRequest,
  kvmCloudState,
  kvmDeviceStatus,
  kvmLocalDevice,
  kvmLoginRequest,
  kvmSetPasswordRequest,
  kvmSetupRequest,
  kvmWebRTCSessionRequest,
} from './types'

// Authentication Module API
export const authApi = {
  // Disable local password
  deleteauthlocalpassword: (
    data: kvmLoginRequest,
    options?: RequestConfig
  ): Promise<> => {
    return request.delete('/auth/local-password', {
      data,
      ...options,
    })
  },
  // local login
  postauthloginlocal: (
    data: kvmLoginRequest,
    options?: RequestConfig
  ): Promise<> => {
    return request.post('/auth/login-local', data, options)
  },
  // Local logout
  postauthlogout: (options?: RequestConfig): Promise<> => {
    return request.post('/auth/logout', data, options)
  },
  // Change local password
  putauthpasswordlocal: (
    data: kvmChangePasswordRequest,
    options?: RequestConfig
  ): Promise<> => {
    return request.put('/auth/password-local', data, options)
  },
  // Set local password
  postauthpasswordlocal: (
    data: kvmSetPasswordRequest,
    options?: RequestConfig
  ): Promise<> => {
    return request.post('/auth/password-local', data, options)
  },
}

// Cloud module API
export const cloudApi = {
  // Register the device to the cloud
  postcloudregister: (
    data: kvmCloudRegisterRequest,
    options?: RequestConfig
  ): Promise<> => {
    return request.post('/cloud/register', data, options)
  },
  // Get cloud status
  getcloudstate: (options?: RequestConfig): Promise<kvmCloudState> => {
    return request.get('/cloud/state', {
      params: {},
      ...options,
    })
  },
}

// Device Module API
export const deviceApi = {
  // Get device information
  getdevice: (options?: RequestConfig): Promise<kvmLocalDevice> => {
    return request.get('/device', {
      params: {},
      ...options,
    })
  },
  // Device initialization
  postdevicesetup: (
    data: kvmSetupRequest,
    options?: RequestConfig
  ): Promise<> => {
    return request.post('/device/setup', data, options)
  },
  // Get device settings status
  getdevicestatus: (options?: RequestConfig): Promise<kvmDeviceStatus> => {
    return request.get('/device/status', {
      params: {},
      ...options,
    })
  },
}

// Storage module API
export const storageApi = {
  // Upload files to device storage
  poststorageupload: (options?: RequestConfig): Promise<> => {
    return request.post('/storage/upload', data, options)
  },
}

// webrtc module API
export const webrtcApi = {
  // Traditional WebRTC session
  postwebrtcsession: (
    data: kvmWebRTCSessionRequest,
    options?: RequestConfig
  ): Promise<> => {
    return request.post('/webrtc/session', data, options)
  },
  // Native WebRTC signaling
  getwebrtcsignalingclient: (options?: RequestConfig): Promise<> => {
    return request.get('/webrtc/signaling/client', {
      params: {},
      ...options,
    })
  },
}

// Unified export
export const api = {
  auth: authApi,
  cloud: cloudApi,
  device: deviceApi,
  storage: storageApi,
  webrtc: webrtcApi,
}

export default api
