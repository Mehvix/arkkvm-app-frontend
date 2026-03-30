import { createKeyDef } from '../../merge'
import { FUNCTION_KEYS_ROW, RIGHT_PANEL_ROWS } from '../../rows'

const CS_CZ_ALTGR: Record<string, { altGr?: string; 'shift+altGr'?: string }> =
  {
    Backquote: { altGr: '~' },
    Digit1: { altGr: 'ˇ' },
    Digit2: { altGr: '^' },
    Digit3: { altGr: '˘' },
    Digit4: { altGr: '°' },
    Digit5: { altGr: '˛' },
    Digit6: { altGr: '`' },
    Digit7: { altGr: '˙' },
    Digit8: { altGr: '´' },
    Digit9: { altGr: '˝' },
    Digit0: { altGr: '¨' },
    Minus: { altGr: '¸' },

    KeyQ: { altGr: '\\' },
    KeyW: { altGr: '|' },
    KeyE: { altGr: '€' },
    BracketLeft: { altGr: '÷' },
    BracketRight: { altGr: '×' },

    KeyS: { altGr: 'đ' },
    KeyD: { altGr: 'Đ' },
    KeyF: { altGr: '[' },
    KeyG: { altGr: ']' },
    KeyK: { altGr: 'ł' },
    KeyL: { altGr: 'Ł' },
    Semicolon: { altGr: '$' },
    Quote: { altGr: 'ß' },
    Backslash: { altGr: '¤' },

    KeyX: { altGr: '#' },
    KeyC: { altGr: '&' },
    KeyV: { altGr: '@' },
    KeyB: { altGr: '{' },
    KeyN: { altGr: '}' },
    KeyM: { altGr: '^' },
    Comma: { altGr: '<' },
    Period: { altGr: '>' },
    Slash: { altGr: '*' },
  }

