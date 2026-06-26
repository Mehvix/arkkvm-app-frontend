/**
 * @Purpose: UK English Windows keyboard layout
 * @Author: zhanglei
 * @Date: 2026-01-28
 */
import { createKeyDef } from '../../merge';
import { FUNCTION_KEYS_ROW, RIGHT_PANEL_ROWS } from '../../rows';

const EN_GB_ALTGR: Record<string, { altGr?: string }> = {
  Backquote: { altGr: '¦' },
  Digit4: { altGr: '€' },
  KeyA: { altGr: 'á' },
  KeyE: { altGr: 'é' },
  KeyI: { altGr: 'í' },
  KeyO: { altGr: 'ó' },
  KeyU: { altGr: 'ú' },
  Backslash: { altGr: '|' },
};

export const UK_WIN_LAYOUT = {
  id: 'uk-win',
  name: 'English (UK)',
  rows: [
    FUNCTION_KEYS_ROW,
    [
      createKeyDef('Backquote', { base: '`', shift: '¬' , ...EN_GB_ALTGR.Backquote}),
      createKeyDef('Digit1', { base: '1', shift: '!', caps: '1' }),
      createKeyDef('Digit2', { base: '2', shift: '"', caps: '2' }),
      createKeyDef('Digit3', { base: '3', shift: '£', caps: '3' }),
      createKeyDef('Digit4', {
        base: '4',
        shift: '$',
        caps: '4',
        ...EN_GB_ALTGR.Digit4,
      }),
      createKeyDef('Digit5', { base: '5', shift: '%', caps: '5' }),
      createKeyDef('Digit6', { base: '6', shift: '^', caps: '6' }),
      createKeyDef('Digit7', { base: '7', shift: '&', caps: '7' }),
      createKeyDef('Digit8', { base: '8', shift: '*', caps: '8' }),
      createKeyDef('Digit9', { base: '9', shift: '(', caps: '9' }),
      createKeyDef('Digit0', { base: '0', shift: ')', caps: '0' }),
      createKeyDef('Minus', { base: '-', shift: '_' }),
      createKeyDef('Equal', { base: '=', shift: '+',  }),
      createKeyDef('Backspace', undefined, { width: 1.5 }),
    ],
    [
      createKeyDef('Tab', undefined, { width: 1.5 }),
      createKeyDef('KeyQ'),
      createKeyDef('KeyW'),
      createKeyDef('KeyE', EN_GB_ALTGR.KeyE),
      createKeyDef('KeyR'),
      createKeyDef('KeyT'),
      createKeyDef('KeyY'),
      createKeyDef('KeyU', EN_GB_ALTGR.KeyU),
      createKeyDef('KeyI', EN_GB_ALTGR.KeyI),
      createKeyDef('KeyO', EN_GB_ALTGR.KeyO),
      createKeyDef('KeyP'),
      createKeyDef('BracketLeft'),
      createKeyDef('BracketRight'),
    ],
    [
      createKeyDef('CapsLock', undefined, { width: 1.8 }),
      createKeyDef('KeyA', EN_GB_ALTGR.KeyA),
      createKeyDef('KeyS'),
      createKeyDef('KeyD'),
      createKeyDef('KeyF'),
      createKeyDef('KeyG'),
      createKeyDef('KeyH'),
      createKeyDef('KeyJ'),
      createKeyDef('KeyK'),
      createKeyDef('KeyL'),
      createKeyDef('Semicolon', { base: ';', shift: ':' }),
      createKeyDef('Quote', { base: '\'', shift: '@' }),
      createKeyDef('Backslash', { base: '#', shift: '~', ...EN_GB_ALTGR.Backslash }),
      createKeyDef('Enter', undefined, { width: 2.7 }),
    ],
    [
      createKeyDef('ShiftLeft', undefined, { width: 2.2 }),
      // ISO: extra key next to left Shift
      createKeyDef('IntlBackslash', { base: '\\', shift: '|' }),
      createKeyDef('KeyZ'),
      createKeyDef('KeyX'),
      createKeyDef('KeyC'),
      createKeyDef('KeyV'),
      createKeyDef('KeyB'),
      createKeyDef('KeyN'),
      createKeyDef('KeyM'),
      createKeyDef('Comma'),
      createKeyDef('Period'),
      createKeyDef('Slash'),
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
};
