// src/stores/index.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'

// slices
import { createHidSlice } from './slices/hidSlice'
import { createMouseSlice } from './slices/mouseSlice'
import { createRTCSlice, type WebRTCState } from './slices/rtcSlice'
import { createUISlice, type UISlice } from './slices/uiSlice'
import { RootState } from './types'
// import { createSettingsSlice } from './slices/settingsSlice';
import { createDeviceStateSlice } from './slices/deviceStateSlice'
import { createFileTransferDownloadListSlice } from './slices/fileTransferDownloadSlice'
import { createFileTransferUploadListSlice } from './slices/fileTransferListSlice'
import { createGlobalSettingsSlice } from './slices/globalSettingsSlice'
import type { SettingsSlice } from './slices/settingsSlice'
import { createSetupSlice } from './slices/setupSlice'
import { createUpdateSlice } from './slices/updateSlice'
import { createUploadSlice } from './slices/uploadSlice'
import { createUserSlice } from './slices/userSlice'
export type { UpdateModalView } from './slices/updateSlice'

export const useAppStore = create<RootState>()(
  devtools(
    persist(
      (set, get, api) => ({
        ...createMouseSlice(set),
        ...createHidSlice(set),
        // ...createSettingsSlice(set, get),
        ...createUpdateSlice(set),
        ...createGlobalSettingsSlice(set, get),
        ...createUserSlice(set, get),
        ...createUploadSlice(set, get),
        ...createDeviceStateSlice(set, get),
        ...createSetupSlice(set, get),
        fileTransferList: createFileTransferUploadListSlice(set, get),
        fileDownloadList: createFileTransferDownloadListSlice(set, get),
        rtc: createRTCSlice(set, get),
        ui: createUISlice(set, get),
      }),

      {
        name: 'app-storage',

        partialize: state => ({
          showStatusBar: (state as any).showStatusBar,
          showPressedKeys: (state as any).showPressedKeys,
          showDiagnosticInfo: (state as any).showDiagnosticInfo,
          showKeyboardLeds: (state as any).showKeyboardLeds,
          localAuthMode: (state as any).localAuthMode,
          password: (state as any).password,
          modifierReleaseMode: (state as any).modifierReleaseMode,
          microphone_emulation: (state as any).microphone_emulation,
          camera_emulation: (state as any).camera_emulation,
          file_transfer: (state as any).file_transfer,
          audio_playback: (state as any).audio_playback,
          completed: (state as any).completed,
          currentLang: state.currentLang,
          supportedLanguages: state.supportedLanguages,
          currentTheme: state.currentTheme,
          hideCursor: state.hideCursor,
          scrollThrottling: state.scrollThrottling,
          pasteText: state.pasteText,
          showPressedKeys: state.showPressedKeys,
          mouseInputMode: state.mouseInputMode,
          enhancement: state.enhancement,

          uiControlLayoutMode: (state as any).ui?.controlLayoutMode,

          uploads: state.uploads,
          keyboardLanguage: state.keyboardLanguage,

          // settings: Object.fromEntries(
          //   Object.entries(state.settings).filter(([, v]) => typeof v !== 'function')
          // ),
        }),

        merge: (persistedState, currentState) => {
          const p = persistedState as any
          const c = currentState as any

          const mergedWithSetup = {
            ...c,
            ...p,
            localAuthMode: p?.localAuthMode ?? c.localAuthMode,
            password: p?.password ?? c.password,
            microphone_emulation:
              p?.microphone_emulation ?? c.microphone_emulation,
            camera_emulation: p?.camera_emulation ?? c.camera_emulation,
            file_transfer: p?.file_transfer ?? c.file_transfer,
            audio_playback: p?.audio_playback ?? c.audio_playback,
            completed: p?.completed ?? c.completed,
          }

          if (!c?.settings && !p?.settings) {
            const mergedUi = {
              ...(c as any).ui,
              controlLayoutMode:
                (p as any)?.uiControlLayoutMode ??
                (c as any).ui?.controlLayoutMode,
            }

            return {
              ...mergedWithSetup,
              ui: mergedUi,

              uploads: { ...(p?.uploads ?? {}), ...(c?.uploads ?? {}) },
            } as RootState
          }

          const persistedHasDevices =
            !!p?.settings &&
            p.settings.devices &&
            Object.keys(p.settings.devices).length > 0

          const mergedSettingsBase = persistedHasDevices
            ? { ...(c.settings ?? {}), ...p.settings }
            : (c.settings ?? {})

          const ensureActive = () => {
            if (!mergedSettingsBase.activeDeviceId) {
              const keys = Object.keys(mergedSettingsBase.devices || {})
              if (keys.length > 0) {
                return { ...mergedSettingsBase, activeDeviceId: keys[0] }
              }
            }
            return mergedSettingsBase
          }
          const mergedSettings = ensureActive()

          const mergedUi = {
            ...(c as any).ui,
            controlLayoutMode:
              (p as any)?.uiControlLayoutMode ??
              (c as any).ui?.controlLayoutMode,
          }

          return {
            ...mergedWithSetup,
            ui: mergedUi,

            uploads: { ...(p?.uploads ?? {}), ...(c?.uploads ?? {}) },
            settings: mergedSettings,

            update: c.update,
          } as RootState
        },
      }
    )
  )
)

