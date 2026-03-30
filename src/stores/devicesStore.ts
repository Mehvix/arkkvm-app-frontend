import type { StateCreator } from 'zustand'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'

export type SettingsPanel =
  | 'regular'
  | 'mouse'
  | 'keyboard'
  | 'video'
  | 'hardware'
  | 'accessibility'
  | 'appearance'
  | 'network'
  | 'advanced'

// USB Configuration Types
export interface USBConfig {
  vendor_id: string
  product_id: string
  serial_number: string
  manufacturer: string
  product: string
}

// Network Configuration Types
export interface NetworkConfig {
  mac_address?: string
  hostname?: string
  http_proxy?: string
  domain?: string
  ipv4_mode?: string
  ipv6_mode?: string
  lldp_mode?: string
  lldp_tx_tlvs?: string[]
  mdns_mode?: string
  time_sync_mode?: string
  dhcp_lease?: any
  ipv6_addresses?: any[]
  ipv6_link_local?: string
}

export interface UsbDeviceConfig {
  keyboard: boolean
  absolute_mouse: boolean
  relative_mouse: boolean
  mass_storage: boolean
}
export type Step = {
  modifiers?: string[]
  keys?: string[]
  delay?: number
}

export type KeySequence = {
  id: string
  name: string
  steps: Step[]
  sortOrder: number
}
export interface NetworkSettings {
  hostname: string | null
  domain: string | null
  ipv4_mode: 'dhcp' | 'static'
  ipv6_mode: 'slaac' | 'static' | 'dhcpv6' | string
  lldp_mode: string
  lldp_tx_tlvs: string[]
  mdns_mode: string
  time_sync_mode: string
  time_sync_ordering: string[]
  time_sync_disable_fallback: boolean
  time_sync_parallel: number
}

export interface DhcpLease {
  ip: string
  netmask: string
  broadcast: string
  hostname: string
  bootp_next_server: string
  routers: string[]
  dns_servers: string[]
  lease: number
  server_id: string
}

export interface NetworkState {
  interface_name: string
  mac_address: string
  ipv4: string
  ipv6_link_local: string
  ipv4_addresses: string[]
  dhcp_lease: DhcpLease
}

export type NetworkInfo = NetworkSettings & NetworkState
export type DeviceSettings = {
  appVersion: string
  systemVersion: string
  autoUpdate: boolean
  jiggler: boolean
  mouseInputMode: 'absolute' | 'relative'
  ledSync: 'auto' | 'browser' | 'host'
  streamQualityAuto: boolean
  enhancement: {
    saturation: number
    brightness: number
    contrast: number
  }
  // hardware settings
  displayRotation: '270' | '90'
  backlightSettings: {
    max_brightness: number
    dim_after: number
    off_after: number
  }
  // USB configuration settings
  usbPreset?: string
  usbConfigProduct?: string
  usbConfig?: USBConfig
  usbDeviceConfig?: UsbDeviceConfig
  //
  keyboardMacros: {
    macros: KeySequence[]
    lastSync: number
    isDirty: boolean
  }
  network: NetworkConfig
  developerMode: boolean
  debugMode: boolean
  //new
  microphoneEmulation: boolean
  cameraEmulation: boolean
  fileTransfer: boolean
  audioPlayback: boolean
  streamQuality: number
  showAudioPlaybackUI: boolean
  isMicrophoneStreamActive: boolean
}

export type ChannelState = {
  name: string
  inputType: 'HDMI' | 'DP' | 'USBC' | 'AUTO'
  resolution: string // e.g. 1920x1080@60
  fps?: number
  bitrateKbps?: number
  edidOn?: boolean
  streamQualityAuto?: boolean
  enhancementOverride?: Partial<DeviceSettings['enhancement']>
  webrtc?: {
    sessionId?: string
    peerId?: string
    iceConnectionState?: RTCPeerConnectionState
    dataChannelState?: 'open' | 'closing' | 'closed' | 'connecting'
    lastStat?: { bitrateKbps?: number; fps?: number }
  }
}

export type DeviceNode = {
  settings: DeviceSettings
  channelRuntime: {
    activeChannelId: string | null
    channels: Record<string, ChannelState>
  }
}

