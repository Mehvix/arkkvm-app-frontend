import i18n from '@/i18n';
import type { MouseInputMode } from '@/components/settings/UsbMouseModeSync';
import type { StateCreator } from 'zustand';
import type { RootState } from '../types';

export type GlobalSettingsData = {
  // Language settings.
  currentLang: string;
  supportedLanguages: { code: string; name: string }[];

  // Theme settings.
  currentTheme: string;

  // UI/local preferences (not strongly bound to device settings).
  hideCursor: boolean;
  cursorStyle: 'dot' | 'arrow';
  mouseInputMode: MouseInputMode;
  preferredMouseInputMode: MouseInputMode;
  modifierReleaseMode: 'auto' | 'manual'; // Modifier release mode.
  // Numeric throttling where 0 disables throttling.
  scrollThrottling: number; // 0 | 10 | 25 | 50 | 100
  keyboardLanguage: string; // Keyboard layout ID (for example, 'en-US-qwerty').
  showStatusBar: boolean; // Toggle status bar visibility.
  showPressedKeys: boolean; // Toggle pressed-key indicators.
  showDiagnosticInfo: boolean; // Toggle diagnostic information visibility.
  showKeyboardLeds: boolean; // Toggle keyboard LED indicators.
  typingSpeed: 'slow' | 'normal' | 'fast'; // Paste text typing speed.
  keyboardTargetSystem: 'windows' | 'mac'; // Target OS for paste text and keyboard layout.
  enhancement: {
    preset: 'none' | 'balanced' | 'warm' | 'text' | 'custom';
    saturation: number;
    brightness: number;
    contrast: number;
    hueRotate: number;
  };
};

export type GlobalSettingsActions = {
  // Language actions.
  setLanguage: (lang: string) => void;
  // Theme actions.
  setTheme: (theme: string) => void;
  setHideCursor: (v: boolean) => void;
  setCursorStyle: (v: 'dot' | 'arrow') => void;
  setScrollThrottling: (v: number) => void;
  setKeyboardLanguage: (v: string) => void;
  setShowStatusBar: (v: boolean) => void;
  setShowPressedKeys: (v: boolean) => void;
  setShowDiagnosticInfo: (v: boolean) => void;
  setShowKeyboardLeds: (v: boolean) => void;
  setMouseInputMode: (v: MouseInputMode) => void;
  setTemporaryMouseInputMode: (v: MouseInputMode) => void;
  setModifierReleaseMode: (v: 'auto' | 'manual') => void;
  setEnhancement: (v: GlobalSettingsData['enhancement']) => void;
  setTypingSpeed: (v: 'slow' | 'normal' | 'fast') => void;
  setKeyboardTargetSystem: (v: 'windows' | 'mac') => void;
  resetGlobalSettings: () => void;
};

export type GlobalSettingsSlice = GlobalSettingsData & GlobalSettingsActions;

const DEFAULTS: GlobalSettingsData = {
  hideCursor: false,
  cursorStyle: 'dot',
  scrollThrottling: 0,
  keyboardLanguage: 'en-US-qwerty',
  showStatusBar: true,
  showPressedKeys: true,
  showDiagnosticInfo: false,
  showKeyboardLeds: true,
  mouseInputMode: 'absolute',
  preferredMouseInputMode: 'absolute',
  modifierReleaseMode: 'auto',
  typingSpeed: 'normal',
  keyboardTargetSystem: 'windows' as 'windows' | 'mac',
  // Default language is English unless user preference is explicitly set.
  currentLang: 'en',
  supportedLanguages: [
    { code: 'zh', name: 'Chinese' },
    { code: 'en', name: 'English' },
  ],

  // Theme default values.
  currentTheme: 'dark',
  enhancement: {
    preset: 'none',
    saturation: 1,
    brightness: 1,
    contrast: 1,
    hueRotate: 0,
  },
};

export const createGlobalSettingsSlice: StateCreator<RootState, [], [], GlobalSettingsSlice> = (
  set,
  get
) => ({
  ...DEFAULTS,
  setHideCursor: v => set(state => ({ ...state, hideCursor: !!v })),
  setCursorStyle: v => set(state => ({ ...state, cursorStyle: v })),
  setScrollThrottling: v =>
    set(state => ({
      ...state,
      scrollThrottling: Number.isFinite(v) ? v : 0,
    })),
  setKeyboardLanguage: v => set(state => ({ ...state, keyboardLanguage: v })),
  setShowStatusBar: v =>
    set(state => {
      if (!!v) {
        return {
          ...state,
          showStatusBar: true,
          showPressedKeys: true,
          showDiagnosticInfo: true,
          showKeyboardLeds: true,
        };
      }
      return { ...state, showStatusBar: false };
    }),
  setShowPressedKeys: v => set(state => ({ ...state, showPressedKeys: !!v })),
  setShowDiagnosticInfo: v => set(state => ({ ...state, showDiagnosticInfo: !!v })),
  setShowKeyboardLeds: v => set(state => ({ ...state, showKeyboardLeds: !!v })),
  setMouseInputMode: v => set({ mouseInputMode: v, preferredMouseInputMode: v }),
  setTemporaryMouseInputMode: v => set({ mouseInputMode: v }),
  setModifierReleaseMode: v => set({ modifierReleaseMode: v }),
  setEnhancement: v => set({ enhancement: v }),
  setTypingSpeed: v => {
    localStorage.setItem('typing-speed', v);
    set({ typingSpeed: v });
  },
  setKeyboardTargetSystem: v => set({ keyboardTargetSystem: v }),
  resetGlobalSettings: () => {
    const keysToClear = [
      'loglevel',
      'preferred-language',
      'transfer:list',
      'typing-speed',
      'ui-theme',
    ];
    for (const key of keysToClear) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore localStorage errors (e.g. private mode).
      }
    }
    set({ ...DEFAULTS });
  },
  // Language action implementation.
  setLanguage: (lang: string) => {
    // Skip when language is unchanged.
    if (get().currentLang === lang) {
      return true;
    }

    // Validate language support.
    const isValidLang = get().supportedLanguages.some(l => l.code === lang);

    if (!isValidLang) {
      return false;
    }

    try {
      // Apply state and i18n update.
      set({ currentLang: lang });
      i18n.changeLanguage(lang);

      return true;
    } catch {
      return false;
    }
  },

  // Theme action implementation.
  setTheme: (theme: string) => {
    // Skip when theme is unchanged.
    if (get().currentTheme === theme) {
      return true;
    }

    // Validate supported themes.
    const validThemes = ['dark', 'light'];
    if (!validThemes.includes(theme)) {
      return false;
    }

    try {
      // Persist theme to local storage.
      localStorage.setItem('ui-theme', theme);

      // Update state.
      set({ currentTheme: theme });

      return true;
    } catch {
      return false;
    }
  },
});
