import type { KeyboardLayout, KeyLegends } from '../../keyboard-types';
import { createKeyDef } from '../../merge';
import { FUNCTION_KEYS_ROW, RIGHT_PANEL_ROWS } from '../../rows';

/**
 * German dead key definitions (for diacritic composition)
 * Dead keys: do not emit characters immediately, and wait for the next key to compose accented characters
 */
const DEAD_KEY_ACUTE = { code: 'Equal' }; // ´ acute accent
const DEAD_KEY_GRAVE = { code: 'Equal', mod: ['ShiftLeft'] }; // ` grave accent
const DEAD_KEY_CIRCUMFLEX = { code: 'Backquote' }; // ^ circumflex accent

/**
 * German AltGr character mapping
 * Refer to the AltGr mapping in keyboardLayouts/de_DE.ts
 */
const DE_DE_ALTGR: Record<string, { altGr?: string; 'shift+altGr'?: string }> = {
  // Top number row
  KeyQ: { altGr: '@' },
  Digit2: { altGr: '²' },
  Digit3: { altGr: '³' },
  Digit7: { altGr: '{' },
  Digit8: { altGr: '[' },
  Digit9: { altGr: ']' },
  Digit0: { altGr: '}' },
  Minus: { altGr: '\\' }, // AltGr+ß -> \
  BracketRight: { altGr: '~' },
  // Letter section
  KeyE: { altGr: '€' },
  KeyM: { altGr: 'µ' },
  // Extra ISO key
  IntlBackslash: { altGr: '|' },
};

