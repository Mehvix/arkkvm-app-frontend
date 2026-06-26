import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

import { createDeviceStateSlice } from './slices/deviceStateSlice';
import { createFileTransferDownloadListSlice } from './slices/fileTransferDownloadSlice';
import { createFileTransferUploadListSlice } from './slices/fileTransferListSlice';
import { createGlobalSettingsSlice } from './slices/globalSettingsSlice';
import { createHidSlice } from './slices/hidSlice';
import { createMouseSlice } from './slices/mouseSlice';
import { createRTCSlice, type WebRTCState } from './slices/rtcSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import type { SettingsSlice } from './slices/settingsSlice';
import { createSetupSlice } from './slices/setupSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createUpdateSlice } from './slices/updateSlice';
import { createUploadSlice } from './slices/uploadSlice';
import { createUserSlice } from './slices/userSlice';
import type { RootState } from './types';
export type { UpdateModalView } from './slices/updateSlice';

export const useAppStore = create<RootState>()(
  devtools(
    persist(
      // First argument: state initializer that returns the merged root state.
      (set, get, api) => ({
        ...createMouseSlice(set, get, api),
        ...createHidSlice(set, get, api),
        ...createUpdateSlice(set, get, api),
        ...createGlobalSettingsSlice(set, get, api),
        ...createUserSlice(set, get, api),
        ...createUploadSlice(set, get, api),
        ...createDeviceStateSlice(set, get, api),
        ...createSetupSlice(set, get, api),
        ...createSettingsSlice(set, get, api),
        fileTransferList: createFileTransferUploadListSlice(set, get, api),
        fileDownloadList: createFileTransferDownloadListSlice(set, get, api),
        rtc: createRTCSlice(set, get, api),
        ui: createUISlice(set, get, api),
      }),
      {
        name: 'app-storage',
        // Persist data-only fields and avoid serializing action functions.
        partialize: (state: RootState) => ({
          showStatusBar: state.showStatusBar,
          showPressedKeys: state.showPressedKeys,
          showDiagnosticInfo: state.showDiagnosticInfo,
          showKeyboardLeds: state.showKeyboardLeds,
          localAuthMode: state.localAuthMode,
          password: state.password,
          modifierReleaseMode: state.modifierReleaseMode,
          microphone_emulation: state.microphone_emulation,
          camera_emulation: state.camera_emulation,
          file_transfer: state.file_transfer,
          audio_playback: state.audio_playback,
          completed: state.completed,
          currentLang: state.currentLang,
          supportedLanguages: state.supportedLanguages,
          currentTheme: state.currentTheme,
          hideCursor: state.hideCursor,
          cursorStyle: state.cursorStyle,
          scrollThrottling: state.scrollThrottling,
          mouseInputMode: state.mouseInputMode,
          preferredMouseInputMode: state.preferredMouseInputMode,
          enhancement: state.enhancement,
          // Persist only UI layout mode to avoid overwriting the whole ui slice.
          uiControlLayoutMode: state.ui?.controlLayoutMode,
          // Persist upload sessions for cross-refresh visibility when needed.
          uploads: state.uploads,
          keyboardLanguage: state.keyboardLanguage,
        }),
        // Deep-merge persisted data while preserving runtime action references.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        merge: (persistedState: any, currentState: any) => {
          const p = persistedState;
          const c = currentState;

          // Merge persisted setup data (data fields only).
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
          };

          // If there is no settings slice in either state, return merged non-settings fields.
          if (!c?.settings && !p?.settings) {
            // Merge UI by overriding only controlLayoutMode.
            const mergedUi = {
              ...c.ui,
              controlLayoutMode:
                p?.uiControlLayoutMode ??
                c.ui?.controlLayoutMode,
            };

            return {
              ...mergedWithSetup,
              ui: mergedUi,
              // Merge uploads with runtime entries taking precedence.
              uploads: { ...(p?.uploads ?? {}), ...(c?.uploads ?? {}) },
            } as RootState;
          }

          const persistedHasDevices =
            !!p?.settings &&
            p.settings.devices &&
            Object.keys(p.settings.devices).length > 0;

          const mergedSettingsBase = persistedHasDevices
            ? { ...(c.settings ?? {}), ...p.settings }
            : (c.settings ?? {});

          // Auto-select the first device when activeDeviceId is missing.
          const ensureActive = () => {
            if (!mergedSettingsBase.activeDeviceId) {
              const keys = Object.keys(mergedSettingsBase.devices || {});
              if (keys.length > 0) {
                return { ...mergedSettingsBase, activeDeviceId: keys[0] };
              }
            }
            return mergedSettingsBase;
          };
          const mergedSettings = ensureActive();

          // Merge UI by overriding only controlLayoutMode.
          const mergedUi = {
            ...c.ui,
            controlLayoutMode:
              (p?.uiControlLayoutMode as string | undefined) ??
              c.ui?.controlLayoutMode,
          };

          return {
            ...mergedWithSetup,
            ui: mergedUi,
            // Merge uploads with runtime entries taking precedence.
            uploads: { ...(p?.uploads ?? {}), ...(c?.uploads ?? {}) },
            settings: mergedSettings,
            // Update state is not persisted and should use runtime state.
            update: c.update,
          } as RootState;
        },
      }
    )
  )
);

