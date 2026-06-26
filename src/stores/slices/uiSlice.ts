import type { StateCreator } from 'zustand';
import type { RootState } from '../types';

/** 1) Panel Identifier Enum */
export type PanelId =
  | 'terminal' // Main panel (Mutually exclusive)
  | 'virtualKeyboard' // Main panel (Mutually exclusive)
  | 'settings' // Main panel (Mutually exclusive)
  | 'extension' // Overlay panel (Independent toggle: Extensions/Plugins area)
  | 'connectionStats' // Overlay panel (Independent toggle: Connection stats floating window)
  /**
 * List of mutually exclusive panels.
 * Only one panel from this list can be active at any given time.
 */
const EXCLUSIVE_MAIN: PanelId[] = [
  'terminal',
  'virtualKeyboard',
  'settings',
  'extension',
  'connectionStats',
];
export interface UIVisibilityMap {
  terminal: boolean
  virtualKeyboard: boolean
  settings: boolean
  extension: boolean
  connectionStats: boolean
}
export type KeyboardLayout = 'windows' | 'apple'
export interface UISlice {
  /** The Single Source of Truth for the currently active main panel ('none' indicates no panel is open). */
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
  Object.fromEntries(arr.map(k => [k, v])) as Record<PanelId, boolean>;

export const createUISlice: StateCreator<RootState, [], [], UISlice> = (set) => ({
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

  showOverlay: panel => {
    set((state: RootState) => ({
      ui: { ...state.ui, visible: { ...state.ui.visible, [panel]: true } },
    }));
  },
  hideOverlay: panel => {
    set((state: RootState) => ({
      ui: { ...state.ui, visible: { ...state.ui.visible, [panel]: false } },
    }));
  },
  toggleOverlay: panel => {
    set((state: RootState) => ({
      ui: { ...state.ui, visible: { ...state.ui.visible, [panel]: !state.ui.visible[panel] } },
    }));
  },
  setKeyboardLedState: state => {
    set((prev: RootState) => ({
      ui: {
        ...prev.ui,
        keyboardLedState: {
          ...prev.ui.keyboardLedState,
          ...state,
        },
      },
    }));
  },
  closeMain: () => {
    set((state: RootState) => ({
      ui: {
        ...state.ui,
        activeMain: 'none',
        visible: {
          ...state.ui.visible,
          ...asRecord(EXCLUSIVE_MAIN as PanelId[], false),
        },
      },
    }));
  },
  toggleMain: panel => {
    if (!panel) {
      return;
    }
    set((state: RootState) => {
      const isSame = !state.ui?.visible?.[panel as keyof UIVisibilityMap] || false;
      const nextMain = EXCLUSIVE_MAIN.includes(panel as (typeof EXCLUSIVE_MAIN)[number])
        ? (isSame ? 'none' : panel) as UISlice['activeMain']
        : state.ui.activeMain;
      return {
        ui: {
          ...state.ui,
          activeMain: nextMain,
          visible: {
            ...state.ui.visible,
            ...asRecord(EXCLUSIVE_MAIN as PanelId[], false),
            [panel]: isSame,
          },
        },
      };
    });
  },
  closeAllPanels: () => {
    set((state: RootState) => ({
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
    }));
  },
  setKeyboardLayout: (layout: KeyboardLayout) => {
    set((state: RootState) => ({ ui: { ...state.ui, keyboardLayout: layout } }));
  },
  setKeyboardHeight: (height: number) => {
    set((state: RootState) => ({ ui: { ...state.ui, keyboardHeight: height } }));
  },
  setIsPasteTextOpen: (open: boolean) => {
    set((state: RootState) => ({ ui: { ...state.ui, isPasteTextOpen: open } }));
  },
  togglePasteText: () => {
    set((state: RootState) => ({
      ui: { ...state.ui, isPasteTextOpen: !state.ui?.isPasteTextOpen },
    }));
  },

  setControlLayoutMode: (mode: 'vertical' | 'horizontal') => {
    set((state: RootState) => ({ ui: { ...state.ui, controlLayoutMode: mode } }));
  },
});