// DE German (Windows) — Standard German QWERTZ keyboard layout
const KEY_LEGENDS: Record<string, KeyLegends> = {
  Backquote: {
    base: '^',
    shift: '°',
  },
  Digit1: {
    base: '1',
    shift: '!',
  },
  Digit2: {
    base: '2',
    shift: '"',
    ...DE_DE_ALTGR.Digit2,
  },
  Digit3: {
    base: '3',
    shift: '§',
    ...DE_DE_ALTGR.Digit3,
  },
  Digit4: {
    base: '4',
    shift: '$',
  },
  Digit5: { base: '5', shift: '%' },
  Digit6: { base: '6', shift: '&' },
  Digit7: {
    base: '7',
    shift: '/',
    ...DE_DE_ALTGR.Digit7,
  },
  Digit8: {
    base: '8',
    shift: '(',
    ...DE_DE_ALTGR.Digit8,
  },
  Digit9: {
    base: '9',
    shift: ')',
    ...DE_DE_ALTGR.Digit9,
  },
  Digit0: {
    base: '0',
    shift: '=',
    ...DE_DE_ALTGR.Digit0,
  },
  Minus: {
    base: 'ß',
    shift: '?',
    ...DE_DE_ALTGR.Minus,
  },
  Equal: { base: '´', shift: '`' },
  KeyZ: { base: 'y', shift: 'Y' },
  BracketLeft: { base: 'ü', shift: 'Ü' },
  BracketRight: {
    base: '+',
    shift: '*',
    ...DE_DE_ALTGR.BracketRight,
  },
  CapsLock: { base: 'Fest' },
  Semicolon: { base: 'ö', shift: 'Ö' },
  Quote: { base: 'ä', shift: 'Ä' },
  Backslash: {
    base: '#',
    shift: '\'',
  },
  ShiftLeft: { base: 'Umsch' },
  IntlBackslash: {
    base: '<',
    shift: '>',
    ...DE_DE_ALTGR.IntlBackslash,
  },
  KeyY: { base: 'z', shift: 'Z' },
  Comma: { base: ',', shift: ';' },
  Period: { base: '.', shift: ':' },
  Slash: { base: '–', shift: '_' },
  ShiftRight: { base: 'Umsch' },
  Delete: { base: 'Entf' },
  ControlLeft: { base: 'Strg' },
  AltGr: { base: ' AltGr' },
  ControlRight: { base: 'Strg' },
};
export const DE_WIN_LAYOUT: KeyboardLayout = {
  id: 'de-win',
  name: 'Deutsch (Deutschland)',
  rows: [
    FUNCTION_KEYS_ROW,
    [
      createKeyDef('Backquote', KEY_LEGENDS.Backquote),
      createKeyDef('Digit1', KEY_LEGENDS.Digit1),
      createKeyDef('Digit2', KEY_LEGENDS.Digit2),
      createKeyDef('Digit3', KEY_LEGENDS.Digit3),
      createKeyDef('Digit4', KEY_LEGENDS.Digit4),
      createKeyDef('Digit5', KEY_LEGENDS.Digit5),
      createKeyDef('Digit6', KEY_LEGENDS.Digit6),
      createKeyDef('Digit7', KEY_LEGENDS.Digit7),
      createKeyDef('Digit8', KEY_LEGENDS.Digit8),
      createKeyDef('Digit9', KEY_LEGENDS.Digit9),
      createKeyDef('Digit0', KEY_LEGENDS.Digit0),
      createKeyDef('Minus', KEY_LEGENDS.Minus),
      createKeyDef('Equal', KEY_LEGENDS.Equal),
      createKeyDef('Backspace', undefined, { width: 1.5 }),
    ],
    [
      createKeyDef('Tab', undefined, { width: 1.5 }),
      createKeyDef('KeyQ', DE_DE_ALTGR.KeyQ),
      createKeyDef('KeyW'),
      createKeyDef('KeyE', DE_DE_ALTGR.KeyE),
      createKeyDef('KeyR'),
      createKeyDef('KeyT'),
      createKeyDef('KeyZ', KEY_LEGENDS.KeyZ),
      createKeyDef('KeyU'),
      createKeyDef('KeyI'),
      createKeyDef('KeyO'),
      createKeyDef('KeyP'),
      createKeyDef('BracketLeft', KEY_LEGENDS.BracketLeft, { showDualState: false }),
      createKeyDef('BracketRight', KEY_LEGENDS.BracketRight),
    ],
    [
      createKeyDef('CapsLock', KEY_LEGENDS.CapsLock, { width: 1.8 }),
      createKeyDef('KeyA'),
      createKeyDef('KeyS'),
      createKeyDef('KeyD'),
      createKeyDef('KeyF'),
      createKeyDef('KeyG'),
      createKeyDef('KeyH'),
      createKeyDef('KeyJ'),
      createKeyDef('KeyK'),
      createKeyDef('KeyL'),
      createKeyDef('Semicolon', KEY_LEGENDS.Semicolon, { showDualState: false }),
      createKeyDef('Quote', KEY_LEGENDS.Quote, { showDualState: false }),
      createKeyDef('Backslash', KEY_LEGENDS.Backslash, { showDualState: false }),
      createKeyDef('Enter', undefined, { width: 2.7 }),
    ],
    // Row 4: Shift, <YXCVBNM,.-, Shift
    [
      createKeyDef('ShiftLeft', KEY_LEGENDS.ShiftLeft, { width: 1.8 }),
      createKeyDef('IntlBackslash', KEY_LEGENDS.IntlBackslash),
      // QWERTZ: this position is Y
      createKeyDef('KeyY', KEY_LEGENDS.KeyY),
      createKeyDef('KeyX'),
      createKeyDef('KeyC'),
      createKeyDef('KeyV'),
      createKeyDef('KeyB'),
      createKeyDef('KeyN'),
      createKeyDef('KeyM', DE_DE_ALTGR.KeyM),
      createKeyDef('Comma', KEY_LEGENDS.Comma),
      createKeyDef('Period', KEY_LEGENDS.Period),
      createKeyDef('Slash', KEY_LEGENDS.Slash),
      createKeyDef('ShiftRight', KEY_LEGENDS.ShiftRight, { width: 2 }),
      createKeyDef('Delete', KEY_LEGENDS.Delete),
    ],
    // Row 5: Ctrl, Fn, Win, Alt, Space, AltGr, Ctrl, ←↓→, Menu
    [
      createKeyDef('ControlLeft', KEY_LEGENDS.ControlLeft, { width: 1.2 }),
      createKeyDef('MetaLeft'),
      createKeyDef('AltLeft'),
      createKeyDef('Space', undefined, { width: 6 }),
      createKeyDef('AltGr', KEY_LEGENDS.AltGr),
      createKeyDef('ControlRight', KEY_LEGENDS.ControlRight),

      createKeyDef('ContextMenu'),
    ],
  ],
  rightPanel: RIGHT_PANEL_ROWS,
  // Extra character mapping: accented characters, etc. (not shown on keyboard UI, but needed for paste input)
  extraChars: {
    // Vowels with acute accent - use dead key ´
    á: { code: 'KeyA', deadKey: DEAD_KEY_ACUTE },
    Á: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    é: { code: 'KeyE', deadKey: DEAD_KEY_ACUTE },
    É: { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    í: { code: 'KeyI', deadKey: DEAD_KEY_ACUTE },
    Í: { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    ó: { code: 'KeyO', deadKey: DEAD_KEY_ACUTE },
    Ó: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    ú: { code: 'KeyU', deadKey: DEAD_KEY_ACUTE },
    Ú: { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },

    // Vowels with grave accent - use dead key `
    à: { code: 'KeyA', deadKey: DEAD_KEY_GRAVE },
    À: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },
    è: { code: 'KeyE', deadKey: DEAD_KEY_GRAVE },
    È: { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },
    ì: { code: 'KeyI', deadKey: DEAD_KEY_GRAVE },
    Ì: { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },
    ò: { code: 'KeyO', deadKey: DEAD_KEY_GRAVE },
    Ò: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },
    ù: { code: 'KeyU', deadKey: DEAD_KEY_GRAVE },
    Ù: { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },

    // Vowels with circumflex accent - use dead key ^
    â: { code: 'KeyA', deadKey: DEAD_KEY_CIRCUMFLEX },
    Â: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEY_CIRCUMFLEX },
    ê: { code: 'KeyE', deadKey: DEAD_KEY_CIRCUMFLEX },
    Ê: { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEY_CIRCUMFLEX },
    î: { code: 'KeyI', deadKey: DEAD_KEY_CIRCUMFLEX },
    Î: { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEY_CIRCUMFLEX },
    ô: { code: 'KeyO', deadKey: DEAD_KEY_CIRCUMFLEX },
    Ô: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_CIRCUMFLEX },
    û: { code: 'KeyU', deadKey: DEAD_KEY_CIRCUMFLEX },
    Û: { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEY_CIRCUMFLEX },
  },
};
