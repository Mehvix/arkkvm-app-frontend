import type { KeyboardLayout, KeyLegends } from '../../keyboard-types';
/**
 * @Author: zhanglei
 * @Date: 2026-03-30 15:18:35
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-08-06 21:30:03
 */
import { createKeyDef } from '../../merge';
import { FUNCTION_KEYS_ROW, MAC_MODIFIER_ROW_ALTGR, MAC_SPECIAL_KEYS } from '../../rows';

import { nlBEMeta as LAYOUT_META } from '../meta';

const KEY_LEGENDS: Record<string, KeyLegends> = {
  Backquote: { base: '<', shift: '>', altGr: '≤', 'shift+altGr': '≥' },
  Digit1: { base: '&', shift: '1', altGr: '', 'shift+altGr': '´' },
  Digit2: { base: 'é', shift: '2', altGr: 'ë', 'shift+altGr': '„' },
  Digit3: { base: '"', shift: '3', altGr: '“', 'shift+altGr': '”' },
  Digit4: { base: '\'', shift: '4', altGr: '‘', 'shift+altGr': '’' },
  Digit5: { base: '(', shift: '5', altGr: '{', 'shift+altGr': '[' },
  Digit6: { base: '§', shift: '6', altGr: '¶', 'shift+altGr': 'å' },
  Digit7: { base: 'è', shift: '7', altGr: '«', 'shift+altGr': '»' },
  Digit8: { base: '!', shift: '8', altGr: '¡', 'shift+altGr': 'Û' },
  Digit9: { base: 'ç', shift: '9', altGr: 'Ç', 'shift+altGr': 'Á' },
  Digit0: { base: 'à', shift: '0', altGr: 'ø', 'shift+altGr': 'Ø' },
  Minus: { base: ')', shift: '°', altGr: '}', 'shift+altGr': ']' },
  Equal: { base: '-', shift: '_', altGr: '—', 'shift+altGr': '–' },
  KeyQ: { base: 'a', shift: 'A', altGr: 'æ', 'shift+altGr': 'Æ' },
  KeyW: { base: 'z', shift: 'Z', altGr: 'Â', 'shift+altGr': 'Å' },
  KeyE: { altGr: 'ê', 'shift+altGr': 'Ê' },
  KeyR: { altGr: '®', 'shift+altGr': '‚' },
  KeyT: { altGr: '†', 'shift+altGr': '™' },
  KeyY: { altGr: 'Ú', 'shift+altGr': 'Ÿ' },
  KeyU: { altGr: 'º', 'shift+altGr': 'ª' },
  KeyI: { altGr: 'î', 'shift+altGr': '¨' },
  KeyO: { altGr: 'œ', 'shift+altGr': 'Œ' },
  KeyP: { altGr: 'π', 'shift+altGr': '∏' },
  BracketLeft: { base: '^', shift: '¨', altGr: 'ô', 'shift+altGr': 'Ô' },
  BracketRight: { base: '$', shift: '*', altGr: '€', 'shift+altGr': '¥' },
  Backslash: { base: 'µ', shift: '£', altGr: '@', 'shift+altGr': '#' },
  KeyA: { base: 'q', shift: 'Q', altGr: '‡', 'shift+altGr': 'Ω' },
  KeyS: { altGr: 'Ò', 'shift+altGr': 'Σ' },
  KeyD: { altGr: '∂', 'shift+altGr': '∆' },
  KeyF: { altGr: 'ƒ', 'shift+altGr': '·' },
  KeyG: { altGr: 'ﬁ', 'shift+altGr': 'ﬂ' },
  KeyH: { altGr: 'Ì', 'shift+altGr': 'Î' },
  KeyJ: { altGr: 'Ï', 'shift+altGr': 'Í' },
  KeyK: { altGr: 'È', 'shift+altGr': 'Ë' },
  KeyL: { altGr: '¬', 'shift+altGr': '|' },
  Semicolon: { base: 'm', shift: 'M', altGr: 'µ', 'shift+altGr': 'Ó' },
  Quote: { base: 'ù', shift: '%', altGr: 'Ù', 'shift+altGr': '‰' },
  KeyZ: { base: 'w', shift: 'W', altGr: '‹', 'shift+altGr': '›' },
  KeyX: { altGr: '≈', 'shift+altGr': '⁄' },
  KeyC: { altGr: '©', 'shift+altGr': '¢' },
  KeyV: { altGr: '◊', 'shift+altGr': '√' },
  KeyB: { altGr: 'ß', 'shift+altGr': '∫' },
  KeyN: { altGr: '~', 'shift+altGr': 'ı' },
  KeyM: { base: ',', shift: '?', altGr: '∞', 'shift+altGr': '¿' },
  Comma: { base: ';', shift: '.', altGr: '…', 'shift+altGr': '•' },
  Period: { base: ':', shift: '/', altGr: '÷', 'shift+altGr': '\\' },
  Slash: { base: '=', shift: '+', altGr: '≠', 'shift+altGr': '±' },
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
      createKeyDef('Backspace', undefined, { width: 1.5 }),
    ],
    // AZERTY row: Tab + A Z E R T Y...
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
    // Caps row: Q S D F...
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
    // Shift row: W X C V...
    [
      MAC_SPECIAL_KEYS['ShiftLeft'],
      createKeyDef('KeyZ', KEY_LEGENDS.KeyZ),
      createKeyDef('KeyX', KEY_LEGENDS.KeyX),
      createKeyDef('KeyC', KEY_LEGENDS.KeyC),
      createKeyDef('KeyV', KEY_LEGENDS.KeyV),
      createKeyDef('KeyB', KEY_LEGENDS.KeyB),
      createKeyDef('KeyN', KEY_LEGENDS.KeyN),
      createKeyDef('KeyM', KEY_LEGENDS.KeyM, { showDualState: true }),
      createKeyDef('Comma', KEY_LEGENDS.Comma),
      createKeyDef('Period', KEY_LEGENDS.Period),
      createKeyDef('Slash', KEY_LEGENDS.Slash),
      MAC_SPECIAL_KEYS['ShiftRight'],
    ],
    // Bottom row
    MAC_MODIFIER_ROW_ALTGR,
  ],
};