export const CZ_WIN_LAYOUT = {
  id: 'cz-win',
  name: 'Čeština (Windows)',
  rows: [
    FUNCTION_KEYS_ROW,
    [
      createKeyDef('Backquote', {
        base: ';',
        shift: '°',
        ...CS_CZ_ALTGR.Backquote,
      }),
      createKeyDef('Digit1', {
        base: '+',
        shift: '1',
        fn: 'F1',
        ...CS_CZ_ALTGR.Digit1,
      }),
      createKeyDef('Digit2', {
        base: 'ě',
        shift: '2',
        caps: 'Ě',

        ...CS_CZ_ALTGR.Digit2,
      }),
      createKeyDef('Digit3', {
        base: 'š',
        shift: '3',
        caps: 'Š',

        ...CS_CZ_ALTGR.Digit3,
      }),
      createKeyDef('Digit4', {
        base: 'č',
        shift: '4',
        caps: 'Č',

        ...CS_CZ_ALTGR.Digit4,
      }),
      createKeyDef('Digit5', {
        base: 'ř',
        shift: '5',
        caps: 'Ř',

        ...CS_CZ_ALTGR.Digit5,
      }),
      createKeyDef('Digit6', {
        base: 'ž',
        shift: '6',
        caps: 'Ž',
        fn: 'F6',
        ...CS_CZ_ALTGR.Digit6,
      }),
      createKeyDef('Digit7', {
        base: 'ý',
        shift: '7',
        caps: 'Ý',
        fn: 'F7',
        ...CS_CZ_ALTGR.Digit7,
      }),
      createKeyDef('Digit8', {
        base: 'á',
        shift: '8',
        caps: 'Á',
        fn: 'F8',
        ...CS_CZ_ALTGR.Digit8,
      }),
      createKeyDef('Digit9', {
        base: 'í',
        shift: '9',
        caps: 'Í',
        fn: 'F9',
        ...CS_CZ_ALTGR.Digit9,
      }),
      createKeyDef('Digit0', {
        base: 'é',
        shift: '0',
        caps: 'É',
        fn: 'F10',
        ...CS_CZ_ALTGR.Digit0,
      }),
      createKeyDef('Minus', {
        base: '=',
        shift: '%',
        fn: 'F11',
        ...CS_CZ_ALTGR.Minus,
      }),
      createKeyDef('Equal', { base: '´', shift: 'ˇ', fn: 'F12' }),
      createKeyDef('Backspace', undefined, { width: 1.5 }),
    ],

    [
      createKeyDef('Tab', undefined, { width: 1.5 }),
      createKeyDef('KeyQ', CS_CZ_ALTGR.KeyQ),
      createKeyDef('KeyW', CS_CZ_ALTGR.KeyW),
      createKeyDef('KeyE', CS_CZ_ALTGR.KeyE),
      createKeyDef('KeyR'),
      createKeyDef('KeyT'),
      createKeyDef('KeyY', {
        base: 'z',
        shift: 'Z',
        caps: 'Z',
        'shift+caps': 'z',
      }),
      createKeyDef('KeyU'),
      createKeyDef('KeyI'),
      createKeyDef('KeyO'),
      createKeyDef('KeyP'),
      createKeyDef('BracketLeft', {
        base: 'ú',
        shift: '/',
        caps: 'Ú',
        ...CS_CZ_ALTGR.BracketLeft,
      }),
      createKeyDef('BracketRight', {
        base: ')',
        shift: '(',
        ...CS_CZ_ALTGR.BracketRight,
      }),
      createKeyDef('Delete'),
    ],

    [
      createKeyDef('CapsLock', undefined, { width: 1.8 }),
      createKeyDef('KeyA'),
      createKeyDef('KeyS', CS_CZ_ALTGR.KeyS),
      createKeyDef('KeyD', CS_CZ_ALTGR.KeyD),
      createKeyDef('KeyF', CS_CZ_ALTGR.KeyF),
      createKeyDef('KeyG', CS_CZ_ALTGR.KeyG),
      createKeyDef('KeyH'),
      createKeyDef('KeyJ'),
      createKeyDef('KeyK', CS_CZ_ALTGR.KeyK),
      createKeyDef('KeyL', CS_CZ_ALTGR.KeyL),
      createKeyDef('Semicolon', {
        base: 'ů',
        shift: '"',
        ...CS_CZ_ALTGR.Semicolon,
      }),
      createKeyDef('Quote', { base: '§', shift: '!', ...CS_CZ_ALTGR.Quote }),
      createKeyDef('Backslash', {
        base: '¨',
        shift: "'",
        ...CS_CZ_ALTGR.Backslash,
      }),
      createKeyDef('Enter', undefined, { width: 2.7 }),
    ],

    [
      createKeyDef('ShiftLeft', undefined, { width: 1.2 }),
      createKeyDef('IntlBackslash', { base: '\\', shift: '|' }),
      createKeyDef('KeyZ', {
        base: 'y',
        shift: 'Y',
        caps: 'Y',
        'shift+caps': 'y',
      }),
      createKeyDef('KeyX', CS_CZ_ALTGR.KeyX),
      createKeyDef('KeyC', CS_CZ_ALTGR.KeyC),
      createKeyDef('KeyV', CS_CZ_ALTGR.KeyV),
      createKeyDef('KeyB', CS_CZ_ALTGR.KeyB),
      createKeyDef('KeyN', CS_CZ_ALTGR.KeyN),
      createKeyDef('KeyM', CS_CZ_ALTGR.KeyM),
      createKeyDef('Comma', { base: ',', shift: '?', ...CS_CZ_ALTGR.Comma }),
      createKeyDef('Period', { base: '.', shift: ':', ...CS_CZ_ALTGR.Period }),
      createKeyDef('Slash', { base: '-', shift: '_', ...CS_CZ_ALTGR.Slash }),

      createKeyDef('ShiftRight', undefined, { width: 2 }),
    ],

    [
      createKeyDef('ControlLeft', undefined, { width: 1.2 }),
      createKeyDef('MetaLeft'),
      createKeyDef('AltLeft'),
      createKeyDef('Space', undefined, { width: 6 }),
      createKeyDef('AltGr', { base: 'AltGr' }),
      createKeyDef('ControlRight'),

      createKeyDef('ContextMenu'),
    ],
  ],
  rightPanel: RIGHT_PANEL_ROWS,
}
