import type { StateCreator } from 'zustand'

export interface HidStateData {
  hidActiveKeys: number[]

  activeKeys: number[]

  hidKeysDownState: { modifier: number; keys: number[] }

  keysDownState: { modifier: number; keys: number[] }

  hidModifierKeys: number[]

  modifierKeys: number[]

  hidAltGrProcessed: boolean

  altGrProcessed: boolean

  hidLedSynced: boolean

  ledSynced: boolean

  hidKeyboardLeds?: {
    numLock: boolean
    capsLock: boolean
    scrollLock: boolean
  }

  keyboardLeds?: {
    numLock: boolean
    capsLock: boolean
    scrollLock: boolean
  }

  hidVirtualKeyboard: boolean

  virtualKeyboard: boolean

  hidPasteMode: boolean

  pasteMode: boolean

  hidUsbState:
    | 'configured'
    | 'attached'
    | 'not attached'
    | 'suspended'
    | 'addressed'
    | 'disconnected'

  usbState:
    | 'configured'
    | 'attached'
    | 'not attached'
    | 'suspended'
    | 'addressed'
    | 'disconnected'
}
export interface HidStateActions {
  setHidActiveKeys: (keys: number[]) => void

  setActiveKeys: (keys: number[]) => void

  setHidKeysDownState: (state: { modifier: number; keys: number[] }) => void

  setKeysDownState: (state: { modifier: number; keys: number[] }) => void

  setHidModifierKeys: (keys: number[]) => void

  setModifierKeys: (keys: number[]) => void

  setHidAltGrProcessed: (processed: boolean) => void

  setAltGrProcessed: (processed: boolean) => void

  setHidLedSynced: (synced: boolean) => void

  setLedSynced: (synced: boolean) => void

  setHidKeyboardLeds: (leds: {
    numLock: boolean
    capsLock: boolean
    scrollLock: boolean
  }) => void

  setKeyboardLeds: (leds: {
    numLock: boolean
    capsLock: boolean
    scrollLock: boolean
  }) => void

  setHidVirtualKeyboard: (enabled: boolean) => void

  setVirtualKeyboard: (enabled: boolean) => void

  setHidPasteMode: (enabled: boolean) => void

  setPasteMode: (enabled: boolean) => void

  setHidUsbState: (state: HidStateData['hidUsbState']) => void

  setUsbState: (state: HidStateData['usbState']) => void

  resetHID: () => void
}
export type HidSlice = HidStateData & HidStateActions
export const createHidSlice: StateCreator<HidSlice> = (set, get) => ({
  hidActiveKeys: [],
  activeKeys: [],
  hidModifierKeys: [],
  modifierKeys: [],
  hidAltGrProcessed: false,
  altGrProcessed: false,
  hidLedSynced: false,
  ledSynced: false,
  hidKeyboardLeds: { numLock: false, capsLock: false, scrollLock: false },
  keyboardLeds: { numLock: false, capsLock: false, scrollLock: false },
  hidVirtualKeyboard: false,
  virtualKeyboard: false,
  hidPasteMode: false,
  pasteMode: false,
  hidUsbState: 'disconnected',
  usbState: 'disconnected',
  setHidActiveKeys: keys =>
    set(() => ({ hidActiveKeys: keys, activeKeys: keys })),
  setActiveKeys: keys => set(() => ({ hidActiveKeys: keys, activeKeys: keys })),
  setHidKeysDownState: (stateVal: KeysDownState): void =>
    set(() => ({ hidKeysDownState: stateVal, keysDownState: stateVal })),
  setKeysDownState: (stateVal: KeysDownState): void =>
    set(() => ({ hidKeysDownState: stateVal, keysDownState: stateVal })),
  setHidModifierKeys: keys =>
    set(() => ({ hidModifierKeys: keys, modifierKeys: keys })),
  setModifierKeys: keys =>
    set(() => ({ hidModifierKeys: keys, modifierKeys: keys })),
  setHidAltGrProcessed: processed =>
    set(() => ({ hidAltGrProcessed: processed, altGrProcessed: processed })),
  setAltGrProcessed: processed =>
    set(() => ({ hidAltGrProcessed: processed, altGrProcessed: processed })),
  setHidLedSynced: synced =>
    set(() => ({ hidLedSynced: synced, ledSynced: synced })),
  setLedSynced: synced =>
    set(() => ({ hidLedSynced: synced, ledSynced: synced })),
  setHidKeyboardLeds: leds =>
    set(() => ({ hidKeyboardLeds: leds, keyboardLeds: leds })),
  setKeyboardLeds: leds =>
    set(() => ({ hidKeyboardLeds: leds, keyboardLeds: leds })),
  setHidVirtualKeyboard: enabled =>
    set(() => ({ hidVirtualKeyboard: enabled, virtualKeyboard: enabled })),
  setVirtualKeyboard: enabled =>
    set(() => ({ hidVirtualKeyboard: enabled, virtualKeyboard: enabled })),
  setHidPasteMode: enabled =>
    set(() => ({ hidPasteMode: enabled, pasteMode: enabled })),
  setPasteMode: enabled =>
    set(() => ({ hidPasteMode: enabled, pasteMode: enabled })),
  setHidUsbState: stateVal =>
    set(() => ({ hidUsbState: stateVal, usbState: stateVal })),
  setUsbState: stateVal =>
    set(() => ({ hidUsbState: stateVal, usbState: stateVal })),
  resetHID: () =>
    set(() => ({
      hidActiveKeys: [],
      activeKeys: [],
      hidModifierKeys: [],
      modifierKeys: [],
      hidAltGrProcessed: false,
      altGrProcessed: false,
      hidLedSynced: false,
      ledSynced: false,
      hidKeyboardLeds: { numLock: false, capsLock: false, scrollLock: false },
      keyboardLeds: { numLock: false, capsLock: false, scrollLock: false },
      hidVirtualKeyboard: false,
      virtualKeyboard: false,
      hidPasteMode: false,
      pasteMode: false,
      hidUsbState: 'disconnected',
      usbState: 'disconnected',
    })),
})