export interface DevicesStateData {
  devices: Record<string, DeviceNode>
  activeDeviceId: string | null
}

export interface DevicesStateActions {
  createDevice: (id: string, initial?: Partial<DeviceSettings>) => void
  removeDevice: (id: string) => void
  setActiveDevice: (id: string | null) => void
  setDeviceSetting: <K extends keyof DeviceSettings>(
    key: K,
    value:
      | DeviceSettings[K]
      | ((current: DeviceSettings[K]) => DeviceSettings[K])
  ) => void
  setNestedDeviceSetting: (
    updater: (prev: DeviceSettings) => DeviceSettings
  ) => void
  setDeviceSettingById: <K extends keyof DeviceSettings>(
    id: string,
    key: K,
    value:
      | DeviceSettings[K]
      | ((current: DeviceSettings[K]) => DeviceSettings[K])
  ) => void
  setNestedDeviceSettingById: (
    id: string,
    updater: (prev: DeviceSettings) => DeviceSettings
  ) => void
  resetSettings: (id?: string) => void
  //

  createChannel: (
    deviceId: string,
    channelId: string,
    initial?: Partial<ChannelState>
  ) => void
  removeChannel: (deviceId: string, channelId: string) => void
  setActiveChannel: (deviceId: string, channelId: string | null) => void
  setChannelState: <K extends keyof ChannelState>(
    deviceId: string,
    channelId: string,
    key: K,
    value: ChannelState[K]
  ) => void
  setNestedChannelState: (
    deviceId: string,
    channelId: string,
    updater: (prev: ChannelState) => ChannelState
  ) => void
}

export type SettingsState = DevicesStateData & DevicesStateActions
export const defaultUsbDeviceConfig: UsbDeviceConfig = {
  keyboard: true,
  absolute_mouse: true,
  relative_mouse: true,
  mass_storage: true,
}
export const defaultUsbConfig: USBConfig = {
  vendor_id: '0x1d6b',
  product_id: '0x0104',
  serial_number: 'deviceId',
  manufacturer: 'ArkKVM',
  product: 'USB Emulation Device',
}
export const defaultDeviceSettings = (): DeviceSettings => ({
  appVersion: '',
  systemVersion: '',
  autoUpdate: false,
  jiggler: false,
  mouseInputMode: 'absolute',
  ledSync: 'auto',
  streamQualityAuto: true,
  enhancement: { saturation: 1, brightness: 1, contrast: 1 },
  backlightSettings: {
    max_brightness: 64,
    dim_after: 1800,
    off_after: 0,
  },
  displayRotation: '90',
  usbPreset: 'default',
  usbDeviceConfig: defaultUsbDeviceConfig,
  usbConfigProduct: 'USB Emulation Device',
  usbConfig: defaultUsbConfig,

  keyboardMacros: {
    macros: [],
    lastSync: 0,
    isDirty: false,
  },
  network: {
    mac_address: '',
    hostname: '',
    domain: '',
    http_proxy: '',
    ipv4_mode: 'unknown',
    ipv6_mode: 'unknown',
    lldp_mode: 'unknown',
    lldp_tx_tlvs: [],
    mdns_mode: 'unknown',
    time_sync_mode: 'unknown',
  },
  developerMode: false,
  debugMode: false,
  //
  microphoneEmulation: false,
  cameraEmulation: false,
  fileTransfer: false,
  audioPlayback: false,
  showAudioPlaybackUI: false,
  isMicrophoneStreamActive: false,
  streamQuality: 1,
})

const normalizeSettings = (
  input?: Partial<DeviceSettings> | DeviceSettings
): DeviceSettings => {
  const base = defaultDeviceSettings()
  const s = { ...base, ...(input ?? {}) } as any

  if (s.mouseInputMode !== 'absolute' && s.mouseInputMode !== 'relative') {
    s.mouseInputMode = base.mouseInputMode
  }

  s.enhancement = {
    saturation: Math.max(
      0,
      Math.min(
        100,
        Number(s.enhancement?.saturation ?? base.enhancement.saturation)
      )
    ),
    brightness: Math.max(
      0,
      Math.min(
        100,
        Number(s.enhancement?.brightness ?? base.enhancement.brightness)
      )
    ),
    contrast: Math.max(
      0,
      Math.min(
        100,
        Number(s.enhancement?.contrast ?? base.enhancement.contrast)
      )
    ),
  }

  // ensure usbDevices exists as array
  if (!Array.isArray(s.usbDevices)) s.usbDevices = []

  return s as DeviceSettings
}

