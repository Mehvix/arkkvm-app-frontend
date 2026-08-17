import type { KeyboardLayout, KeyLegends } from '../../keyboard-types';
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

const KEY_LEGENDS: Record<string, KeyLegends> = {
  Backquote: { base: '`', shift: '¬', ...EN_GB_ALTGR.Backquote },
  Digit1: { base: '1', shift: '!' },
  Digit2: { base: '2', shift: '"' },
  Digit3: { base: '3', shift: '£' },
  Digit4: {
    base: '4',
    shift: '$',
    ...EN_GB_ALTGR.Digit4,
  },
  Digit5: { base: '5', shift: '%' },
  Digit6: { base: '6', shift: '^' },
  Digit7: { base: '7', shift: '&' },
  Digit8: { base: '8', shift: '*' },
  Digit9: { base: '9', shift: '(' },
  Digit0: { base: '0', shift: ')' },
  Minus: { base: '-', shift: '_' },
  Equal: { base: '=', shift: '+' },
  Semicolon: { base: ';', shift: ':' },
  Quote: { base: '\'', shift: '@' },
  Backslash: { base: '#', shift: '~', ...EN_GB_ALTGR.Backslash },
  IntlBackslash: { base: '\\', shift: '|' },
};
export const UK_WIN_LAYOUT: KeyboardLayout = {
  id: 'uk-win',
  name: 'English (UK)',
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
      createKeyDef('Semicolon', KEY_LEGENDS.Semicolon),
      createKeyDef('Quote', KEY_LEGENDS.Quote),
      createKeyDef('Backslash', KEY_LEGENDS.Backslash),
      createKeyDef('Enter', undefined, { width: 2.7 }),
    ],
    [
      createKeyDef('ShiftLeft', undefined, { width: 2.2 }),
      // ISO: extra key next to left Shift
      createKeyDef('IntlBackslash', KEY_LEGENDS.IntlBackslash),
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
