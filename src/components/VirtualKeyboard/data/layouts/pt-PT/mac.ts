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
  MAC_MODIFIER_ROW_ALTGR,
  MAC_SPECIAL_KEYS,
  RIGHT_PANEL_ROWS,
} from '../../rows';
import { ptPTMeta as LAYOUT_META } from '../meta';

const KEY_LEGENDS: Record<string, KeyLegends> = {
  Escape: { base: 'Esc' },
  Backquote: {
    base: '<',
    shift: '>',
    altGr: '≤',
    'shift+altGr': '≥',
  },
  Digit1: {
    base: '1',
    shift: '!',
    altGr: '',
    'shift+altGr': '¡',
  },
  Digit2: {
    base: '2',
    shift: '"',
    altGr: '@',
    'shift+altGr': 'ﬁ',
  },
  Digit3: {
    base: '3',
    shift: '#',
    altGr: '€',
    'shift+altGr': 'ﬂ',
  },
  Digit4: {
    base: '4',
    shift: '$',
    altGr: '£',
    'shift+altGr': '¢',
  },
  Digit5: {
    base: '5',
    shift: '%',
    altGr: '‰',
    'shift+altGr': '∞',
  },
  Digit6: {
    base: '6',
    shift: '&',
    altGr: '¶',
    'shift+altGr': '•',
  },
  Digit7: {
    base: '7',
    shift: '/',
    altGr: '÷',
    'shift+altGr': '⁄',
  },
  Digit8: {
    base: '8',
    shift: '(',
    altGr: '[',
    'shift+altGr': '{',
  },
  Digit9: {
    base: '9',
    shift: ')',
    altGr: ']',
    'shift+altGr': '}',
  },
  Digit0: {
    base: '0',
    shift: '=',
    altGr: '≠',
    'shift+altGr': '≈',
  },
  Minus: {
    base: '\'',
    shift: '?',
    altGr: '§',
    'shift+altGr': '¿',
  },
  Equal: {
    base: '+',
    shift: '*',
    altGr: '±',
    'shift+altGr': '◊',
  },
  Backspace: {
    base: '⌫',
  },
  KeyQ: {
    altGr: 'œ',
    'shift+altGr': 'Œ',
  },
  KeyW: {
    altGr: '∑',
    'shift+altGr': '∑',
  },
  KeyE: {
    altGr: 'æ',
    'shift+altGr': 'Æ',
  },
  KeyR: {
    altGr: '®',
    'shift+altGr': '®',
  },
  KeyT: {
    altGr: '™',
    'shift+altGr': '™',
  },
  KeyY: {
    altGr: '¥',
    'shift+altGr': '¥',
  },
  KeyU: {
    altGr: '†',
    'shift+altGr': '‡',
  },
  KeyI: {
    altGr: 'ı',
    'shift+altGr': '˚',
  },
  KeyO: {
    altGr: 'ø',
    'shift+altGr': 'Ø',
  },
  KeyP: {
    altGr: 'π',
    'shift+altGr': '∏',
  },
  BracketLeft: {
    base: 'º',
    shift: 'ª',
    altGr: '°',
    'shift+altGr': '˚',
  },
  BracketRight: {
    base: '´',
    shift: '`',
    altGr: '¨',
    'shift+altGr': '˝',
  },
  Backslash: { base: '\\', shift: '|', altGr: '‹', 'shift+altGr': '›' },
  KeyA: {
    altGr: 'å',
    'shift+altGr': 'Å',
  },
  KeyS: {
    altGr: 'ß',
    'shift+altGr': 'ß',
  },
  KeyD: {
    altGr: '∂',
    'shift+altGr': '∆',
  },
  KeyF: {
    altGr: 'ƒ',
    'shift+altGr': 'ƒ',
  },
  KeyG: {
    altGr: '˙',
    'shift+altGr': '˙',
  },
  KeyH: {
    altGr: 'ˇ',
    'shift+altGr': 'ˇ',
  },
  KeyJ: {
    altGr: '¯',
    'shift+altGr': '¯',
  },
  KeyK: {
    altGr: '„',
    'shift+altGr': '‚',
  },
  KeyL: {
    altGr: '‘',
    'shift+altGr': '’',
  },
  Semicolon: { base: 'ç', shift: 'Ç', altGr: '¸', 'shift+altGr': '˛' },
  Quote: {
    base: '~',
    shift: '^',
    altGr: '˜',
    'shift+altGr': 'ˆ',
  },
  KeyZ: {
    altGr: 'Ω',
    'shift+altGr': 'Ω',
  },
  KeyX: {
    altGr: '«',
    'shift+altGr': '»',
  },
  KeyC: {
    altGr: '©',
    'shift+altGr': '©',
  },
  KeyV: {
    altGr: '√',
    'shift+altGr': '√',
  },
  KeyB: {
    altGr: '∫',
    'shift+altGr': '∫',
  },
  KeyN: {
    altGr: '¬',
    'shift+altGr': '¬',
  },
  KeyM: { altGr: 'µ', 'shift+altGr': 'µ' },
  Comma: {
    base: ',',
    shift: ';',
    altGr: '“',
    'shift+altGr': '”',
  },
  Period: {
    base: '.',
    shift: ':',
    altGr: '…',
    'shift+altGr': '·',
  },
  Slash: { base: '-', shift: '_', altGr: '—', 'shift+altGr': '–' },
};
export const macLayout: KeyboardLayout = {
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
      MAC_SPECIAL_KEYS['Tab'],
      createKeyDef('KeyQ', KEY_LEGENDS.KeyQ),
      createKeyDef('KeyW', KEY_LEGENDS.KeyW),
      createKeyDef('KeyE', KEY_LEGENDS.KeyE),
      createKeyDef('KeyR', KEY_LEGENDS.KeyR),
      createKeyDef('KeyT', KEY_LEGENDS.KeyT),
      createKeyDef('KeyY', KEY_LEGENDS.KeyY),
      createKeyDef('KeyU', KEY_LEGENDS.KeyU),
      createKeyDef('KeyI', KEY_LEGENDS.KeyI),
      createKeyDef('KeyO', KEY_LEGENDS.KeyO),
      createKeyDef('KeyP', KEY_LEGENDS.KeyP),
      createKeyDef('BracketLeft', KEY_LEGENDS.BracketLeft),
      createKeyDef('BracketRight', KEY_LEGENDS.BracketRight),
      createKeyDef('Backslash', KEY_LEGENDS.Backslash),
    ],
    // Home row
    [
      MAC_SPECIAL_KEYS['CapsLock'],

      createKeyDef('KeyA', KEY_LEGENDS.KeyA),
      createKeyDef('KeyS', KEY_LEGENDS.KeyS),
      createKeyDef('KeyD', KEY_LEGENDS.KeyD),
      createKeyDef('KeyF', KEY_LEGENDS.KeyF),
      createKeyDef('KeyG', KEY_LEGENDS.KeyG),
      createKeyDef('KeyH', KEY_LEGENDS.KeyH),
      createKeyDef('KeyJ', KEY_LEGENDS.KeyJ),
      createKeyDef('KeyK', KEY_LEGENDS.KeyK),
      createKeyDef('KeyL', KEY_LEGENDS.KeyL),
      createKeyDef('Semicolon', KEY_LEGENDS.Semicolon, { showDualState: false }),
      createKeyDef('Quote', KEY_LEGENDS.Quote),

      MAC_SPECIAL_KEYS['Enter'],
    ],
    // Bottom letter row
    [
      MAC_SPECIAL_KEYS['ShiftLeft'],
      createKeyDef('KeyZ', KEY_LEGENDS.KeyZ),
      createKeyDef('KeyX', KEY_LEGENDS.KeyX),
      createKeyDef('KeyC', KEY_LEGENDS.KeyC),
      createKeyDef('KeyV', KEY_LEGENDS.KeyV),
      createKeyDef('KeyB', KEY_LEGENDS.KeyB),
      createKeyDef('KeyN', KEY_LEGENDS.KeyN),
      createKeyDef('KeyM', KEY_LEGENDS.KeyM),
      createKeyDef('Comma', KEY_LEGENDS.Comma),
      createKeyDef('Period', KEY_LEGENDS.Period),
      createKeyDef('Slash', KEY_LEGENDS.Slash, { showDualState: true }),

      MAC_SPECIAL_KEYS['ShiftRight'],
    ],
    MAC_MODIFIER_ROW_ALTGR,
  ],
  rightPanel: RIGHT_PANEL_ROWS,
};