const shallowEqualObjects = (a: any, b: any): boolean => {
  if (Object.is(a, b)) return true
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  )
    return false
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false
    if (!Object.is(a[k], b[k])) return false
  }
  return true
}

const createSettingsState: StateCreator<SettingsState> = (set, get) => ({
  devices: {},
  activeDeviceId: null,

  createDevice: (id, initial) => {
    set(state => ({
      devices: {
        ...state.devices,
        [id]: {
          settings: normalizeSettings(initial),
          channelRuntime: { activeChannelId: null, channels: {} },
        },
      },
      activeDeviceId: state.activeDeviceId ?? id,
    }))
  },

  removeDevice: id => {
    set(state => {
      const next = { ...state.devices } as Record<string, DeviceNode>
      delete next[id]
      const newActive =
        state.activeDeviceId === id ? null : state.activeDeviceId
      return { devices: next, activeDeviceId: newActive }
    })
  },

  setActiveDevice: id => {
    set(() => ({ activeDeviceId: id }))
  },

  setDeviceSetting: (key, value) => {
    const id = get().activeDeviceId
    if (!id) return
    set(state => {
      const node = state.devices[id]
      const base = node?.settings ?? defaultDeviceSettings()
      const currentValue = base[key]
      const newValue = typeof value === 'function' ? value(currentValue) : value

      if (Object.is(currentValue as any, newValue as any)) return state as any

      return {
        devices: {
          ...state.devices,
          [id]: {
            settings: { ...base, [key]: newValue },
            channelRuntime: node?.channelRuntime ?? {
              activeChannelId: null,
              channels: {},
            },
          },
        },
        activeDeviceId: state.activeDeviceId ?? id,
      } as any
    })
  },

  setNestedDeviceSetting: updater => {
    const id = get().activeDeviceId
    if (!id) return
    set(state => {
      const node = state.devices[id]
      const prev = node?.settings ?? defaultDeviceSettings()
      const nextSettings = updater(prev)

      if (shallowEqualObjects(prev, nextSettings)) return state as any
      return {
        devices: {
          ...state.devices,
          [id]: {
            settings: nextSettings,
            channelRuntime: node?.channelRuntime ?? {
              activeChannelId: null,
              channels: {},
            },
          },
        },
        activeDeviceId: state.activeDeviceId ?? id,
      } as any
    })
  },

  setDeviceSettingById: (id, key, value) => {
    set(state => {
      const node = state.devices[id]
      const base = node?.settings ?? defaultDeviceSettings()
      const currentValue = base[key]
      const newValue = typeof value === 'function' ? value(currentValue) : value
      if (Object.is(currentValue as any, newValue as any)) return state as any

      return {
        devices: {
          ...state.devices,
          [id]: {
            settings: { ...base, [key]: newValue },
            channelRuntime: node?.channelRuntime ?? {
              activeChannelId: null,
              channels: {},
            },
          },
        },
        activeDeviceId: state.activeDeviceId ?? id,
      } as any
    })
  },

  setNestedDeviceSettingById: (id, updater) => {
    set(state => {
      const node = state.devices[id]
      const prev = node?.settings ?? defaultDeviceSettings()
      const nextSettings = updater(prev)
      if (shallowEqualObjects(prev, nextSettings)) return state as any
      return {
        devices: {
          ...state.devices,
          [id]: {
            settings: nextSettings,
            channelRuntime: node?.channelRuntime ?? {
              activeChannelId: null,
              channels: {},
            },
          },
        },
        activeDeviceId: state.activeDeviceId ?? id,
      } as any
    })
  },

  resetSettings: id => {
    if (id) {
      set(state => ({
        devices: {
          ...state.devices,
          [id]: {
            ...state.devices[id],
            settings: defaultDeviceSettings(),
          },
        },
      }))
    } else {
      set(() => ({ devices: {}, activeDeviceId: null }))
    }
  },

  createChannel: (deviceId, channelId, initial) => {
    set(state => {
      const node = state.devices[deviceId]
      if (!node) return state as any
      const nextChannels = {
        ...node.channelRuntime.channels,
        [channelId]: {
          name: initial?.name ?? channelId,
          inputType: initial?.inputType ?? 'AUTO',
          resolution: initial?.resolution ?? '1920x1080@60',
          fps: initial?.fps,
          bitrateKbps: initial?.bitrateKbps,
          edidOn: initial?.edidOn,
          streamQualityAuto: initial?.streamQualityAuto,
          enhancementOverride: initial?.enhancementOverride,
          webrtc: initial?.webrtc,
        },
      } as Record<string, ChannelState>
      return {
        devices: {
          ...state.devices,
          [deviceId]: {
            ...node,
            channelRuntime: {
              activeChannelId: node.channelRuntime.activeChannelId ?? channelId,
              channels: nextChannels,
            },
          },
        },
      } as any
    })
  },

  removeChannel: (deviceId, channelId) => {
    set(state => {
      const node = state.devices[deviceId]
      if (!node) return state as any
      const next = { ...node.channelRuntime.channels }
      delete next[channelId]
      const nextActive =
        node.channelRuntime.activeChannelId === channelId
          ? null
          : node.channelRuntime.activeChannelId
      return {
        devices: {
          ...state.devices,
          [deviceId]: {
            ...node,
            channelRuntime: { activeChannelId: nextActive, channels: next },
          },
        },
      } as any
    })
  },

  setActiveChannel: (deviceId, channelId) => {
    set(state => {
      const node = state.devices[deviceId]
      if (!node) return state as any
      return {
        devices: {
          ...state.devices,
          [deviceId]: {
            ...node,
            channelRuntime: {
              ...node.channelRuntime,
              activeChannelId: channelId,
            },
          },
        },
      } as any
    })
  },

  setChannelState: (deviceId, channelId, key, value) => {
    set(state => {
      const node = state.devices[deviceId]
      if (!node) return state as any
      const ch = node.channelRuntime.channels[channelId]
      if (!ch) return state as any
      return {
        devices: {
          ...state.devices,
          [deviceId]: {
            ...node,
            channelRuntime: {
              ...node.channelRuntime,
              channels: {
                ...node.channelRuntime.channels,
                [channelId]: { ...ch, [key]: value },
              },
            },
          },
        },
      } as any
    })
  },

  setNestedChannelState: (deviceId, channelId, updater) => {
    set(state => {
      const node = state.devices[deviceId]
      if (!node) return state as any
      const ch = node.channelRuntime.channels[channelId]
      if (!ch) return state as any
      return {
        devices: {
          ...state.devices,
          [deviceId]: {
            ...node,
            channelRuntime: {
              ...node.channelRuntime,
              channels: {
                ...node.channelRuntime.channels,
                [channelId]: updater(ch),
              },
            },
          },
        },
      } as any
    })
  },
})

