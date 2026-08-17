/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-03-30 15:18:35
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-09 11:46:56
 */
import type { KeyboardLayout, KeyLegends } from '../../keyboard-types';
import { createKeyDef } from '../../merge';
import {
  FUNCTION_KEYS_ROW,
  RIGHT_PANEL_ROWS,
  WINDOWS_MODIFIER_ROW_ALTGR,
} from '../../rows';
import { ptPTMeta as LAYOUT_META } from '../meta';

const KEY_LEGENDS: Record<string, KeyLegends> = {
  Escape: { base: 'Esc' },
  ControlLeft: { base: 'Ctrl' },
  MetaLeft: { base: '⊞' },
  AltLeft: { base: 'Alt' },
  AltGr: { base: 'AltGr' },
  MetaRight: { base: '⊞' },
  ControlRight: { base: 'Ctrl' },
  ContextMenu: { base: '☰' },
  Backquote: {
    base: '\\',
    shift: '|',
  },
  Digit1: {
    base: '1',
    shift: '!',
  },
  Digit2: {
    base: '2',
    shift: '"',
    altGr: '@',
  },
  Digit3: {
    base: '3',
    shift: '#',
    altGr: '£',
  },
  Digit4: {
    base: '4',
    shift: '$',
    altGr: '§',
  },
  Digit5: {
    base: '5',
    shift: '%',
    altGr: '€',
  },
  Digit6: {
    base: '6',
    shift: '&',
  },
  Digit7: {
    base: '7',
    shift: '/',
    altGr: '{',
  },
  Digit8: {
    base: '8',
    shift: '(',
    altGr: '[',
  },
  Digit9: {
    base: '9',
    shift: ')',
    altGr: ']',
  },
  Digit0: {
    base: '0',
    shift: '=',
    altGr: '}',
  },
  Minus: {
    base: '\'',
    shift: '?',
  },
  Equal: {
    base: '«',
    shift: '»',
  },
  Backspace: {
    base: '⌫',
  },
  Tab: {
    base: 'Maiú.',
  },
  KeyE: {
    altGr: '€',
  },
  BracketLeft: {
    base: '+',
    shift: '*',
    altGr: '¨',
  },
  BracketRight: {
    base: '´',
    shift: '`',
    altGr: ']',
  },
  Semicolon: { base: 'ç', shift: 'Ç' },
  Quote: {
    base: 'º',
    shift: 'ª',
  },
  Backslash: {
    base: '~',
    shift: '^',
  },
  IntlBackslash: { base: '<', shift: '>' },
  Comma: {
    base: ',',
    shift: ';',
  },
  Period: {
    base: '.',
    shift: ':',
  },
  Slash: { base: '-', shift: '_' },
};
export const winLayout: KeyboardLayout = {
  id: LAYOUT_META.id,
  name: LAYOUT_META.name,
  rows: [
    FUNCTION_KEYS_ROW,
    // Number row
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
      createKeyDef('Backspace', KEY_LEGENDS.Backspace),
    ],
    // Top letter row
    [
      createKeyDef('Tab', KEY_LEGENDS.Tab),
      createKeyDef('KeyQ'),
      createKeyDef('KeyW'),
      createKeyDef('KeyE', KEY_LEGENDS.KeyE),
      createKeyDef('KeyR'),
      createKeyDef('KeyT'),
      createKeyDef('KeyY'),
      createKeyDef('KeyU'),
      createKeyDef('KeyI'),
      createKeyDef('KeyO'),
      createKeyDef('KeyP'),
      createKeyDef('BracketLeft', KEY_LEGENDS.BracketLeft),
      createKeyDef('BracketRight', KEY_LEGENDS.BracketRight),
    ],
    // Home row
    [
      createKeyDef('CapsLock'),
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
      createKeyDef('Quote', KEY_LEGENDS.Quote),
      createKeyDef('Backslash', KEY_LEGENDS.Backslash),

      createKeyDef('Enter'),
    ],
    // Bottom letter row
    [
      createKeyDef('ShiftLeft'),
      createKeyDef('IntlBackslash', KEY_LEGENDS.IntlBackslash, { showDualState: true }),
      createKeyDef('KeyZ'),
      createKeyDef('KeyX'),
      createKeyDef('KeyC'),
      createKeyDef('KeyV'),
      createKeyDef('KeyB'),
      createKeyDef('KeyN'),
      createKeyDef('KeyM'),
      createKeyDef('Comma', KEY_LEGENDS.Comma),
      createKeyDef('Period', KEY_LEGENDS.Period),
      createKeyDef('Slash', KEY_LEGENDS.Slash, { showDualState: true }),
      createKeyDef('ShiftRight'),
    ],
    WINDOWS_MODIFIER_ROW_ALTGR,
  ],
  rightPanel: RIGHT_PANEL_ROWS,
};
