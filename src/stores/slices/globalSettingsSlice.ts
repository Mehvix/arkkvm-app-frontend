import i18n from '@/i18n'
import type { StateCreator } from 'zustand'

export type GlobalSettingsData = {
  currentLang: string
  supportedLanguages: { code: string; name: string }[]

  currentTheme: string

  hideCursor: boolean
  cursorStyle: 'dot' | 'arrow'
  mouseInputMode: string
  modifierReleaseMode: 'auto' | 'manual'

  scrollThrottling: number // 0 | 10 | 25 | 50 | 100
  keyboardLanguage: string
  showStatusBar: boolean
  showPressedKeys: boolean
  showDiagnosticInfo: boolean
  showKeyboardLeds: boolean
  enhancement: {
    preset: 'none' | 'balanced' | 'warm' | 'text' | 'custom'
    saturation: number
    brightness: number
    contrast: number
    hueRotate: number
  }
}

export type GlobalSettingsActions = {
  setLanguage: (lang: string) => void

  setTheme: (theme: string) => void
  setHideCursor: (v: boolean) => void
  setCursorStyle: (v: 'dot' | 'arrow') => void
  setScrollThrottling: (v: number) => void
  setKeyboardLanguage: (v: string) => void
  setShowStatusBar: (v: boolean) => void
  setShowPressedKeys: (v: boolean) => void
  setShowDiagnosticInfo: (v: boolean) => void
  setShowKeyboardLeds: (v: boolean) => void
  setMouseInputMode: (v: string) => void
  setModifierReleaseMode: (v: 'auto' | 'manual') => void
  setEnhancement: (v: GlobalSettingsData['enhancement']) => void
}

export type GlobalSettingsSlice = GlobalSettingsData & GlobalSettingsActions

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
  modifierReleaseMode: 'auto',

  currentLang: 'en',
  supportedLanguages: [
    { code: 'zh', name: '中文' },
    { code: 'en', name: 'English' },
  ],

  currentTheme: localStorage.getItem('ui-theme') || 'dark',
  enhancement: {
    preset: 'none',
    saturation: 1,
    brightness: 1,
    contrast: 1,
    hueRotate: 0,
  },
}

export const createGlobalSettingsSlice: StateCreator<
  GlobalSettingsSlice,
  [],
  [],
  GlobalSettingsSlice
> = (set, get) => ({
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
        }
      }
      return { ...state, showStatusBar: false }
    }),
  setShowPressedKeys: v => set(state => ({ ...state, showPressedKeys: !!v })),
  setShowDiagnosticInfo: v =>
    set(state => ({ ...state, showDiagnosticInfo: !!v })),
  setShowKeyboardLeds: v => set(state => ({ ...state, showKeyboardLeds: !!v })),
  setMouseInputMode: v => set(state => ({ mouseInputMode: v })),
  setModifierReleaseMode: v => set(state => ({ modifierReleaseMode: v })),
  setEnhancement: v => set(state => ({ enhancement: v })),

  setLanguage: (lang: string) => {
    if (get().currentLang === lang) {
      return true
    }

    const isValidLang = get().supportedLanguages.some(l => l.code === lang)

    if (!isValidLang) {
      return false
    }

    try {
      set({ currentLang: lang })
      i18n.changeLanguage(lang)

      return true
    } catch (error) {
      return false
    }
  },

  setTheme: (theme: string) => {
    if (get().currentTheme === theme) {
      return true
    }

    const validThemes = ['dark', 'light']
    if (!validThemes.includes(theme)) {
      return false
    }

    try {
      localStorage.setItem('ui-theme', theme)

      set({ currentTheme: theme })

      return true
    } catch (error) {
      return false
    }
  },
})
