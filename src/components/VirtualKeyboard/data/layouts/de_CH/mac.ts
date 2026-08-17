/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-03-30 15:18:35
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-08-06 20:27:11
 */
import type { KeyboardLayout, KeyLegends } from '../../keyboard-types';
import { createKeyDef } from '../../merge';
import { FUNCTION_KEYS_ROW, MAC_MODIFIER_ROW_ALTGR, MAC_SPECIAL_KEYS } from '../../rows';
import { deCHMeta as LAYOUT_META } from '../meta';

const KEY_LEGENDS: Record<string, KeyLegends> = {
  Backquote: {
    base: '<',
    shift: '>',
    altGr: '≤',
    'shift+altGr': '≥',
  },
  Digit1: { shift: '+', caps: '1', altGr: '±', 'shift+altGr': '∞' },
  Digit2: { shift: '"', caps: '2', altGr: '“', 'shift+altGr': '”' },
  Digit3: { shift: '*', caps: '3', altGr: '#', 'shift+altGr': '‹' },
  Digit4: { shift: 'ç', caps: '4', altGr: 'Ç', 'shift+altGr': '⁄' },
  Digit5: { shift: '%', caps: '5', altGr: '[', 'shift+altGr': '[' },
  Digit6: { shift: '&', caps: '6', altGr: ']', 'shift+altGr': ']' },
  Digit7: { shift: '/', caps: '7', altGr: '|', 'shift+altGr': '\\' },
  Digit8: { shift: '(', caps: '8', altGr: '{', 'shift+altGr': 'Ò' },
  Digit9: { shift: ')', caps: '9', altGr: '}', 'shift+altGr': 'Ô' },
  Digit0: { shift: '=', caps: '0', altGr: '≠', 'shift+altGr': 'Ú' },
  Minus: {
    base: '\'',
    shift: '?',
    altGr: '¿',
    'shift+altGr': '',
  },
  Equal: { base: '^', shift: '`', altGr: '´', 'shift+altGr': '^' },
  KeyQ: {
    altGr: 'œ',
    'shift+altGr': 'Œ',
  },
  KeyW: {
    altGr: '∑',
    'shift+altGr': 'Á',
  },
  KeyE: {
    altGr: '€',
    'shift+altGr': 'Ë',
  },
  KeyR: {
    altGr: '®',
    'shift+altGr': 'È',
  },
  KeyT: {
    altGr: '†',
    'shift+altGr': 'Î',
  },
  KeyY: {
    base: 'z',
    shift: 'Z',
    altGr: 'Ω',
    'shift+altGr': 'Í',
  },
  KeyU: {
    altGr: '°',
    'shift+altGr': 'Ù',
  },
  KeyI: {
    altGr: '¡',
    'shift+altGr': 'ı',
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
    base: 'ü',
    shift: 'è',
    altGr: '§',
    'shift+altGr': 'ÿ',
  },
  BracketRight: {
    base: '¨',
    shift: '!',
    altGr: '‘',
    'shift+altGr': '’',
  },
  Backslash: {
    base: '$',
    shift: '£',
    altGr: '¶',
    'shift+altGr': '•',
  },
  KeyA: {
    altGr: 'å',
    'shift+altGr': 'Å',
  },
  KeyS: {
    altGr: 'ß',
    'shift+altGr': 'ﬁ',
  },
  KeyD: {
    altGr: '∂',
    'shift+altGr': 'ﬂ',
  },
  KeyF: {
    altGr: 'ƒ',
    'shift+altGr': '‡',
  },
  KeyG: {
    altGr: '@',
    'shift+altGr': '‚',
  },
  KeyH: {
    altGr: 'ª',
    'shift+altGr': '·',
  },
  KeyJ: {
    altGr: 'º',
    'shift+altGr': '˜',
  },
  KeyK: {
    altGr: '∆',
    'shift+altGr': '¯',
  },
  KeyL: {
    altGr: '¬',
    'shift+altGr': 'ˆ',
  },
  Semicolon: {
    base: 'ö',
    shift: 'é',
    caps: 'Ö',
    'shift+caps': 'É',
    altGr: '¢',
    'shift+altGr': '˘',
  },
  Quote: {
    base: 'ä',
    shift: 'à',
    caps: 'Ä',
    'shift+caps': 'À',
    altGr: 'æ',
    'shift+altGr': 'Æ',
  },
  KeyZ: {
    base: 'y',
    shift: 'Y',
    altGr: '¥',
    'shift+altGr': 'Ÿ',
  },
  KeyX: {
    altGr: '≈',
    'shift+altGr': '™',
  },
  KeyC: {
    altGr: '©',
  },
  KeyV: {
    altGr: '√',
    'shift+altGr': '◊',
  },
  KeyB: {
    altGr: '∫',
  },
  KeyN: {
    altGr: '~',
    'shift+altGr': '˙',
  },
  KeyM: {
    altGr: 'µ',
    'shift+altGr': '˚',
  },
  Comma: {
    base: ',',
    shift: ';',
    altGr: '«',
    'shift+altGr': '»',
  },
  Period: {
    base: '.',
    shift: ':',
    altGr: '…',
    'shift+altGr': '÷',
  },
  Slash: { base: '-', shift: '_', altGr: '–', 'shift+altGr': '—' },
};
export const macLayout: KeyboardLayout = {
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
      createKeyDef('Backspace'),
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
      createKeyDef('Semicolon', KEY_LEGENDS.Semicolon),
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
};
