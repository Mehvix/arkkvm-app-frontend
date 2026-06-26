/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-03-30 15:18:35
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-09 11:46:56
 */
import type { KeyboardLayout } from '../../keyboard-types';
import { createKeyDef } from '../../merge';
import { FUNCTION_KEYS_ROW, RIGHT_PANEL_ROWS } from '../../rows';
import { meta as LAYOUT_META } from './meta';

const FR_FUNCTION_KEYS_ROW = [
  createKeyDef('Escape', { base: 'Esc' }),
  ...FUNCTION_KEYS_ROW.slice(1),
];
const FR_WINDOWS_MODIFIER_ROW = [
  createKeyDef('ControlLeft', { base: 'Ctrl' }),
  createKeyDef('MetaLeft', { base: '⊞' }),
  createKeyDef('AltLeft', { base: 'Alt' }),
  createKeyDef('Space', undefined, { width: 7 }),
  createKeyDef('AltGr', { base: 'AltGr' }),
  createKeyDef('MetaRight', { base: '⊞' }),
  createKeyDef('ControlRight', { base: 'Ctrl' }),
  createKeyDef('ContextMenu', { base: '☰' }),
];
export const winLayout: KeyboardLayout = {
  id: LAYOUT_META.id,
  name: LAYOUT_META.name,
  rows: [
    FR_FUNCTION_KEYS_ROW,
    // Number row
    [
      createKeyDef('Backquote', {
        base: 'º',
        shift: 'ª',
        caps: 'º',
        altGr: '\\',
      }),
      createKeyDef('Digit1', {
        base: '1',
        shift: '!',
        caps: '1',
        altGr: '|',
      }),
      createKeyDef('Digit2', {
        base: '2',
        shift: '"',
        caps: '2',
        altGr: '@',
      }),
      createKeyDef('Digit3', {
        base: '3',
        shift: '·',
        caps: '3',
        altGr: '#',
      }),
      createKeyDef('Digit4', {
        base: '4',
        shift: '$',
        caps: '4',
        altGr: '~',
      }),
      createKeyDef('Digit5', {
        base: '5',
        shift: '%',
        caps: '5',
        altGr: '€',
      }),
      createKeyDef('Digit6', {
        base: '6',
        shift: '&',
        caps: '6',
        altGr: '¬',
      }),
      createKeyDef('Digit7', {
        base: '7',
        shift: '/',
        caps: '7',
        altGr: '{',
      }),
      createKeyDef('Digit8', {
        base: '8',
        shift: '(',
        caps: '8',
        altGr: '[',
      }),
      createKeyDef('Digit9', {
        base: '9',
        shift: ')',
        caps: '9',
        altGr: ']',
      }),
      createKeyDef('Digit0', {
        base: '0',
        shift: '=',
        caps: '0',
        altGr: '}',
      }),
      createKeyDef('Minus', {
        base: '\'',
        shift: '?',
        caps: '\'',
      }),
      createKeyDef('Equal', {
        base: '¡',
        shift: '¿',
        caps: '¡',
      }),
      createKeyDef('Backspace', {
        base: '⌫',
      }),
    ],
    // Top letter row
    [
      createKeyDef('Tab', {
        base: 'Tab',
      }),
      createKeyDef('KeyQ', {
        base: 'q',
        shift: 'Q',
      }),
      createKeyDef('KeyW', {
        base: 'w',
        shift: 'W',
      }),
      createKeyDef('KeyE', {
        base: 'e',
        shift: 'E',
        altGr: '€',
      }),
      createKeyDef('KeyR', {
        base: 'r',
        shift: 'R',
      }),
      createKeyDef('KeyT', {
        base: 't',
        shift: 'T',
      }),
      createKeyDef('KeyY', {
        base: 'y',
        shift: 'Y',
      }),
      createKeyDef('KeyU', {
        base: 'u',
        shift: 'U',
      }),
      createKeyDef('KeyI', {
        base: 'i',
        shift: 'I',
      }),
      createKeyDef('KeyO', {
        base: 'o',
        shift: 'O',
      }),
      createKeyDef('KeyP', {
        base: 'p',
        shift: 'P',
      }),
      createKeyDef('BracketLeft', {
        base: '`',
        shift: '^',
        caps: '`',
      }),
      createKeyDef('BracketRight', {
        base: '+',
        shift: '*',
        caps: '+',
      }),
    ],
    // Home row
    [
      createKeyDef('CapsLock', {
        base: 'Bloq May',
      }),
      createKeyDef('KeyA', {
        base: 'a',
        shift: 'A',
      }),
      createKeyDef('KeyS', {
        base: 's',
        shift: 'S',
      }),
      createKeyDef('KeyD', {
        base: 'd',
        shift: 'D',
      }),
      createKeyDef('KeyF', {
        base: 'f',
        shift: 'F',
      }),
      createKeyDef('KeyG', {
        base: 'g',
        shift: 'G',
      }),
      createKeyDef('KeyH', {
        base: 'h',
        shift: 'H',
      }),
      createKeyDef('KeyJ', {
        base: 'j',
        shift: 'J',
      }),
      createKeyDef('KeyK', {
        base: 'k',
        shift: 'K',
      }),
      createKeyDef('KeyL', {
        base: 'l',
        shift: 'L',
      }),
      createKeyDef(
        'Semicolon',
        { base: 'ñ', shift: 'Ñ' },
        { showDualState: false }
      ),
      createKeyDef('Quote', {
        base: '´',
        shift: '¨',
        caps: '´',
      }),
      createKeyDef('Backslash', { base: 'ç', shift: 'Ç' }),
      createKeyDef('Enter', {
        base: 'Entrar',
      }),
    ],
    // Bottom letter row
    [
      createKeyDef('ShiftLeft', {
        base: 'Mayús',
      }),
      createKeyDef(
        'IntlBackslash',
        { base: '<', shift: '>' },
        { showDualState: true }
      ),
      createKeyDef('KeyZ', {
        base: 'z',
        shift: 'Z',
      }),
      createKeyDef('KeyX', {
        base: 'x',
        shift: 'X',
      }),
      createKeyDef('KeyC', {
        base: 'c',
        shift: 'C',
      }),
      createKeyDef('KeyV', {
        base: 'v',
        shift: 'V',
      }),
      createKeyDef('KeyB', {
        base: 'b',
        shift: 'B',
      }),
      createKeyDef('KeyN', {
        base: 'n',
        shift: 'N',
      }),
      createKeyDef('KeyM', { base: 'm', shift: 'M' }),
      createKeyDef('Comma', {
        base: ',',
        shift: ';',
        caps: ',',
      }),
      createKeyDef('Period', {
        base: '.',
        shift: ':',
        caps: '.',
      }),
      createKeyDef('Slash', { base: '-', shift: '_', caps: '-' }, { showDualState: true }),
      createKeyDef('ShiftRight', {
        base: 'Mayús',
      }),
    ],
    FR_WINDOWS_MODIFIER_ROW,
  ],
  rightPanel: RIGHT_PANEL_ROWS,
};
