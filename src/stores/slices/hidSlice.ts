import type { StateCreator } from 'zustand';
import type { RootState } from '../types';

// HID-related state: active keys, modifiers, AltGr handling, LED sync,
// virtual keyboard/paste mode, and USB connection state.
export interface HidStateData {
  /** Currently pressed non-modifier HID usages (for reporting and UI highlight). */
  hidActiveKeys: number[]
  /** @deprecated Use hidActiveKeys instead. */
  activeKeys: number[]
  /** Snapshot: modifier bitmask + non-modifier key usages. */
  hidKeysDownState: { modifier: number; keys: number[] }
  /** @deprecated Use hidKeysDownState instead. */
  keysDownState: { modifier: number; keys: number[] }
  /** Currently pressed modifier key usages (Ctrl/Shift/Alt/Meta, etc.). */
  hidModifierKeys: number[]
  /** @deprecated Use hidModifierKeys instead. */
  modifierKeys: number[]
  /** Whether AltGr has been processed to avoid Ctrl+Alt ambiguity. */
  hidAltGrProcessed: boolean
  /** @deprecated Use hidAltGrProcessed instead. */
  altGrProcessed: boolean
  /** Whether remote keyboard LEDs (Num/Caps/Scroll) are synced locally. */
  hidLedSynced: boolean
  /** @deprecated Use hidLedSynced instead. */
  ledSynced: boolean
  /** Keyboard LED states: NumLock / CapsLock / ScrollLock. */
  hidKeyboardLeds?: {
    numLock: boolean
    capsLock: boolean
    scrollLock: boolean
  }
  /** @deprecated Use hidKeyboardLeds instead. */
  keyboardLeds?: {
    numLock: boolean
    capsLock: boolean
    scrollLock: boolean
  }
  /** Whether the on-screen virtual keyboard is enabled. */
  hidVirtualKeyboard: boolean
  /** @deprecated Use hidVirtualKeyboard instead. */
  virtualKeyboard: boolean
  /** Paste mode: converts text to key-sequence reports. */
  hidPasteMode: boolean
  /** @deprecated Use hidPasteMode instead. */
  pasteMode: boolean
  /** USB connection state (for UI display and runtime logic). */
  hidUsbState:
    | 'configured'
    | 'attached'
    | 'not attached'
    | 'suspended'
    | 'addressed'
    | 'disconnected'
  /** @deprecated Use hidUsbState instead. */
  usbState:
    | 'configured'
    | 'attached'
    | 'not attached'
    | 'suspended'
    | 'addressed'
    | 'disconnected'
}
export interface HidStateActions {
  /** Set currently pressed non-modifier key usages. */
  setHidActiveKeys: (keys: number[]) => void
  /** @deprecated Use setHidActiveKeys instead. */
  setActiveKeys: (keys: number[]) => void
  /** Set key snapshot (modifier bitmask + non-modifier key usages). */
  setHidKeysDownState: (state: { modifier: number; keys: number[] }) => void
  /** @deprecated Use setHidKeysDownState instead. */
  setKeysDownState: (state: { modifier: number; keys: number[] }) => void
  /** Set currently pressed modifier key usages. */
  setHidModifierKeys: (keys: number[]) => void
  /** @deprecated Use setHidModifierKeys instead. */
  setModifierKeys: (keys: number[]) => void
  /** Mark whether AltGr has been processed by internal logic. */
  setHidAltGrProcessed: (processed: boolean) => void
  /** @deprecated Use setHidAltGrProcessed instead. */
  setAltGrProcessed: (processed: boolean) => void
  /** Set LED sync state. */
  setHidLedSynced: (synced: boolean) => void
  /** @deprecated Use setHidLedSynced instead. */
  setLedSynced: (synced: boolean) => void
  /** Update keyboard LED states (Num/Caps/Scroll). */
  setHidKeyboardLeds: (leds: {
    numLock: boolean
    capsLock: boolean
    scrollLock: boolean
  }) => void
  /** @deprecated Use setHidKeyboardLeds instead. */
  setKeyboardLeds: (leds: {
    numLock: boolean
    capsLock: boolean
    scrollLock: boolean
  }) => void
  /** Toggle virtual keyboard. */
  setHidVirtualKeyboard: (enabled: boolean) => void
  /** @deprecated Use setHidVirtualKeyboard instead. */
  setVirtualKeyboard: (enabled: boolean) => void
  /** Toggle paste mode (text to key events). */
  setHidPasteMode: (enabled: boolean) => void
  /** @deprecated Use setHidPasteMode instead. */
  setPasteMode: (enabled: boolean) => void
  /** Update USB connection state. */
  setHidUsbState: (state: HidStateData['hidUsbState']) => void
  /** @deprecated Use setHidUsbState instead. */
  setUsbState: (state: HidStateData['usbState']) => void
  /** Reset HID/USB state to initial defaults. */
  resetHID: () => void
}
export type HidSlice = HidStateData & HidStateActions
export const createHidSlice: StateCreator<RootState, [], [], HidSlice> = (set, _get) => ({
  hidActiveKeys: [],
  activeKeys: [],
  hidKeysDownState: { modifier: 0, keys: [] },
  keysDownState: { modifier: 0, keys: [] },
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
  setHidKeysDownState: (stateVal: { modifier: number; keys: number[] }): void =>
    set(() => ({ hidKeysDownState: stateVal, keysDownState: stateVal })),
  setKeysDownState: (stateVal: { modifier: number; keys: number[] }): void =>
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
});
