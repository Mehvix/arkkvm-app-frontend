import type { StateCreator } from 'zustand';
import type { RootState } from '../types';
// Panel enum aligned with UI panels.
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

// Settings structure for a single device.
export type DeviceSettings = {
  // Regular
  appVersion: string
  authMode: string
  systemVersion: string
  autoUpdate: boolean
  // Mouse
  hideCursor: boolean
  scrollThrottling: boolean
  jiggler: boolean
  mouseInputMode: 'absolute' | 'relative'
  // Keyboard
  pasteText: boolean
  ledSync: boolean
  showPressedKeys: boolean
  // Video
  streamQualityAuto: boolean
  enhancement: {
    preset: 'none' | 'balanced' | 'warm' | 'text' | 'custom' // Selected preset mode
    saturation: number // 0-100
    brightness: number // 0-100
    contrast: number // 0-100
    hueRotate: number // -180 to 180 degrees
  }
  edidOn: boolean
  // Hardware
  orientation: '270' | '90'
  displayBrightness: number // 0-100
  dimAfterSeconds: number // 0 => never
  turnOffAfterSeconds: number // 0 => never
  usb: {
    classes: string // e.g. HID, MassStorage, etc
    identifiers: string // vendorId:productId
  }
  // Advanced
  webTerminalEnabled: boolean
  debugMode: boolean
  // Network (example fields; can be aligned with backend schema later).
  network: {
    mac: string
    hostname: string
    httpProxy: string
    domainMode: 'dhcp' | 'manual'
    domainSuffix: string
    mdns: 'off' | 'auto' | 'on'
    timeSync: 'ntp+http' | 'ntp' | 'http' | 'manual'
    ntpServer: string
    httpTimeUrl: string
    ipv4Mode: 'dhcp' | 'static'
    ipv6Mode: 'slaac' | 'dhcpv6' | 'static'
  }
}

// Settings data (data fields only).
export interface SettingsStateData {
  // Multi-device state.
  devices: Record<string, DeviceSettings>
  activeDeviceId: string | null
}

// Action methods.
export interface SettingsStateActions {
  // Create/remove/switch devices.
  createDevice: (id: string, initial?: Partial<DeviceSettings>) => void
  removeDevice: (id: string) => void
  setActiveDevice: (id: string | null) => void

  // Set fields for the currently active device.
  setDeviceSetting: <K extends keyof DeviceSettings>(
    key: K,
    value: DeviceSettings[K]
  ) => void
  setNestedDeviceSetting: (
    updater: (prev: DeviceSettings) => DeviceSettings
  ) => void

  // Set fields on any specified device.
  setDeviceSettingById: <K extends keyof DeviceSettings>(
    id: string,
    key: K,
    value: DeviceSettings[K]
  ) => void
  setNestedDeviceSettingById: (
    id: string,
    updater: (prev: DeviceSettings) => DeviceSettings
  ) => void

  // Reset settings.
  resetSettings: (id?: string) => void // Reset all devices when id is omitted.
}

export type SettingsSlice = {
  settings: SettingsStateData & SettingsStateActions
}

const defaultDeviceSettings = (): DeviceSettings => ({
  appVersion: '',
  authMode: 'noPassword',
  systemVersion: '',
  autoUpdate: false,
  hideCursor: false,
  scrollThrottling: false,
  jiggler: false,
  mouseInputMode: 'absolute',
  pasteText: false,
  ledSync: false,
  showPressedKeys: false,
  streamQualityAuto: true,
  enhancement: { preset: 'none', saturation: 1, brightness: 1, contrast: 1, hueRotate: 0 },
  edidOn: false,
  orientation: '270',
  displayBrightness: 100,
  dimAfterSeconds: 0,
  turnOffAfterSeconds: 0,
  usb: { classes: 'HID', identifiers: '0000:0000' },
  network: {
    mac: '',
    hostname: 'ArkKVM',
    httpProxy: '',
    domainMode: 'dhcp',
    domainSuffix: '',
    mdns: 'auto',
    timeSync: 'ntp+http',
    ntpServer: 'pool.ntp.org',
    httpTimeUrl: '',
    ipv4Mode: 'dhcp',
    ipv6Mode: 'slaac',
  },
});

export const createSettingsSlice: StateCreator<RootState, [], [], SettingsSlice> = (set, get) => ({
  settings: {
    devices: {},
    activeDeviceId: null,

    createDevice: (id, initial) => {
      set((state: RootState) => ({
        settings: {
          ...state.settings,
          devices: {
            ...state.settings.devices,
            [id]: {
              ...defaultDeviceSettings(),
              ...(initial ?? {}),
            },
          },
          activeDeviceId: state.settings.activeDeviceId ?? id,
        },
      }));
    },

    removeDevice: id => {
      set((state: SettingsSlice) => {
        const next = { ...state.settings.devices } as Record<
          string,
          DeviceSettings
        >;
        delete next[id];
        const newActive =
          state.settings.activeDeviceId === id
            ? null
            : state.settings.activeDeviceId;
        return {
          settings: {
            ...state.settings,
            devices: next,
            activeDeviceId: newActive,
          },
        };
      });
    },

    setActiveDevice: id => {
      set((state: RootState) => ({
        settings: { ...state.settings, activeDeviceId: id },
      }));
    },

    setDeviceSetting: (key, value) => {
      const id = get().settings.activeDeviceId;
      if (!id) return;
      set((state: RootState) => ({
        settings: {
          ...state.settings,
          devices: {
            ...state.settings.devices,
            [id]: { ...state.settings.devices[id], [key]: value },
          },
        },
      }));
    },

    setNestedDeviceSetting: updater => {
      const id = get().settings.activeDeviceId;
      if (!id) return;
      set((state: RootState) => ({
        settings: {
          ...state.settings,
          devices: {
            ...state.settings.devices,
            [id]: updater(state.settings.devices[id]),
          },
        },
      }));
    },

    setDeviceSettingById: (id, key, value) => {
      set((state: RootState) => ({
        settings: {
          ...state.settings,
          devices: {
            ...state.settings.devices,
            [id]: { ...state.settings.devices[id], [key]: value },
          },
        },
      }));
    },

    setNestedDeviceSettingById: (id, updater) => {
      set((state: RootState) => ({
        settings: {
          ...state.settings,
          devices: {
            ...state.settings.devices,
            [id]: updater(state.settings.devices[id]),
          },
        },
      }));
    },

    resetSettings: id => {
      if (id) {
        set((state: RootState) => ({
          settings: {
            ...state.settings,
            devices: {
              ...state.settings.devices,
              [id]: defaultDeviceSettings(),
            },
          },
        }));
      } else {
        set((state: RootState) => ({
          settings: {
            ...state.settings,
            devices: {},
            activeDeviceId: null,
          },
        }));
      }
    },
  },
});