export function useRTCStore<T = WebRTCState>(
  selector?: (s: WebRTCState) => T,
  equality: (a: T, b: T) => boolean = Object.is
): T {
  // Backward compatibility: return full rtc slice when selector is omitted.
  if (!selector) {
    return useAppStore(state => state.rtc as unknown as T);
  }
  // Use selector and optional equality function to reduce unnecessary renders.
  return useAppStore(state => selector(state.rtc), equality);
}

// Convenience getter for rtc state snapshots.
export const logRTCState = () => {
  const rtcState = useAppStore.getState().rtc;
  return rtcState;
};

export function useUiStore<T = UISlice>(
  selector?: (s: UISlice) => T,
  eq: (a: T, b: T) => boolean = shallow as unknown as (a: T, b: T) => boolean
): T {
  // Backward compatibility: return full ui slice when selector is omitted.
  if (!selector) {
    return useAppStore(state => state.ui as unknown as T);
  }
  // Subscribe with selector when provided.
  return useAppStore(s => selector(s.ui), eq);
}

// Performance optimization: Cache the DOM query result and use MutationObserver to update it
let cachedHasRadixOverlay = false;
let overlayObserver: MutationObserver | null = null;

// Initialize observer on first call
const initOverlayObserver = () => {
  if (typeof document === 'undefined' || overlayObserver) return;

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
      ].join(', ');

      cachedHasRadixOverlay = !!document.querySelector(selector);
    } catch {
      cachedHasRadixOverlay = false;
    }
  };

  // Initial check
  updateOverlayState();

  // Watch for DOM changes
  overlayObserver = new MutationObserver(() => {
    updateOverlayState();
  });

  overlayObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-state', 'role', 'data-radix-alert-dialog-overlay'],
  });
};

export const isAnyUiPanelOpen = () => {
  const state = useAppStore.getState();
  const ui = state.ui;
  // const { terminal } = ui.visible
  const { isPasteTextOpen } = ui;
  if ([isPasteTextOpen].some(Boolean)) return true;

  // OTA / update dialogs can also capture keyboard focus.
  if (state.update?.isUpdatePending) return true;
  if (typeof document !== 'undefined') {
    // Initialize observer on first call
    if (!overlayObserver) {
      initOverlayObserver();
    }
    return cachedHasRadixOverlay;
  }

  return false;
};

// Settings slice access hook (including multi-device state).
export const useSettingsStore = <T = SettingsSlice['settings']>(
  selector?: (s: SettingsSlice['settings']) => T
) => {
  return useAppStore(state =>
    selector ? selector(state.settings) : (state.settings as T)
  );
};

// Common convenience hooks.
export const useActiveDeviceId = () =>
  useAppStore(s => s.settings?.activeDeviceId);

export const useActiveDeviceSettings = () =>
  useAppStore(s => {
    const id = s.settings?.activeDeviceId;
    return id ? s.settings?.devices?.[id] : undefined;
  });

