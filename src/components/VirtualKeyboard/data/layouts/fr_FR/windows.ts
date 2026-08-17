/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-03-30 15:18:35
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-08-06 22:21:51
 */
import type { KeyboardLayout, KeyLegends } from '../../keyboard-types';
import { createKeyDef } from '../../merge';
import { FUNCTION_KEYS_ROW, RIGHT_PANEL_ROWS, WINDOWS_MODIFIER_ROW_ALTGR } from '../../rows';
const FR_FR_LAYOUT_ID = 'fr-FR-azerty';
const FR_FR_LAYOUT_NAME = 'Français (France) - AZERTY';
const KEY_LEGENDS: Record<string, KeyLegends> = {
  Escape: { base: 'Éch' },
  ControlLeft: { base: 'Ctrl' },
  MetaLeft: { base: '⊞' },
  AltLeft: { base: 'Alt' },
  AltGr: { base: 'AltGr' },
  MetaRight: { base: '⊞' },
  ControlRight: { base: 'Ctrl' },
  ContextMenu: { base: '☰' },
  Backquote: {
    base: '²',
    shift: '',
  },
  Digit1: {
    base: '&',
    shift: '1',
    // caps: '1',
  },
  Digit2: {
    base: 'é',
    shift: '2',
    altGr: '~',
  },
  Digit3: {
    base: '"',
    shift: '3',
    altGr: '#',
  },
  Digit4: {
    base: "'",
    shift: '4',
    altGr: '{',
  },
  Digit5: {
    base: '(',
    shift: '5',
    altGr: '[',
  },
  Digit6: {
    base: '-',
    shift: '6',
    altGr: '|',
  },
  Digit7: {
    base: 'è',
    shift: '7',
    altGr: '`',
  },
  Digit8: {
    base: '_',
    shift: '8',
    altGr: '\\',
  },
  Digit9: {
    base: 'ç',
    shift: '9',
    altGr: '^',
  },
  Digit0: {
    base: 'à',
    shift: '0',
    altGr: '@',
  },
  Minus: {
    base: ')',
    shift: '°',
    altGr: ']',
  },
  Equal: {
    base: '=',
    shift: '+',
    altGr: '}',
  },
  Backspace: {
    base: '⌫',
  },
  Tab: {
    base: 'Tab',
  },
  KeyQ: {
    base: 'a',
    shift: 'A',
  },
  KeyW: {
    base: 'z',
    shift: 'Z',
  },
  KeyE: {
    altGr: '€',
  },
  BracketLeft: {
    base: '^',
    shift: '¨',
  },
  BracketRight: {
    base: '$',
    shift: '£',
    altGr: '¤',
  },
  CapsLock: {
    base: 'Verr. maj',
  },
  KeyA: {
    base: 'q',
    shift: 'Q',
  },
  Semicolon: { base: 'm', shift: 'M' },
  Quote: {
    base: 'ù',
    shift: '%',
  },
  Backslash: { base: '*', shift: 'µ' },
  Enter: {
    base: 'Enter',
  },
  ShiftLeft: {
    base: 'Maj',
  },
  IntlBackslash: { base: '<', shift: '>' },
  KeyZ: {
    base: 'w',
    shift: 'W',
  },
  KeyM: { base: ',', shift: '?' },
  Comma: {
    base: ';',
    shift: '.',
  },
  Period: {
    base: ':',
    shift: '/',
  },
  Slash: { base: '!', shift: '§' },
  ShiftRight: {
    base: 'Maj',
  },
};
const FR_FUNCTION_KEYS_ROW = [
  createKeyDef('Escape', KEY_LEGENDS.Escape),
  ...FUNCTION_KEYS_ROW.slice(1),
];

export const winLayout: KeyboardLayout = {
  id: FR_FR_LAYOUT_ID,
  name: FR_FR_LAYOUT_NAME,
  rows: [
    FR_FUNCTION_KEYS_ROW,
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
      createKeyDef('KeyQ', KEY_LEGENDS.KeyQ),
      createKeyDef('KeyW', KEY_LEGENDS.KeyW),
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
      createKeyDef('CapsLock', KEY_LEGENDS.CapsLock),
      createKeyDef('KeyA', KEY_LEGENDS.KeyA),
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
      createKeyDef('Backslash', KEY_LEGENDS.Backslash, { showDualState: true }),
      createKeyDef('Enter', KEY_LEGENDS.Enter),
    ],
    // Bottom letter row
    [
      createKeyDef('ShiftLeft', KEY_LEGENDS.ShiftLeft),
      createKeyDef('IntlBackslash', KEY_LEGENDS.IntlBackslash, { showDualState: true }),
      createKeyDef('KeyZ', KEY_LEGENDS.KeyZ),
      createKeyDef('KeyX'),
      createKeyDef('KeyC'),
      createKeyDef('KeyV'),
      createKeyDef('KeyB'),
      createKeyDef('KeyN'),
      createKeyDef('KeyM', KEY_LEGENDS.KeyM, { showDualState: true }),
      createKeyDef('Comma', KEY_LEGENDS.Comma),
      createKeyDef('Period', KEY_LEGENDS.Period),
      createKeyDef('Slash', KEY_LEGENDS.Slash, { showDualState: true }),
      createKeyDef('ShiftRight', KEY_LEGENDS.ShiftRight),
    ],
    WINDOWS_MODIFIER_ROW_ALTGR,
  ],
  rightPanel: RIGHT_PANEL_ROWS,
};
