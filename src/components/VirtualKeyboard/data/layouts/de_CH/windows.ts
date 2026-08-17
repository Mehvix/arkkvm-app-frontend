import type { KeyboardLayout, KeyLegends } from '../../keyboard-types';
import { createKeyDef } from '../../merge';
import { FUNCTION_KEYS_ROW } from '../../rows';
import { deCHMeta as LAYOUT_META } from '../meta';

/**
 * Swiss German dead key definitions (for diacritic character combinations)
 * Dead Keys: When pressed, do not immediately output a character, wait for next character input to combine into a diacritic character
 */
const DEAD_KEY_CIRCUMFLEX = { code: 'BracketLeft' }; // ^ circumflex
const DEAD_KEY_GRAVE = { code: 'BracketLeft', mod: ['ShiftLeft'] }; // ` grave accent
const DEAD_KEY_TILDE = { code: 'BracketRight', mod: ['AltRight'] }; // ~ tilde
const DEAD_KEY_ACUTE = { code: 'Quote' }; // ´ acute accent

/**
 * Swiss German AltGr character mapping
 * Swiss keyboard emphasizes multilingual support (German, French, Italian)
 */
const DE_CH_ALTGR: Record<string, { altGr?: string; 'shift+altGr'?: string }> = {
  // Top row number keys
  Digit1: { altGr: '¦' }, // AltGr+1 -> ¦ (broken bar)
  Digit2: { altGr: '@' }, // AltGr+2 -> @
  Digit3: { altGr: '#' }, // AltGr+3 -> #
  Digit4: { altGr: '°' }, // AltGr+4 -> °
  Digit5: { altGr: '§' }, // AltGr+5 -> §
  Digit6: { altGr: '¬' }, // AltGr+6 -> ¬
  Digit7: { altGr: '|' }, // AltGr+7 -> |
  Digit8: { altGr: '¢' }, // AltGr+8 -> ¢
  Digit9: { altGr: '\'' }, // AltGr+9 -> '
  Digit0: { altGr: '\'' }, // AltGr+0 -> '
  Equal: { altGr: '{' }, // AltGr+^ -> {
  Backquote: { altGr: '}' }, // AltGr+§ -> }
  Minus: { altGr: '´' },
  // Letter area
  KeyE: { altGr: '€' }, // AltGr+E -> €
  BracketLeft: { altGr: '[' }, // AltGr+ü -> [
  BracketRight: { altGr: ']' }, // AltGr+¨ -> ]

  Quote: { altGr: '{' }, //
  Backslash: { altGr: '}' },
  // ISO extra key
  IntlBackslash: { altGr: '\\' }, // AltGr+< -> \
};