export const useSettingsStore = create<SettingsState>()(
  persist(createSettingsState, {
    name: 'devices-storage',

    partialize: state => ({
      activeDeviceId: state.activeDeviceId,
      devices: Object.fromEntries(
        Object.entries(state.devices).map(([id, node]) => [
          id,
          { settings: node.settings },
        ])
      ),
    }),
    merge: (persisted, current) => {
      const p = persisted as Partial<DevicesStateData> | undefined
      const c = current as SettingsState
      const mergedDevices: Record<string, DeviceNode> = {}

      const allIds = new Set([
        ...Object.keys(c.devices || {}),
        ...Object.keys(p?.devices || {}),
      ])
      for (const id of allIds) {
        const currentNode = c.devices[id]
        const persistedNode = (p?.devices as any)?.[id]
        mergedDevices[id] = {
          settings: normalizeSettings(
            persistedNode?.settings ?? currentNode?.settings ?? base
          ),
          channelRuntime: currentNode?.channelRuntime ?? {
            activeChannelId: null,
            channels: {},
          },
        }
      }

      const merged: SettingsState = {
        ...c,
        devices: mergedDevices,
        activeDeviceId: p?.activeDeviceId ?? c.activeDeviceId,
      } as any

      if (!merged.activeDeviceId) {
        const keys = Object.keys(merged.devices)
        if (keys.length) merged.activeDeviceId = keys[0]
      }
      return merged
    },
  })
)