export function useRTCStore<T = WebRTCState>(
  selector?: (s: WebRTCState) => T,
  equality: (a: T, b: T) => boolean = Object.is
): T {
  if (!selector) {
    return useAppStore(state => state.rtc as unknown as T)
  }

  return useAppStore(state => selector(state.rtc), equality)
}

export const logRTCState = () => {
  const rtcState = useAppStore.getState().rtc
  return rtcState
}

export function useUiStore<T = UISlice>(
  selector?: (s: UISlice) => T,
  eq: (a: T, b: T) => boolean = shallow as unknown as (a: T, b: T) => boolean
): T {
  if (!selector) {
    return useAppStore(state => state.ui as unknown as T)
  }

  return useAppStore(s => selector(s.ui), eq)
}

// Performance optimization: Cache the DOM query result and use MutationObserver to update it
let cachedHasRadixOverlay = false
let overlayObserver: MutationObserver | null = null

// Initialize observer on first call
const initOverlayObserver = () => {
  if (typeof document === 'undefined' || overlayObserver) return

  const updateOverlayState = () => {
    try {
      // Combine selectors for a single query
      const selector = [
        '[role="dialog"][data-state="open"]',
        '[data-radix-alert-dialog-overlay]',
        '[data-radix-alert-dialog-content]',
        '[data-radix-popper-content-wrapper][data-state="open"]',
        '[data-radix-popover-content][data-state="open"]',
        '[data-radix-dialog-overlay]',
        '[data-slot="alert-dialog-overlay"][data-state="open"]',
      ].join(', ')

      cachedHasRadixOverlay = !!document.querySelector(selector)
    } catch {
      cachedHasRadixOverlay = false
    }
  }

  // Initial check
  updateOverlayState()

  // Watch for DOM changes
  overlayObserver = new MutationObserver(() => {
    updateOverlayState()
  })

  overlayObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-state', 'role', 'data-radix-alert-dialog-overlay'],
  })
}

export const isAnyUiPanelOpen = () => {
  const state = useAppStore.getState()
  const ui = state.ui
  // const { terminal } = ui.visible
  const { isPasteTextOpen } = ui
  if ([isPasteTextOpen].some(Boolean)) return true

  if (state.update?.isUpdatePending) return true
  if (typeof document !== 'undefined') {
    // Initialize observer on first call
    if (!overlayObserver) {
      initOverlayObserver()
    }
    return cachedHasRadixOverlay
  }

  return false
}

export const useSettingsStore = <T = SettingsSlice['settings']>(
  selector?: (s: SettingsSlice['settings']) => T
) => {
  return useAppStore(state =>
    selector ? selector(state.settings) : (state.settings as T)
  )
}

export const useActiveDeviceId = () =>
  useAppStore(s => s.settings?.activeDeviceId)

export const useActiveDeviceSettings = () =>
  useAppStore(s => {
    const id = s.settings?.activeDeviceId
    return id ? s.settings?.devices?.[id] : undefined
  })

