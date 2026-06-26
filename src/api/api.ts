/**
 * Auto-generated API module - 2025-07-28
 */

import { request } from './request';
import type { RequestConfig } from './request';
import type {
    kvmChangePasswordRequest,
    kvmCloudRegisterRequest,
    kvmCloudState,
    kvmDeviceStatus,
    kvmLocalDevice,
    kvmLoginRequest,
    kvmSetPasswordRequest,
    kvmSetupRequest,
    kvmWebRTCSessionRequest,
} from './types';

export const authApi = {
  deleteauthlocalpassword: (
    data: kvmLoginRequest,
    options?: RequestConfig
  ): Promise<unknown> => {
    return request.delete('/auth/local-password', {
      data,
      ...options,
    });
  },
  postauthloginlocal: (
    data: kvmLoginRequest,
    options?: RequestConfig
  ): Promise<unknown> => {
    return request.post('/auth/login-local', data, options);
  },
  postauthlogout: (options?: RequestConfig): Promise<unknown> => {
    return request.post('/auth/logout', undefined, options);
  },
  putauthpasswordlocal: (
    data: kvmChangePasswordRequest,
    options?: RequestConfig
  ): Promise<unknown> => {
    return request.put('/auth/password-local', data, options);
  },
  postauthpasswordlocal: (
    data: kvmSetPasswordRequest,
    options?: RequestConfig
  ): Promise<unknown> => {
    return request.post('/auth/password-local', data, options);
  },
};

export const cloudApi = {
  postcloudregister: (
    data: kvmCloudRegisterRequest,
    options?: RequestConfig
  ): Promise<unknown> => {
    return request.post('/cloud/register', data, options);
  },
  getcloudstate: (options?: RequestConfig): Promise<kvmCloudState> => {
    return request.get('/cloud/state', {
      params: {},
      ...options,
    });
  },
};

export const deviceApi = {
  getdevice: (options?: RequestConfig): Promise<kvmLocalDevice> => {
    return request.get('/device', {
      params: {},
      ...options,
    });
  },
  postdevicesetup: (
    data: kvmSetupRequest,
    options?: RequestConfig
  ): Promise<unknown> => {
    return request.post('/device/setup', data, options);
  },
  getdevicestatus: (options?: RequestConfig): Promise<kvmDeviceStatus> => {
    return request.get('/device/status', {
      params: {},
      ...options,
    });
  },
};

export const storageApi = {
  poststorageupload: (options?: RequestConfig): Promise<unknown> => {
    return request.post('/storage/upload', undefined, options);
  },
};

export const webrtcApi = {
  postwebrtcsession: (
    data: kvmWebRTCSessionRequest,
    options?: RequestConfig
  ): Promise<unknown> => {
    return request.post('/webrtc/session', data, options);
  },
  getwebrtcsignalingclient: (options?: RequestConfig): Promise<unknown> => {
    return request.get('/webrtc/signaling/client', {
      params: {},
      ...options,
    });
  },
};

export const api = {
  auth: authApi,
  cloud: cloudApi,
  device: deviceApi,
  storage: storageApi,
  webrtc: webrtcApi,
};

export default api;