export const useActiveDeviceId = () => useSettingsStore(s => s.activeDeviceId)
export const useActiveDeviceNode = () =>
  useSettingsStore(s =>
    s.activeDeviceId ? s.devices[s.activeDeviceId] : undefined
  )

const DEFAULT_SETTINGS_SINGLETON: DeviceSettings = defaultDeviceSettings()

export function useActiveDeviceSettings(): DeviceSettings
export function useActiveDeviceSettings<T>(
  selector: (settings: DeviceSettings) => T
): T
export function useActiveDeviceSettings<T>(
  selector?: (settings: DeviceSettings) => T
) {
  return useSettingsStore(s => {
    const settings = s.activeDeviceId
      ? (s.devices[s.activeDeviceId]?.settings ?? DEFAULT_SETTINGS_SINGLETON)
      : DEFAULT_SETTINGS_SINGLETON

    return selector ? selector(settings) : settings
  })
}

export const useActiveDeviceSelect = <T>(
  selector: (settings: DeviceSettings) => T,
  equalityFn: (a: T, b: T) => boolean = shallow
) =>
  useSettingsStore(s => {
    const settings = s.activeDeviceId
      ? (s.devices[s.activeDeviceId]?.settings ?? DEFAULT_SETTINGS_SINGLETON)
      : DEFAULT_SETTINGS_SINGLETON
    return selector(settings)
  }, equalityFn)
export const useActiveChannelState = () =>
  useSettingsStore(s => {
    if (!s.activeDeviceId) return undefined
    const node = s.devices[s.activeDeviceId]
    const chId = node.channelRuntime.activeChannelId
    return chId ? node.channelRuntime.channels[chId] : undefined
  })
export const useSettingsActions = () => {
  const createDevice = useSettingsStore.getState().createDevice
  const removeDevice = useSettingsStore.getState().removeDevice
  const setActiveDevice = useSettingsStore.getState().setActiveDevice
  const setDeviceSetting = useSettingsStore.getState().setDeviceSetting
  const setNestedDeviceSetting =
    useSettingsStore.getState().setNestedDeviceSetting
  const setDeviceSettingById = useSettingsStore.getState().setDeviceSettingById
  const setNestedDeviceSettingById =
    useSettingsStore.getState().setNestedDeviceSettingById
  const resetSettings = useSettingsStore.getState().resetSettings
  const createChannel = useSettingsStore.getState().createChannel
  const removeChannel = useSettingsStore.getState().removeChannel
  const setActiveChannel = useSettingsStore.getState().setActiveChannel
  const setChannelState = useSettingsStore.getState().setChannelState
  const setNestedChannelState =
    useSettingsStore.getState().setNestedChannelState

  return {
    createDevice,
    removeDevice,
    setActiveDevice,
    setDeviceSetting,
    setNestedDeviceSetting,
    setDeviceSettingById,
    setNestedDeviceSettingById,
    resetSettings,

    createChannel,
    removeChannel,
    setActiveChannel,
    setChannelState,
    setNestedChannelState,
  } as const
}

export const useDevicesStore = useSettingsStore

export const useActiveDeviceChannelLink = () =>
  useSettingsStore(s => {
    const deviceId = s.activeDeviceId ?? null
    if (!deviceId)
      return {
        deviceId: null as string | null,
        channelId: null as string | null,
        sessionId: null as string | null,
      }
    const node = s.devices[deviceId]
    const channelId = node?.channelRuntime.activeChannelId ?? null
    const sessionId = channelId
      ? (node.channelRuntime.channels[channelId]?.webrtc?.sessionId ?? null)
      : null
    return { deviceId, channelId, sessionId }
  })
