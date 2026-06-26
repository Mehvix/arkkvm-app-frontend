import type { GetVlanSettingsResponse } from './network';
import type { RegisterTailscaleResponse, SwitchTailscaleParams, TailscaleStateResponse } from './tailscale';

export interface CloudStateResponse {
  connected: boolean
  url: string
  appUrl: string
}

export type TLSMode = 'disabled' | 'self-signed' | 'custom'

export interface TLSStateResponse {
  mode: TLSMode
  certificate?: string
  privateKey?: string
}

export interface TLSStateRequest {
  mode: TLSMode
  certificate?: string
  privateKey?: string
}

export interface MethodParamsMap {
  setAudioQuality:{ factor: number },
  setAudioPlayback: { enabled: boolean },
  keyboardReport: { keys: number[]; modifier: number }
  relMouseReport: { dx: number; dy: number; buttons: number }
  absMouseReport: { x: number; y: number; buttons: number }
  wheelReport: { wheelY: number }
  getKeyboardLayout: void
  setKeyboardLayout: { layout: string }
  getKeyboardLedState: void
  getCameraEmulation: void
  getMicrophoneEmulation: void

  getVideoState: void
  getUpdateStatus: void
  getDeviceID: void
  getCurrentVersion: { showUI?: boolean }
  getFileTransfer: void
  getAutoUpdateState: void
  getUiSwitch: void
  getAudioPlayback: void

  getCloudState: void
  getTLSState: void
  deregisterDevice: void
  setCloudUrl: { apiUrl: string; appUrl: string }
  setTLSState: {
    state: TLSStateRequest
  }
  mouseWheel: { deltaX: number; deltaY: number }
  mouseClick: { button: number }
  keyEvent: { type: 'keydown' | 'keyup'; key: string; keyCode: string }
  ping: void
  reboot: { force?: boolean }
  getNetworkState: void
  getNetworkSettings: void
  setNetworkSettings: { settings: Record<string, unknown> }
  renewDHCPLease: void
  getUSBState: void
  unmountImage: void
  rpcMountBuiltInImage: { filename: string }
  setJigglerState: { enabled: boolean }
  getJigglerState: void
  sendWOLMagicPacket: { macAddress: string }
  getStreamQualityFactor: void
  setStreamQualityFactor: { factor: number }
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
  setMassStorageMode: { mode: string }
  getMassStorageMode: void
  isUpdatePending: void
  getUsbEmulationState: void
  setUsbEmulationState: { enabled: boolean }
  getUsbConfig: void
  setUsbConfig: { usbConfig: Record<string, unknown> }
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
  setWakeOnLanDevices: { params: Record<string, unknown> }
  resetConfig: void
  setDisplayRotation: { params: Record<string, unknown> }
  getDisplayRotation: void
  setBacklightSettings: { params: Record<string, unknown> }
  getBacklightSettings: void
  getDCPowerState: void
  setDCPowerState: { enabled: boolean }
  setDCRestoreState: { state: Record<string, unknown> }
  getActiveExtension: void
  setActiveExtension: { extensionId: string }
  getATXState: void
  setATXPowerAction: { action: string }
  getSerialSettings: void
  setSerialSettings: { settings: Record<string, unknown> }
  getUsbDevices: void
  setUsbDevices: { devices: unknown[] | Record<string, unknown> }
  getKeyboardMacros: void
  setKeyboardMacros: { params: Record<string, unknown> }
  getLocalLoopbackOnly: void
  setLocalLoopbackOnly: { enabled: boolean }
  getVlanSettings: void
  setVlanSettings: { settings: Record<string, unknown> }
  confirmVlanSettings: void
  revertVlanSettings: void
  getTailscaleState: void
  switchTailscale: SwitchTailscaleParams
  registerTailscale: void
  registerTailscaleForce: void
}
export type MethodName = keyof MethodParamsMap
export interface MethodResultMap extends Record<MethodName, unknown> {
  getCloudState: CloudStateResponse
  getDeviceID: string
  getTLSState: TLSStateResponse
  getTailscaleState: TailscaleStateResponse
  switchTailscale: null
  registerTailscale: RegisterTailscaleResponse
  registerTailscaleForce: RegisterTailscaleResponse
  getVlanSettings: GetVlanSettingsResponse
}
