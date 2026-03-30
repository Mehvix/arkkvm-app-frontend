import { createKeyDef } from '../../merge'
import { FUNCTION_KEYS_ROW, RIGHT_PANEL_ROWS } from '../../rows'

const DEAD_KEY_CIRCUMFLEX = { code: 'BracketLeft' }
const DEAD_KEY_GRAVE = { code: 'BracketLeft', mod: ['ShiftLeft'] }
const DEAD_KEY_TILDE = { code: 'BracketRight', mod: ['AltRight'] }
const DEAD_KEY_ACUTE = { code: 'Quote' }

const DE_CH_ALTGR: Record<string, { altGr?: string; 'shift+altGr'?: string }> =
  {
    Digit1: { altGr: '¦' },
    Digit2: { altGr: '@' }, // AltGr+2 -> @
    Digit3: { altGr: '#' }, // AltGr+3 -> #
    Digit4: { altGr: '°' }, // AltGr+4 -> °
    Digit5: { altGr: '§' }, // AltGr+5 -> §
    Digit6: { altGr: '¬' }, // AltGr+6 -> ¬
    Digit7: { altGr: '|' }, // AltGr+7 -> |
    Digit8: { altGr: '¢' }, // AltGr+8 -> ¢
    Digit9: { altGr: "'" }, // AltGr+9 -> '
    Digit0: { altGr: "'" }, // AltGr+0 -> '
    Equal: { altGr: '{' }, // AltGr+^ -> {
    Backquote: { altGr: '}' }, // AltGr+§ -> }
    Minus: { altGr: '´' },
    Equal: { altGr: '~' },

    KeyE: { altGr: '€' }, // AltGr+E -> €
    BracketLeft: { altGr: '[' }, // AltGr+ü -> [
    BracketRight: { altGr: ']' }, // AltGr+¨ -> ]

    Quote: { altGr: '{' }, //
    Backslash: { altGr: '}' },

    IntlBackslash: { altGr: '\\' }, // AltGr+< -> \
  }