export const useSettingsActions = () =>
  (() => {
    const createDevice = useAppStore(s => s.settings.createDevice)
    const removeDevice = useAppStore(s => s.settings.removeDevice)
    const setActiveDevice = useAppStore(s => s.settings.setActiveDevice)
    const setDeviceSetting = useAppStore(s => s.settings.setDeviceSetting)
    const setNestedDeviceSetting = useAppStore(
      s => s.settings.setNestedDeviceSetting
    )
    const setDeviceSettingById = useAppStore(
      s => s.settings.setDeviceSettingById
    )
    const setNestedDeviceSettingById = useAppStore(
      s => s.settings.setNestedDeviceSettingById
    )
    const resetSettings = useAppStore(s => s.settings.resetSettings)
    const createChannel = useAppStore(s => s.settings.createChannel)
    const removeChannel = useAppStore(s => s.settings.removeChannel)
    const setActiveChannel = useAppStore(s => s.settings.setActiveChannel)
    const setChannelState = useAppStore(s => s.settings.setChannelState)
    const setNestedChannelState = useAppStore(
      s => s.settings.setNestedChannelState
    )

    return {
      // device-level actions
      createDevice,
      removeDevice,
      setActiveDevice,
      setDeviceSetting,
      setNestedDeviceSetting,
      setDeviceSettingById,
      setNestedDeviceSettingById,
      resetSettings,
      // channel-level actions
      createChannel,
      removeChannel,
      setActiveChannel,
      setChannelState,
      setNestedChannelState,
    }
  })()

export const useGlobalSettingsStore = () => {
  const hideCursor = useAppStore(s => s.hideCursor)
  const cursorStyle = useAppStore(s => s.cursorStyle)
  const scrollThrottling = useAppStore(s => s.scrollThrottling)
  const keyboardLanguage = useAppStore(s => s.keyboardLanguage)
  const showPressedKeys = useAppStore(s => s.showPressedKeys)
  const currentLang = useAppStore(s => s.currentLang)
  const supportedLanguages = useAppStore(s => s.supportedLanguages)
  const currentTheme = useAppStore(s => s.currentTheme)
  const enhancement = useAppStore(s => s.enhancement)
  const mouseInputMode = useAppStore(s => s.mouseInputMode)
  const modifierReleaseMode = useAppStore(s => s.modifierReleaseMode)

  const setHideCursor = useAppStore.getState().setHideCursor
  const setCursorStyle = useAppStore.getState().setCursorStyle
  const setScrollThrottling = useAppStore.getState().setScrollThrottling
  const setKeyboardLanguage = useAppStore.getState().setKeyboardLanguage
  const setShowPressedKeys = useAppStore.getState().setShowPressedKeys
  const setLanguage = useAppStore.getState().setLanguage
  const setTheme = useAppStore.getState().setTheme
  const setMouseInputMode = useAppStore.getState().setMouseInputMode
  const setModifierReleaseMode = useAppStore.getState().setModifierReleaseMode
  const setEnhancement = useAppStore.getState().setEnhancement

  return {
    hideCursor,
    cursorStyle,
    scrollThrottling,
    keyboardLanguage,
    showPressedKeys,
    currentLang,
    supportedLanguages,
    currentTheme,
    enhancement,
    mouseInputMode,
    modifierReleaseMode,
    setHideCursor,
    setCursorStyle,
    setScrollThrottling,
    setKeyboardLanguage,
    setShowPressedKeys,
    setLanguage,
    setTheme,
    setMouseInputMode,
    setModifierReleaseMode,
    setEnhancement,
  }
}

export const useUploads = () => useAppStore((s: any) => s.uploads)
export const useUploadManager = () => {
  const uploads = useAppStore((s: any) => s.uploads)

  const registerUpload = useAppStore.getState().registerUpload
  const unregisterUpload = useAppStore.getState().unregisterUpload
  const clearUploads = useAppStore.getState().clearUploads
  return { uploads, registerUpload, unregisterUpload, clearUploads } as const
}

export const useUserStore = () => {
  const userInfo = useAppStore(s => s.userInfo)
  const token = useAppStore(s => s.token)
  const isLoggedIn = useAppStore(s => s.isLoggedIn)
  const useRouteAuth = useAppStore(s => s.useRouteAuth)
  const loading = useAppStore(s => s.loading)

  const setUserInfo = useAppStore.getState().setUserInfo
  const setToken = useAppStore.getState().setToken
  const setLoading = useAppStore.getState().setLoading
  const login = useAppStore.getState().login
  const logout = useAppStore.getState().logout
  const fetchUserDetail = useAppStore.getState().fetchUserDetail
  const checkAuth = useAppStore.getState().checkAuth

  return {
    userInfo,
    token,
    isLoggedIn,
    useRouteAuth,
    loading,
    setUserInfo,
    setToken,
    setLoading,
    login,
    logout,
    fetchUserDetail,
    checkAuth,
  }
}