export const useSettingsActions = () =>
  (() => {
    const createDevice = useAppStore(s => s.settings.createDevice);
    const removeDevice = useAppStore(s => s.settings.removeDevice);
    const setActiveDevice = useAppStore(s => s.settings.setActiveDevice);
    const setDeviceSetting = useAppStore(s => s.settings.setDeviceSetting);
    const setNestedDeviceSetting = useAppStore(
      s => s.settings.setNestedDeviceSetting
    );
    const setDeviceSettingById = useAppStore(
      s => s.settings.setDeviceSettingById
    );
    const setNestedDeviceSettingById = useAppStore(
      s => s.settings.setNestedDeviceSettingById
    );
    const resetSettings = useAppStore(s => s.settings.resetSettings);
    const createChannel = useAppStore(s => s.settings.createChannel);
    const removeChannel = useAppStore(s => s.settings.removeChannel);
    const setActiveChannel = useAppStore(s => s.settings.setActiveChannel);
    const setChannelState = useAppStore(s => s.settings.setChannelState);
    const setNestedChannelState = useAppStore(
      s => s.settings.setNestedChannelState
    );

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
    };
  })();

// GlobalSettings slice access hook.
export const useGlobalSettingsStore = () => {
  // Fine-grained subscriptions to avoid unnecessary rerenders.
  const hideCursor = useAppStore(s => s.hideCursor);
  const cursorStyle = useAppStore(s => s.cursorStyle);
  const scrollThrottling = useAppStore(s => s.scrollThrottling);
  const keyboardLanguage = useAppStore(s => s.keyboardLanguage);
  const showPressedKeys = useAppStore(s => s.showPressedKeys);
  const currentLang = useAppStore(s => s.currentLang);
  const supportedLanguages = useAppStore(s => s.supportedLanguages);
  const currentTheme = useAppStore(s => s.currentTheme);
  const enhancement = useAppStore(s => s.enhancement);
  const mouseInputMode = useAppStore(s => s.mouseInputMode);
  const preferredMouseInputMode = useAppStore(s => s.preferredMouseInputMode);
  const modifierReleaseMode = useAppStore(s => s.modifierReleaseMode);

  // Obtain setter references through getState() to avoid rerenders.
  const setHideCursor = useAppStore.getState().setHideCursor;
  const setCursorStyle = useAppStore.getState().setCursorStyle;
  const setScrollThrottling = useAppStore.getState().setScrollThrottling;
  const setKeyboardLanguage = useAppStore.getState().setKeyboardLanguage;
  const setShowPressedKeys = useAppStore.getState().setShowPressedKeys;
  const setLanguage = useAppStore.getState().setLanguage;
  const setTheme = useAppStore.getState().setTheme;
  const setMouseInputMode = useAppStore.getState().setMouseInputMode;
  const setTemporaryMouseInputMode =
    useAppStore.getState().setTemporaryMouseInputMode;
  const setModifierReleaseMode = useAppStore.getState().setModifierReleaseMode;
  const setEnhancement = useAppStore.getState().setEnhancement;

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
    preferredMouseInputMode,
    modifierReleaseMode,
    setHideCursor,
    setCursorStyle,
    setScrollThrottling,
    setKeyboardLanguage,
    setShowPressedKeys,
    setLanguage,
    setTheme,
    setMouseInputMode,
    setTemporaryMouseInputMode,
    setModifierReleaseMode,
    setEnhancement,
  };
};

// Upload sessions access hook.
export const useUploads = () => useAppStore(s => s.uploads);
export const useUploadManager = () => {
  const uploads = useAppStore(s => s.uploads);
  // Obtain setter references through getState() to avoid rerenders.
  const registerUpload = useAppStore.getState().registerUpload;
  const unregisterUpload = useAppStore.getState().unregisterUpload;
  const clearUploads = useAppStore.getState().clearUploads;
  return { uploads, registerUpload, unregisterUpload, clearUploads } as const;
};

// User slice access hook.
// Use fine-grained selectors to avoid unnecessary rerenders on full store updates.
export const useUserStore = () => {
  // Subscribe only to required state fields.
  const userInfo = useAppStore(s => s.userInfo);
  const token = useAppStore(s => s.token);
  const isLoggedIn = useAppStore(s => s.isLoggedIn);
  const useRouteAuth = useAppStore(s => s.useRouteAuth);
  const loading = useAppStore(s => s.loading);

  // Obtain setter references through getState() to avoid rerenders.
  const setUserInfo = useAppStore.getState().setUserInfo;
  const setToken = useAppStore.getState().setToken;
  const setLoading = useAppStore.getState().setLoading;
  const login = useAppStore.getState().login;
  const logout = useAppStore.getState().logout;
  const fetchUserDetail = useAppStore.getState().fetchUserDetail;
  const checkAuth = useAppStore.getState().checkAuth;

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
  };
};