// ✅ Swiss German (Windows) — Swiss German QWERTZ keyboard layout
const KEY_LEGENDS: Record<string, KeyLegends> = {
  Tab: { base: 'TAB' },
  Backquote: {
    base: '§',
    shift: '°',
  },
  Digit1: {
    base: '1',
    shift: '+',
    ...DE_CH_ALTGR.Digit1,
  },
  Digit2: {
    base: '2',
    shift: '"',
    ...DE_CH_ALTGR.Digit2,
  },
  Digit3: {
    base: '3',
    shift: '*',
    ...DE_CH_ALTGR.Digit3,
  },
  Digit4: {
    base: '4',
    shift: 'ç',
    ...DE_CH_ALTGR.Digit4,
  },
  Digit5: {
    base: '5',
    shift: '%',
    ...DE_CH_ALTGR.Digit5,
  },
  Digit6: {
    base: '6',
    shift: '&',
    ...DE_CH_ALTGR.Digit6,
  },
  Digit7: {
    base: '7',
    shift: '/',
    ...DE_CH_ALTGR.Digit7,
  },
  Digit8: {
    base: '8',
    shift: '(',
    ...DE_CH_ALTGR.Digit8,
  },
  Digit9: {
    base: '9',
    shift: ')',
  },
  Digit0: {
    base: '0',
    shift: '=',
  },
  Minus: { base: '\'', shift: '?', ...DE_CH_ALTGR.Minus },
  Equal: { base: '^', shift: '`', ...DE_CH_ALTGR.Equal },
  KeyY: { base: 'z', shift: 'Z' },
  BracketLeft: {
    base: 'ü',
    shift: 'è',
    ...DE_CH_ALTGR.BracketLeft,
  },
  BracketRight: {
    base: '¨',
    shift: '!',
    ...DE_CH_ALTGR.BracketRight,
  },
  Semicolon: {
    base: 'ö',
    shift: 'é',
  },
  Quote: {
    base: 'ä',
    shift: 'à',
    ...DE_CH_ALTGR.Quote,
  },
  Backslash: { base: '$', shift: '£', ...DE_CH_ALTGR.Backslash },
  IntlBackslash: {
    base: '<',
    shift: '>',
    ...DE_CH_ALTGR.IntlBackslash,
  },
  KeyZ: { base: 'y', shift: 'Y' },
  Comma: { base: ',', shift: ';' },
  Period: { base: '.', shift: ':' },
  Slash: { base: '-', shift: '_' },
  CapsLock: { base: 'Fest' },
  ShiftLeft: { base: 'Umsch' },
  ShiftRight: { base: 'Umsch' },
  Enter: { base: 'Eingabe' },
  Delete: { base: 'Entf' },
  ControlLeft: { base: 'Strg' },
  AltGr: { base: 'Alt Gr' },
  ControlRight: { base: 'Strg' },
  Insert: { base: 'Einfg' },
  Home: { base: 'Pos1' },
  PageUp: { base: 'Bild↑' },
  End: { base: 'Ende' },
  PageDown: { base: 'Bild↓' },
  PrintScreen: { base: 'Druck' },
  ScrollLock: { base: 'Rollen' },
};

const DE_CH_RIGHT_PANEL_ROWS = [
  [
    createKeyDef('Insert', KEY_LEGENDS.Insert),
    createKeyDef('Home', KEY_LEGENDS.Home),
    createKeyDef('PageUp', KEY_LEGENDS.PageUp),
  ],
  [
    createKeyDef('Delete', KEY_LEGENDS.Delete),
    createKeyDef('End', KEY_LEGENDS.End),
    createKeyDef('PageDown', KEY_LEGENDS.PageDown),
  ],
  [
    createKeyDef('PrintScreen', KEY_LEGENDS.PrintScreen),
    createKeyDef('ScrollLock', KEY_LEGENDS.ScrollLock),
    createKeyDef('Pause'),
  ],
  [createKeyDef('__vk_spacer__placeholder1', { base: '' })],
  [
    createKeyDef('__vk_spacer__arrowUpLeft', { base: '' }),
    createKeyDef('ArrowUp', { base: '⌃' }),
    createKeyDef('__vk_spacer__arrowUpRight', { base: '' }),
  ],
  [
    createKeyDef('ArrowLeft', { base: '‹' }),
    createKeyDef('ArrowDown', { base: '⌄' }),
    createKeyDef('ArrowRight', { base: '›' }),
  ],
];

