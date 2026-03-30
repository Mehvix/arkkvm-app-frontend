import { StateCreator } from 'zustand'

export type PanelId =
  | 'terminal'
  | 'virtualKeyboard'
  | 'settings'
  | 'extension'
  | 'connectionStats'

const EXCLUSIVE_MAIN: PanelId[] = [
  'terminal',
  'virtualKeyboard',
  'settings',
  'extension',
  'connectionStats',
]
const OVERLAYS: PanelId[] = []

export interface UIVisibilityMap {
  terminal: boolean
  virtualKeyboard: boolean
  settings: boolean
  extension: boolean
  connectionStats: boolean
}
export type KeyboardLayout = 'windows' | 'apple'
export interface UISlice {
  activeMain: 'terminal' | 'virtualKeyboard' | 'settings' | 'none'
  controlLayoutMode: 'vertical' | 'horizontal'

  visible: UIVisibilityMap

  keyboardHeight: number

  keyboardLayout: KeyboardLayout

  isPasteTextOpen: boolean
  closeMain: () => void
  toggleMain: (
    panel:
      | 'terminal'
      | 'virtualKeyboard'
      | 'settings'
      | 'extension'
      | 'connectionStats'
  ) => void

  showOverlay: (panel: 'extension' | 'connectionStats') => void
  hideOverlay: (panel: 'extension' | 'connectionStats') => void
  toggleOverlay: (panel: 'extension' | 'connectionStats') => void

  closeAllPanels: () => void

  setKeyboardLayout: (layout: KeyboardLayout) => void

  setKeyboardHeight: (height: number) => void

  setIsPasteTextOpen: (open: boolean) => void
  togglePasteText: () => void

  setControlLayoutMode: (mode: 'vertical' | 'horizontal') => void

  keyboardLedState?: {
    caps_lock?: boolean
    num_lock?: boolean
    scroll_lock?: boolean
    compose?: boolean
    kana?: boolean
  }
  setKeyboardLedState: (state: {
    caps_lock?: boolean
    num_lock?: boolean
    scroll_lock?: boolean
    compose?: boolean
    kana?: boolean
  }) => void
}

const asRecord = (arr: PanelId[], v: boolean) =>
  Object.fromEntries(arr.map(k => [k, v])) as Record<PanelId, boolean>

export const createUISlice: StateCreator<UISlice> = (set, get) => ({
  activeMain: 'none',
  keyboardHeight: 316,
  keyboardLayout: 'apple',
  isPasteTextOpen: false,
  controlLayoutMode: 'vertical',
  keyboardLedState: undefined,
  visible: {
    terminal: false,
    virtualKeyboard: false,
    settings: false,
    extension: false,
    connectionStats: false,
  },

  setKeyboardLedState: state => {
    set((prev: any) => ({
      ui: {
        ...prev.ui,
        keyboardLedState: {
          ...prev.ui.keyboardLedState,
          ...state,
        },
      },
    }))
  },

  closeMain: () => {
    set((state: any) => ({
      ui: {
        ...state.ui,
        activeMain: 'none',
        visible: {
          ...state.ui.visible,
          ...asRecord(EXCLUSIVE_MAIN as PanelId[], false),
        },
      },
    }))
  },

  toggleMain: panel => {
    if (!panel) {
      return
    }
    set((state: any) => {
      const isSame = !state.ui.visible?.[panel] || false
      return {
        ui: {
          ...state.ui,
          activeMain: isSame ? 'none' : panel,
          visible: {
            ...state.ui.visible,
            ...asRecord(EXCLUSIVE_MAIN as PanelId[], false),
            [panel]: isSame,
          },
        },
      }
    })
  },

  closeAllPanels: () => {
    set((state: any) => ({
      ui: {
        ...state.ui,
        activeMain: 'none',
        visible: {
          terminal: false,
          virtualKeyboard: false,
          settings: false,
          extension: false,
          connectionStats: false,
        },
      },
    }))
  },
  setKeyboardLayout: (layout: KeyboardLayout) => {
    set((state: any) => ({ ui: { ...state.ui, keyboardLayout: layout } }))
  },
  setKeyboardHeight: (height: number) => {
    set((state: any) => ({ ui: { ...state.ui, keyboardHeight: height } }))
  },

  setIsPasteTextOpen: (open: boolean) => {
    set((state: any) => ({ ui: { ...state.ui, isPasteTextOpen: open } }))
  },

  togglePasteText: () => {
    set((state: any) => ({
      ui: { ...state.ui, isPasteTextOpen: !state.ui.isPasteTextOpen },
    }))
  },

  setControlLayoutMode: (mode: 'vertical' | 'horizontal') => {
    set((state: any) => ({ ui: { ...state.ui, controlLayoutMode: mode } }))
  },
})