export const DE_CH_WIN_LAYOUT = {
  id: 'de-ch-win',
  name: 'Deutsch (Schweiz)',
  rows: [
    FUNCTION_KEYS_ROW,
    [
      createKeyDef('Backquote', {
        base: '§',
        shift: '°',
      }),
      createKeyDef('Digit1', {
        base: '1',
        shift: '+',
        caps: '1',
        ...DE_CH_ALTGR.Digit1,
      }),
      createKeyDef('Digit2', {
        base: '2',
        shift: '"',
        caps: '2',
        ...DE_CH_ALTGR.Digit2,
      }),
      createKeyDef('Digit3', {
        base: '3',
        shift: '*',
        caps: '3',
        ...DE_CH_ALTGR.Digit3,
      }),
      createKeyDef('Digit4', {
        base: '4',
        shift: 'ç',
        caps: '4',
        ...DE_CH_ALTGR.Digit4,
      }),
      createKeyDef('Digit5', {
        base: '5',
        shift: '%',
        caps: '5',
        ...DE_CH_ALTGR.Digit5,
      }),
      createKeyDef('Digit6', {
        base: '6',
        shift: '&',
        caps: '6',
        ...DE_CH_ALTGR.Digit6,
      }),
      createKeyDef('Digit7', {
        base: '7',
        shift: '/',
        caps: '7',
        ...DE_CH_ALTGR.Digit7,
      }),
      createKeyDef('Digit8', {
        base: '8',
        shift: '(',
        caps: '8',
        ...DE_CH_ALTGR.Digit8,
      }),
      createKeyDef('Digit9', {
        base: '9',
        shift: ')',
        caps: '9',
      }),
      createKeyDef('Digit0', {
        base: '0',
        shift: '=',
        caps: '0',
      }),
      createKeyDef('Minus', { base: "'", shift: '?', ...DE_CH_ALTGR.Minus }),
      createKeyDef('Equal', { base: '^', shift: '`', ...DE_CH_ALTGR.Equal }),
      createKeyDef('Backspace', undefined, { width: 1.5 }),
    ],
    [
      createKeyDef('Tab', undefined, { width: 1.5 }),
      createKeyDef('KeyQ', DE_CH_ALTGR.KeyQ),
      createKeyDef('KeyW'),
      createKeyDef('KeyE', DE_CH_ALTGR.KeyE),
      createKeyDef('KeyR'),
      createKeyDef('KeyT'),

      createKeyDef('KeyY', { base: 'z', shift: 'Z' }),
      createKeyDef('KeyU'),
      createKeyDef('KeyI'),
      createKeyDef('KeyO'),
      createKeyDef('KeyP'),
      createKeyDef(
        'BracketLeft',
        {
          base: 'ü',
          shift: 'è',
          ...DE_CH_ALTGR.BracketLeft,
        },
        { showDualState: false }
      ),
      createKeyDef('BracketRight', {
        base: '¨',
        shift: '!',
        ...DE_CH_ALTGR.BracketRight,
      }),
      createKeyDef('Delete'),
    ],
    [
      createKeyDef('CapsLock', undefined, { width: 1.8 }),
      createKeyDef('KeyA'),
      createKeyDef('KeyS'),
      createKeyDef('KeyD'),
      createKeyDef('KeyF'),
      createKeyDef('KeyG'),
      createKeyDef('KeyH'),
      createKeyDef('KeyJ'),
      createKeyDef('KeyK'),
      createKeyDef('KeyL'),
      createKeyDef(
        'Semicolon',
        {
          base: 'ö',
          shift: 'é',
        },
        { showDualState: false }
      ),
      createKeyDef(
        'Quote',
        {
          base: 'ä',
          shift: 'à',
          ...DE_CH_ALTGR.Quote,
        },
        { showDualState: false }
      ),
      createKeyDef('Backslash', {
        base: '$',
        shift: '£',
        ...DE_CH_ALTGR.Backslash,
      }),
      createKeyDef('Enter', undefined, { width: 1.8 }),
    ],
    [
      createKeyDef('ShiftLeft', undefined, { width: 1.3 }),
      createKeyDef('IntlBackslash', {
        base: '<',
        shift: '>',
        ...DE_CH_ALTGR.IntlBackslash,
      }),
      createKeyDef('KeyZ', { base: 'y', shift: 'Y' }),
      createKeyDef('KeyX'),
      createKeyDef('KeyC'),
      createKeyDef('KeyV'),
      createKeyDef('KeyB'),
      createKeyDef('KeyN'),
      createKeyDef('KeyM'),
      createKeyDef('Comma', { base: ',', shift: ';' }),
      createKeyDef('Period', { base: '.', shift: ':' }),
      createKeyDef('Slash', { base: '-', shift: '_' }),
      createKeyDef('ShiftRight', undefined, { width: 2.7 }),
    ],
    [
      createKeyDef('ControlLeft', undefined, { width: 1.2 }),
      createKeyDef('MetaLeft'),
      createKeyDef('AltLeft'),
      createKeyDef('Space', undefined, { width: 6 }),
      createKeyDef('AltGr'),
      createKeyDef('ControlRight', undefined),
      createKeyDef('ContextMenu'),
    ],
  ],
  rightPanel: RIGHT_PANEL_ROWS,
  extraChars: {
    ß: { code: 'Minus', mod: ['AltRight'] }, // AltGr+' -> ß

    é: { code: 'Semicolon', mod: ['ShiftLeft'] },
    É: { code: 'Semicolon', mod: ['ShiftLeft', 'CapsLock'] },
    á: { code: 'KeyA', deadKey: DEAD_KEY_ACUTE },
    Á: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    í: { code: 'KeyI', deadKey: DEAD_KEY_ACUTE },
    Í: { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    ó: { code: 'KeyO', deadKey: DEAD_KEY_ACUTE },
    Ó: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    ú: { code: 'KeyU', deadKey: DEAD_KEY_ACUTE },
    Ú: { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },

    à: { code: 'Quote', mod: ['ShiftLeft'] },
    À: { code: 'Quote', mod: ['ShiftLeft', 'CapsLock'] },
    è: { code: 'BracketLeft', mod: ['ShiftLeft'] },
    È: { code: 'BracketLeft', mod: ['ShiftLeft', 'CapsLock'] },
    ì: { code: 'KeyI', deadKey: DEAD_KEY_GRAVE },
    Ì: { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },
    ò: { code: 'KeyO', deadKey: DEAD_KEY_GRAVE },
    Ò: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },
    ù: { code: 'KeyU', deadKey: DEAD_KEY_GRAVE },
    Ù: { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },

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

    ã: { code: 'KeyA', deadKey: DEAD_KEY_TILDE },
    Ã: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEY_TILDE },
    õ: { code: 'KeyO', deadKey: DEAD_KEY_TILDE },
    Õ: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_TILDE },
    ñ: { code: 'KeyN', deadKey: DEAD_KEY_TILDE },
    Ñ: { code: 'KeyN', mod: ['ShiftLeft'], deadKey: DEAD_KEY_TILDE },

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

    ç: { code: 'Digit4', mod: ['ShiftLeft'] },
    Ç: { code: 'Digit4', mod: ['ShiftLeft', 'CapsLock'] },
  },
}