export const DE_CH_WIN_LAYOUT: KeyboardLayout = {
  id: LAYOUT_META.id,
  name: LAYOUT_META.name,
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
      createKeyDef('Tab', KEY_LEGENDS.Tab, { width: 1.5 }),
      createKeyDef('KeyQ', DE_CH_ALTGR.KeyQ),
      createKeyDef('KeyW'),
      createKeyDef('KeyE', DE_CH_ALTGR.KeyE),
      createKeyDef('KeyR'),
      createKeyDef('KeyT'),

      createKeyDef('KeyY', KEY_LEGENDS.KeyY),
      createKeyDef('KeyU'),
      createKeyDef('KeyI'),
      createKeyDef('KeyO'),
      createKeyDef('KeyP'),
      createKeyDef('BracketLeft', KEY_LEGENDS.BracketLeft, { showDualState: false }),
      createKeyDef('BracketRight', KEY_LEGENDS.BracketRight),
      createKeyDef('Delete', KEY_LEGENDS.Delete),
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
      createKeyDef('Backslash', KEY_LEGENDS.Backslash),
      createKeyDef('Enter', KEY_LEGENDS.Enter, { width: 1.8 }),
    ],
    [
      createKeyDef('ShiftLeft', KEY_LEGENDS.ShiftLeft, { width: 1.3 }),
      createKeyDef('IntlBackslash', KEY_LEGENDS.IntlBackslash),
      createKeyDef('KeyZ', KEY_LEGENDS.KeyZ),
      createKeyDef('KeyX'),
      createKeyDef('KeyC'),
      createKeyDef('KeyV'),
      createKeyDef('KeyB'),
      createKeyDef('KeyN'),
      createKeyDef('KeyM'),
      createKeyDef('Comma', KEY_LEGENDS.Comma),
      createKeyDef('Period', KEY_LEGENDS.Period),
      createKeyDef('Slash', KEY_LEGENDS.Slash),
      createKeyDef('ShiftRight', KEY_LEGENDS.ShiftRight, { width: 2.7 }),
    ],
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
  rightPanel: DE_CH_RIGHT_PANEL_ROWS,
  extraChars: {
    // Swiss German special characters (directly typable, no dead key required)
    ß: { code: 'Minus', mod: ['AltRight'] }, // AltGr+' -> ß

    // Vowels with acute accent - direct key or dead key ´
    é: { code: 'Semicolon', mod: ['ShiftLeft'] }, // Shift+ö -> é (direct)
    É: { code: 'Semicolon', mod: ['ShiftLeft', 'CapsLock'] },
    á: { code: 'KeyA', deadKey: DEAD_KEY_ACUTE },
    Á: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    í: { code: 'KeyI', deadKey: DEAD_KEY_ACUTE },
    Í: { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    ó: { code: 'KeyO', deadKey: DEAD_KEY_ACUTE },
    Ó: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    ú: { code: 'KeyU', deadKey: DEAD_KEY_ACUTE },
    Ú: { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },

    // Vowels with grave accent - direct key or dead key `
    à: { code: 'Quote', mod: ['ShiftLeft'] }, // Shift+ä -> à (direct)
    À: { code: 'Quote', mod: ['ShiftLeft', 'CapsLock'] },
    è: { code: 'BracketLeft', mod: ['ShiftLeft'] }, // Shift+ü -> è (direct)
    È: { code: 'BracketLeft', mod: ['ShiftLeft', 'CapsLock'] },
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

    // Characters with tilde
    ã: { code: 'KeyA', deadKey: DEAD_KEY_TILDE },
    Ã: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEY_TILDE },
    õ: { code: 'KeyO', deadKey: DEAD_KEY_TILDE },
    Õ: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_TILDE },
    ñ: { code: 'KeyN', deadKey: DEAD_KEY_TILDE },
    Ñ: { code: 'KeyN', mod: ['ShiftLeft'], deadKey: DEAD_KEY_TILDE },

    // Vowels with umlaut/diaeresis
    ü: { code: 'BracketLeft' },
    Ü: { code: 'BracketLeft', mod: ['ShiftLeft'] },
    ö: { code: 'Semicolon' },
    Ö: { code: 'Semicolon', mod: ['ShiftLeft'] },
    ä: { code: 'Quote' },
    Ä: { code: 'Quote', mod: ['ShiftLeft'] },
    ë: { code: 'KeyE', deadKey: { code: 'BracketRight' } }, // ¨ + e
    Ë: { code: 'KeyE', mod: ['ShiftLeft'], deadKey: { code: 'BracketRight' } },
    ï: { code: 'KeyI', deadKey: { code: 'BracketRight' } }, // ¨ + i
    Ï: { code: 'KeyI', mod: ['ShiftLeft'], deadKey: { code: 'BracketRight' } },
    ÿ: { code: 'KeyY', deadKey: { code: 'BracketRight' } }, // ¨ + y
    Ÿ: { code: 'KeyY', mod: ['ShiftLeft'], deadKey: { code: 'BracketRight' } },

    // French cedilla
    ç: { code: 'Digit4', mod: ['ShiftLeft'] }, // Shift+4 -> ç (direct)
    Ç: { code: 'Digit4', mod: ['ShiftLeft', 'CapsLock'] },
  },
};
