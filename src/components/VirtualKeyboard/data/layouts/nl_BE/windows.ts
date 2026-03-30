import { createKeyDef } from '../../merge'
import { FUNCTION_KEYS_ROW, RIGHT_PANEL_ROWS } from '../../rows'

// Belgium (nl-BE) — AZERTY (Windows)

const NL_BE_ALTGR: Record<string, { altGr?: string }> = {
  Digit1: { altGr: '|' },
  Digit2: { altGr: '@' },
  Digit3: { altGr: '#' },
  Digit4: { altGr: '{' },
  Digit5: { altGr: '[' },
  Digit6: { altGr: '^' },
  Digit0: { altGr: '}' },
  Digit9: { altGr: '{' },
  BracketLeft: { altGr: '[' },
  BracketRight: { altGr: ']' },
  KeyE: { altGr: '€' },
  IntlBackslash: { altGr: '\\' },
  Slash: { altGr: '~' },
  Quote: { altGr: '´' },
  Backslash: { altGr: '`' },
}

export const NL_BE_WIN_LAYOUT = {
  id: 'nl-be-win',
  name: 'Nederlands (België) — AZERTY',
  rows: [
    FUNCTION_KEYS_ROW,

    [
      createKeyDef('Backquote', { base: '²', shift: '³' }),
      createKeyDef('Digit1', {
        base: '&',
        shift: '1',
        caps: '&',
        ...NL_BE_ALTGR.Digit1,
      }),
      createKeyDef('Digit2', {
        base: 'é',
        shift: '2',
        caps: 'é',
        ...NL_BE_ALTGR.Digit2,
      }),
      createKeyDef('Digit3', {
        base: '"',
        shift: '3',
        caps: '"',
        ...NL_BE_ALTGR.Digit3,
      }),
      createKeyDef('Digit4', {
        base: "'",
        shift: '4',
        caps: "'",
        ...NL_BE_ALTGR.Digit4,
      }),
      createKeyDef('Digit5', {
        base: '(',
        shift: '5',
        caps: '(',
        ...NL_BE_ALTGR.Digit5,
      }),
      createKeyDef('Digit6', {
        base: '§',
        shift: '6',
        caps: '§',
        ...NL_BE_ALTGR.Digit6,
      }),
      createKeyDef('Digit7', { base: 'è', shift: '7', caps: 'è' }),
      createKeyDef('Digit8', { base: '!', shift: '8', caps: '!' }),
      createKeyDef('Digit9', {
        base: 'ç',
        shift: '9',
        caps: 'ç',
        ...NL_BE_ALTGR.Digit9,
      }),
      createKeyDef('Digit0', {
        base: 'à',
        shift: '0',
        caps: 'à',
        ...NL_BE_ALTGR.Digit0,
      }),
      createKeyDef('Minus', { base: ')', shift: '°' }),
      createKeyDef('Equal', { base: '-', shift: '_' }),
      createKeyDef('Backspace', undefined, { width: 1.5 }),
    ],

    [
      createKeyDef('Tab', undefined, { width: 1.5 }),
      createKeyDef('KeyQ', { base: 'a', shift: 'A' }),
      createKeyDef('KeyW', { base: 'z', shift: 'Z' }),
      createKeyDef('KeyE', { base: 'e', shift: 'E', ...NL_BE_ALTGR.KeyE }),
      createKeyDef('KeyR'),
      createKeyDef('KeyT'),
      createKeyDef('KeyY'),
      createKeyDef('KeyU'),
      createKeyDef('KeyI'),
      createKeyDef('KeyO'),
      createKeyDef('KeyP'),
      createKeyDef('BracketLeft', {
        base: '^',
        shift: '¨',
        ...NL_BE_ALTGR.BracketLeft,
      }),
      createKeyDef('BracketRight', {
        base: '$',
        shift: '*',
        ...NL_BE_ALTGR.BracketRight,
      }),
    ],

    [
      createKeyDef('CapsLock', undefined, { width: 1.8 }),
      createKeyDef('KeyA', { base: 'q', shift: 'Q' }),
      createKeyDef('KeyS'),
      createKeyDef('KeyD'),
      createKeyDef('KeyF'),
      createKeyDef('KeyG'),
      createKeyDef('KeyH'),
      createKeyDef('KeyJ'),
      createKeyDef('KeyK'),
      createKeyDef('KeyL'),
      createKeyDef('Semicolon', { base: 'm', shift: 'M' }),
      createKeyDef('Quote', { base: 'ù', shift: '%', ...NL_BE_ALTGR.Quote }),
      createKeyDef('Backslash', {
        base: 'µ',
        shift: '£',
        ...NL_BE_ALTGR.Backslash,
      }),
      createKeyDef('Enter', undefined, { width: 2.7 }),
    ],

    [
      createKeyDef('ShiftLeft', undefined, { width: 2.2 }),
      createKeyDef('IntlBackslash', {
        base: '<',
        shift: '>',
        ...NL_BE_ALTGR.IntlBackslash,
      }),
      createKeyDef('KeyZ', { base: 'w', shift: 'W' }),
      createKeyDef('KeyX'),
      createKeyDef('KeyC'),
      createKeyDef('KeyV'),
      createKeyDef('KeyB'),
      createKeyDef('KeyN'),
      createKeyDef('KeyM', { base: ',', shift: '?' }, { showDualState: true }),
      createKeyDef('Comma', { base: ';', shift: '.' }),
      createKeyDef('Period', { base: ':', shift: '/' }),
      createKeyDef('Slash', { base: '=', shift: '+', ...NL_BE_ALTGR.Slash }),
      createKeyDef('ShiftRight', undefined, { width: 2 }),
    ],

    [
      createKeyDef('ControlLeft'),
      createKeyDef('MetaLeft'),
      createKeyDef('AltLeft'),
      createKeyDef('Space', undefined, { width: 7 }),
      createKeyDef('AltGr'),
      createKeyDef('ControlRight'),
      createKeyDef('ContextMenu'),
    ],
  ],
  rightPanel: RIGHT_PANEL_ROWS,
}
