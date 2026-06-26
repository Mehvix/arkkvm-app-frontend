/**
 * Base keyboard key definitions.
 * Defines all standard keyboard keys with their legends and metadata.
 */
import { ModChord } from './keyboard-types';

export type BaseKeyTemplate = {
  [keyCode: string]: Partial<Record<ModChord, string>>
}

export type KeyLegends = Partial<Record<ModChord, string>>

/**
 * Complete base key definition (includes legends and metadata).
 */
export interface BaseKeyDefinition {
  legends: KeyLegends
  width?: number
  isModifier?: boolean
  showDualState?: boolean
  ignoreAltGr?: boolean
}
export const LETTER_BASE_KEYS: BaseKeyTemplate = {
  KeyQ: { base: 'q', shift: 'Q' },
  KeyW: { base: 'w', shift: 'W' },
  KeyE: { base: 'e', shift: 'E' },
  KeyR: { base: 'r', shift: 'R' },
  KeyT: { base: 't', shift: 'T' },
  KeyY: { base: 'y', shift: 'Y' },
  KeyU: { base: 'u', shift: 'U' },
  KeyI: { base: 'i', shift: 'I' },
  KeyO: { base: 'o', shift: 'O' },
  KeyP: { base: 'p', shift: 'P' },

  KeyA: { base: 'a', shift: 'A' },
  KeyS: { base: 's', shift: 'S' },
  KeyD: { base: 'd', shift: 'D' },
  KeyF: { base: 'f', shift: 'F' },
  KeyG: { base: 'g', shift: 'G' },
  KeyH: { base: 'h', shift: 'H' },
  KeyJ: { base: 'j', shift: 'J' },
  KeyK: { base: 'k', shift: 'K' },
  KeyL: { base: 'l', shift: 'L' },

  KeyZ: { base: 'z', shift: 'Z' },
  KeyX: { base: 'x', shift: 'X' },
  KeyC: { base: 'c', shift: 'C' },
  KeyV: { base: 'v', shift: 'V' },
  KeyB: { base: 'b', shift: 'B' },
  KeyN: { base: 'n', shift: 'N' },
  KeyM: { base: 'm', shift: 'M' },
};

export const COMMON_KEYS: Record<string, BaseKeyDefinition> = {
  Escape: { legends: { base: 'Esc' }, ignoreAltGr: true },
  Tab: { legends: { base: 'Tab' }, ignoreAltGr: true },
  Enter: { legends: { base: 'Enter' }, ignoreAltGr: true },
  Backspace: { legends: { base: '⌫' }, ignoreAltGr: true },
  Space: { legends: { base: ' ' }, ignoreAltGr: true },

  ArrowLeft: { legends: { base: '←' }, ignoreAltGr: true },
  ArrowRight: { legends: { base: '→' }, ignoreAltGr: true },
  ArrowUp: { legends: { base: '↑' }, ignoreAltGr: true },
  ArrowDown: { legends: { base: '↓' }, ignoreAltGr: true },

  Delete: { legends: { base: 'Del' }, ignoreAltGr: true },
  Insert: { legends: { base: 'Ins' }, ignoreAltGr: true },
  Home: { legends: { base: 'Home' }, ignoreAltGr: true },
  End: { legends: { base: 'End' }, ignoreAltGr: true },
  PageUp: { legends: { base: 'PgUp' }, ignoreAltGr: true },
  PageDown: { legends: { base: 'PgDn' }, ignoreAltGr: true },

  PrintScreen: { legends: { base: 'PrtSc' }, ignoreAltGr: true },
  ScrollLock: { legends: { base: 'ScrLk' }, ignoreAltGr: true },
  Pause: { legends: { base: 'Pause' }, ignoreAltGr: true },
};

export const MODIFIER_KEYS: Record<string, BaseKeyDefinition> = {
  ShiftLeft: { legends: { base: 'Shift' }, isModifier: true ,width:1.5},
  ShiftRight: { legends: { base: 'Shift' }, isModifier: true },

  ControlLeft: { legends: { base: 'Ctrl' }, isModifier: true },
  ControlRight: { legends: { base: 'Ctrl' }, isModifier: true },

  AltLeft: { legends: { base: 'Alt' }, isModifier: true },
  AltRight: { legends: { base: 'Alt' }, isModifier: true },
  AltGr: { legends: { base: 'AltGr' }, isModifier: true },

  MetaLeft: { legends: { base: '⊞' }, isModifier: true, ignoreAltGr: true },
  MetaRight: { legends: { base: '⊞' }, isModifier: true, ignoreAltGr: true },

  CapsLock: { legends: { base: 'Caps' }, ignoreAltGr: true },
};

