/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-03-30 15:18:35
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-07 19:39:22
 */
import type { KeyboardLayout } from '../../keyboard-types';
import { createKeyDef } from '../../merge';
import { FUNCTION_KEYS_ROW, RIGHT_PANEL_ROWS } from '../../rows';
const FR_FR_LAYOUT_ID = 'fr-FR-azerty';
const FR_FR_LAYOUT_NAME = 'Français (France) - AZERTY';
const FR_FUNCTION_KEYS_ROW = [
  createKeyDef('Escape', { base: 'Éch' }),
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
  id: FR_FR_LAYOUT_ID,
  name: FR_FR_LAYOUT_NAME,
  rows: [
    FR_FUNCTION_KEYS_ROW,
    // Number row
    [
      createKeyDef('Backquote', {
        base: '²',
        shift: '',
      }),
      createKeyDef('Digit1', {
        base: '&',
        shift: '1',
      }),
      createKeyDef('Digit2', {
        base: 'é',
        shift: '2',
        altGr: '~',
      }),
      createKeyDef('Digit3', {
        base: '"',
        shift: '3',
        altGr: '#',
      }),
      createKeyDef('Digit4', {
        base: '\'',
        shift: '4',
        altGr: '{',
      }),
      createKeyDef('Digit5', {
        base: '(',
        shift: '5',
        altGr: '[',
      }),
      createKeyDef('Digit6', {
        base: '-',
        shift: '6',
        altGr: '|',
      }),
      createKeyDef('Digit7', {
        base: 'è',
        shift: '7',
        altGr: '`',
      }),
      createKeyDef('Digit8', {
        base: '_',
        shift: '8',
        altGr: '\\',
      }),
      createKeyDef('Digit9', {
        base: 'ç',
        shift: '9',
        altGr: '^',
      }),
      createKeyDef('Digit0', {
        base: 'à',
        shift: '0',
        altGr: '@',
      }),
      createKeyDef('Minus', {
        base: ')',
        shift: '°',
        altGr: ']',
      }),
      createKeyDef('Equal', {
        base: '=',
        shift: '+',
        altGr: '}',
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
        base: 'a',
        shift: 'A',

      }),
      createKeyDef('KeyW', {
        base: 'z',
        shift: 'Z',

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
        base: '^',
        shift: '¨',
      }),
      createKeyDef('BracketRight', {
        base: '$',
        shift: '£',
        altGr: '¤',
      }),
    ],
    // Home row
    [
      createKeyDef('CapsLock', {
        base: 'Verr. maj',
      }),
      createKeyDef('KeyA', {
        base: 'q',
        shift: 'Q',

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
      createKeyDef('Semicolon', { base: 'm', shift: 'M', }, { showDualState: false }),
      createKeyDef('Quote', {
        base: 'ù',
        shift: '%',
      }),
      createKeyDef('Backslash', { base: '*', shift: 'µ' }, { showDualState: true }),
      createKeyDef('Enter', {
        base: 'Enter',
      }),
    ],
    // Bottom letter row
    [
      createKeyDef('ShiftLeft', {
        base: 'Maj',
      }),
      createKeyDef('IntlBackslash', { base: '<', shift: '>' ,caps:'<'}, { showDualState: true }),
      createKeyDef('KeyZ', {
        base: 'w',
        shift: 'W',

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
      createKeyDef('KeyM', { base: ',', shift: '?' }, { showDualState: true }),
      createKeyDef('Comma', {
        base: ';',
        shift: '.',
      }),
      createKeyDef('Period', {
        base: ':',
        shift: '/',
      }),
      createKeyDef('Slash', { base: '!', shift: '§' }, { showDualState: true }),
      createKeyDef('ShiftRight', {
        base: 'Maj',
      }),
    ],
    FR_WINDOWS_MODIFIER_ROW,
  ],
  rightPanel: RIGHT_PANEL_ROWS,
};