/**
 * US keyboard symbol keys with dual-state display.
 * These keys show two lines: shift symbol on top, base character on bottom.
 */
export const US_SYMBOL_KEYS: Record<string, BaseKeyDefinition> = {
  Backquote: { legends: { base: '`', shift: '~' }, showDualState: true },
  Digit1: { legends: { base: '1', shift: '!' }, showDualState: true },
  Digit2: { legends: { base: '2', shift: '@' }, showDualState: true },
  Digit3: { legends: { base: '3', shift: '#' }, showDualState: true },
  Digit4: { legends: { base: '4', shift: '$' }, showDualState: true },
  Digit5: { legends: { base: '5', shift: '%' }, showDualState: true },
  Digit6: { legends: { base: '6', shift: '^' }, showDualState: true },
  Digit7: { legends: { base: '7', shift: '&' }, showDualState: true },
  Digit8: { legends: { base: '8', shift: '*' }, showDualState: true },
  Digit9: { legends: { base: '9', shift: '(' }, showDualState: true },
  Digit0: { legends: { base: '0', shift: ')' }, showDualState: true },
  Minus: { legends: { base: '-', shift: '_' }, showDualState: true },
  Equal: { legends: { base: '=', shift: '+' }, showDualState: true },

  BracketLeft: { legends: { base: '[', shift: '{' }, showDualState: true },
  BracketRight: { legends: { base: ']', shift: '}' }, showDualState: true },
  Backslash: { legends: { base: '\\', shift: '|' }, showDualState: true },

  Semicolon: { legends: { base: ';', shift: ':' }, showDualState: true },
  Quote: { legends: { base: '\'', shift: '"' }, showDualState: true },

  Comma: { legends: { base: ',', shift: '<' }, showDualState: true },
  Period: { legends: { base: '.', shift: '>' }, showDualState: true },
  Slash: { legends: { base: '/', shift: '?' }, showDualState: true },

  IntlBackslash: { legends: { base: '\\', shift: '|' }, showDualState: true },
  HashTilde: { legends: { base: '#', shift: '~' }, showDualState: true },
};

export const FUNCTION_KEYS: Record<string, BaseKeyDefinition> = {
  F1: { legends: { base: 'F1' } },
  F2: { legends: { base: 'F2' } },
  F3: { legends: { base: 'F3' } },
  F4: { legends: { base: 'F4' } },
  F5: { legends: { base: 'F5' } },
  F6: { legends: { base: 'F6' } },
  F7: { legends: { base: 'F7' } },
  F8: { legends: { base: 'F8' } },
  F9: { legends: { base: 'F9' } },
  F10: { legends: { base: 'F10' } },
  F11: { legends: { base: 'F11' } },
  F12: { legends: { base: 'F12' } },
  F13: { legends: { base: 'F13' } },
  F14: { legends: { base: 'F14' } },
  F15: { legends: { base: 'F15' } },
  F16: { legends: { base: 'F16' } },
  F17: { legends: { base: 'F17' } },
  F18: { legends: { base: 'F18' } },
  F19: { legends: { base: 'F19' } },
  F20: { legends: { base: 'F20' } },
  F21: { legends: { base: 'F21' } },
  F22: { legends: { base: 'F22' } },
  F23: { legends: { base: 'F23' } },
  F24: { legends: { base: 'F24' } },
};

export const NAVIGATION_KEYS: Record<string, BaseKeyDefinition> = {
  ArrowUp: { legends: { base: '↑' }, ignoreAltGr: true },
  ArrowDown: { legends: { base: '↓' }, ignoreAltGr: true },
  ArrowLeft: { legends: { base: '←' }, ignoreAltGr: true },
  ArrowRight: { legends: { base: '→' }, ignoreAltGr: true },

  Home: { legends: { base: 'Home' }, ignoreAltGr: true },
  End: { legends: { base: 'End' }, ignoreAltGr: true },
  PageUp: { legends: { base: 'PgUp' }, ignoreAltGr: true },
  PageDown: { legends: { base: 'PgDn' }, ignoreAltGr: true },
  Insert: { legends: { base: 'Ins' }, ignoreAltGr: true },
  Delete: { legends: { base: 'Del' }, ignoreAltGr: true },
};

export const SYSTEM_KEYS: Record<string, BaseKeyDefinition> = {
  Escape: { legends: { base: 'Esc' }, ignoreAltGr: true },
  PrintScreen: { legends: { base: 'PrtSc' }, ignoreAltGr: true },
  ScrollLock: { legends: { base: 'ScrLk' }, ignoreAltGr: true },
  Pause: { legends: { base: 'Pause' }, ignoreAltGr: true },
  NumLock: { legends: { base: 'NumLk' }, ignoreAltGr: true },

  ContextMenu: { legends: { base: '☰' }, ignoreAltGr: true },
  Application: { legends: { base: '☰' }, ignoreAltGr: true },
  Menu: { legends: { base: 'Menu' }, ignoreAltGr: true },

  Power: { legends: { base: '⏻' }, ignoreAltGr: true },
  Copy: { legends: { base: 'Copy' } },
  Cut: { legends: { base: 'Cut' } },
  Paste: { legends: { base: 'Paste' } },
  Undo: { legends: { base: 'Undo' } },
  Find: { legends: { base: 'Find' } },
  Select: { legends: { base: 'Select' } },
  Again: { legends: { base: 'Again' } },
  Stop: { legends: { base: 'Stop' } },
  Help: { legends: { base: 'Help' } },
  Execute: { legends: { base: 'Exec' } },
  Cancel: { legends: { base: 'Cancel' } },
  Clear: { legends: { base: 'Clear' } },
  Prior: { legends: { base: 'Prior' } },
  Return: { legends: { base: 'Return' } },
  Separator: { legends: { base: 'Sep' } },
  Out: { legends: { base: 'Out' } },
  Operation: { legends: { base: 'Oper' } },
  ClearAgain: { legends: { base: 'ClrAgn' } },
  CrSel: { legends: { base: 'CrSel' } },
  ExSel: { legends: { base: 'ExSel' } },
  AlternateErase: { legends: { base: 'AltErase' } },
  Attention: { legends: { base: 'Attn' } },
  SystemRequest: { legends: { base: 'SysRq' } },

  Mute: { legends: { base: '🔇' } },
  VolumeUp: { legends: { base: '🔊' } },
  VolumeDown: { legends: { base: '🔉' } },
};

export const NUMPAD_KEYS: Record<string, BaseKeyDefinition> = {
  Numpad0: { legends: { base: '0' } },
  Numpad1: { legends: { base: '1' } },
  Numpad2: { legends: { base: '2' } },
  Numpad3: { legends: { base: '3' } },
  Numpad4: { legends: { base: '4' } },
  Numpad5: { legends: { base: '5' } },
  Numpad6: { legends: { base: '6' } },
  Numpad7: { legends: { base: '7' } },
  Numpad8: { legends: { base: '8' } },
  Numpad9: { legends: { base: '9' } },
  Numpad00: { legends: { base: '00' } },
  Numpad000: { legends: { base: '000' } },

  NumpadAdd: { legends: { base: '+' } },
  NumpadSubtract: { legends: { base: '-' } },
  NumpadMultiply: { legends: { base: '*' } },
  NumpadDivide: { legends: { base: '/' } },
  NumpadDecimal: { legends: { base: '.' } },
  NumpadEnter: { legends: { base: '↵' } },
  NumpadEqual: { legends: { base: '=' } },
  NumpadComma: { legends: { base: ',' } },

  NumpadHome: { legends: { base: 'Home' }, ignoreAltGr: true },
  NumpadEnd: { legends: { base: 'End' }, ignoreAltGr: true },
  NumpadPageUp: { legends: { base: 'PgUp' }, ignoreAltGr: true },
  NumpadPageDown: { legends: { base: 'PgDn' }, ignoreAltGr: true },
  NumpadUpArrow: { legends: { base: '↑' }, ignoreAltGr: true },
  NumpadDownArrow: { legends: { base: '↓' }, ignoreAltGr: true },
  NumpadLeftArrow: { legends: { base: '←' }, ignoreAltGr: true },
  NumpadRightArrow: { legends: { base: '→' }, ignoreAltGr: true },
  NumpadDelete: { legends: { base: 'Del' }, ignoreAltGr: true },

  NumpadBackspace: { legends: { base: '⌫' }, ignoreAltGr: true },
  NumpadTab: { legends: { base: 'Tab' }, ignoreAltGr: true },
  NumpadSpace: { legends: { base: '␣' }, ignoreAltGr: true },
  NumpadClear: { legends: { base: 'Clr' }, ignoreAltGr: true },
  NumpadClearEntry: { legends: { base: 'CE' }, ignoreAltGr: true },
  NumpadPlusMinus: { legends: { base: '±' }, ignoreAltGr: true },
  NumpadPercent: { legends: { base: '%' }, ignoreAltGr: true },
  NumpadLeftParen: { legends: { base: '(' } },
  NumpadRightParen: { legends: { base: ')' } },
  NumpadLeftBrace: { legends: { base: '{' } },
  NumpadRightBrace: { legends: { base: '}' } },
  NumpadLessThan: { legends: { base: '<' } },
  NumpadGreaterThan: { legends: { base: '>' } },
  NumpadAnd: { legends: { base: '&' } },
  NumpadOr: { legends: { base: '|' } },
  NumpadXOR: { legends: { base: '^' } },
  NumpadLogicalAnd: { legends: { base: '&&' } },
  NumpadLogicalOr: { legends: { base: '||' } },
  NumpadAt: { legends: { base: '@' } },
  NumpadColon: { legends: { base: ':' } },
  NumpadOctathorpe: { legends: { base: '#' } },
  NumpadExclamation: { legends: { base: '!' } },
  NumpadCircumflex: { legends: { base: '^' } },

  NumpadMemoryStore: { legends: { base: 'MS' } },
  NumpadMemoryRecall: { legends: { base: 'MR' } },
  NumpadMemoryClear: { legends: { base: 'MC' } },
  NumpadMemoryAdd: { legends: { base: 'M+' } },
  NumpadMemorySubtract: { legends: { base: 'M-' } },
  NumpadMemoryMultiply: { legends: { base: 'M*' } },
  NumpadMemoryDivide: { legends: { base: 'M/' } },

  NumpadBinary: { legends: { base: 'Bin' } },
  NumpadOctal: { legends: { base: 'Oct' } },
  NumpadDecimalBase: { legends: { base: 'Dec' } },
  NumpadHexadecimal: { legends: { base: 'Hex' } },

  NumpadKeyA: { legends: { base: 'A' } },
  NumpadKeyB: { legends: { base: 'B' } },
  NumpadKeyC: { legends: { base: 'C' } },
  NumpadKeyD: { legends: { base: 'D' } },
  NumpadKeyE: { legends: { base: 'E' } },
  NumpadKeyF: { legends: { base: 'F' } },
};

export const INTERNATIONAL_KEYS: Record<string, BaseKeyDefinition> = {
  International1: { legends: { base: 'Int1' } },
  International2: { legends: { base: 'Int2' } },
  International3: { legends: { base: 'Int3' } },
  International4: { legends: { base: 'Int4' } },
  International5: { legends: { base: 'Int5' } },
  International6: { legends: { base: 'Int6' } },
  International7: { legends: { base: 'Int7' } },
  International8: { legends: { base: 'Int8' } },
  International9: { legends: { base: 'Int9' } },
  Lang1: { legends: { base: '한/영' } },
  Lang2: { legends: { base: '한자' } },
  Lang3: { legends: { base: 'カタカナ' } },
  Lang4: { legends: { base: 'ひらがな' } },
  Lang5: { legends: { base: 'Full/Half' } },
  Lang6: { legends: { base: 'Lang6' } },
  Lang7: { legends: { base: 'Lang7' } },
  Lang8: { legends: { base: 'Lang8' } },
  Lang9: { legends: { base: 'Lang9' } },
  LockingCapsLock: { legends: { base: 'Caps' }, isModifier: true },
  LockingNumLock: { legends: { base: 'NumLk' }, isModifier: true },
  LockingScrollLock: { legends: { base: 'ScrLk' }, isModifier: true },
  Compose: { legends: { base: 'Compose' }, isModifier: true },
};
export const CURRENCY_KEYS: Record<string, BaseKeyDefinition> = {
  CurrencyUnit: { legends: { base: '¤' } },
  CurrencySubunit: { legends: { base: '¢' } },
  ThousandsSeparator: { legends: { base: ',' } },
  DecimalSeparator: { legends: { base: '.' } },
};
