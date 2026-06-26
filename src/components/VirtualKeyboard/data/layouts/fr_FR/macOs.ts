/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-03-30 15:18:35
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-06 20:35:31
 */
import type { KeyboardLayout } from '../../keyboard-types';
import { createKeyDef } from '../../merge';
import { FUNCTION_KEYS_ROW, RIGHT_PANEL_ROWS, WINDOWS_MODIFIER_ROW } from '../../rows';

const FR_FR_LAYOUT_ID = 'fr-FR-azerty';
const FR_FR_LAYOUT_NAME = 'Français (France) - AZERTY';
const FR_FUNCTION_KEYS_ROW = [
  createKeyDef('Escape', { base: 'Éch' }),
  ...FUNCTION_KEYS_ROW.slice(1),
];

export const macLayout: KeyboardLayout = {
  id: FR_FR_LAYOUT_ID,

  name: FR_FR_LAYOUT_NAME,

  rows: [
    FR_FUNCTION_KEYS_ROW,

    // Number row

    [
      createKeyDef('Backquote', {
        base: '<',

        shift: '>',
        caps:'<'
      }),

      createKeyDef('Digit1', {
        base: '&',

        shift: '1',
      }),

      createKeyDef('Digit2', {
        base: 'é',

        shift: '2',

        alt: '~',
      }),

      createKeyDef('Digit3', {
        base: '"',

        shift: '3',

        alt: '#',
      }),

      createKeyDef('Digit4', {
        base: '\'',

        shift: '4',

        alt: '{',
      }),

      createKeyDef('Digit5', {
        base: '(',

        shift: '5',

        alt: '[',
      }),

      createKeyDef('Digit6', {
        base: '§',

        shift: '6',

        alt: '|',
      }),

      createKeyDef('Digit7', {
        base: 'è',

        shift: '7',

        alt: '`',
      }),

      createKeyDef('Digit8', {
        base: '!',

        shift: '8',

        alt: '\\',
      }),

      createKeyDef('Digit9', {
        base: 'ç',

        shift: '9',

        alt: '^',
      }),

      createKeyDef('Digit0', {
        base: 'à',

        shift: '0',

        alt: '@',
      }),

      createKeyDef('Minus', {
        base: ')',

        shift: '°',

        alt: ']',
      }),

      createKeyDef('Equal', {
        base: '-',

        shift: '_',

        alt: '}',
      }),

      createKeyDef('Backspace', {
        base: 'Backspace',
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

        caps: 'A',
      }),

      createKeyDef('KeyW', {
        base: 'z',

        shift: 'Z',

        caps: 'Z',
      }),

      createKeyDef('KeyE', {
        base: 'e',

        shift: 'E',

        caps: 'E',

        alt: '€',
      }),

      createKeyDef('KeyR', {
        base: 'r',

        shift: 'R',

        caps: 'R',
      }),

      createKeyDef('KeyT', {
        base: 't',

        shift: 'T',

        caps: 'T',
      }),

      createKeyDef('KeyY', {
        base: 'y',

        shift: 'Y',

        caps: 'Y',
      }),

      createKeyDef('KeyU', {
        base: 'u',

        shift: 'U',

        caps: 'U',
      }),

      createKeyDef('KeyI', {
        base: 'i',

        shift: 'I',

        caps: 'I',
      }),

      createKeyDef('KeyO', {
        base: 'o',

        shift: 'O',

        caps: 'O',
      }),

      createKeyDef('KeyP', {
        base: 'p',
        shift: 'P',
        caps: 'P',
      }),

      createKeyDef('BracketLeft', {
        base: '^',
        shift: '¨',
      }),

      createKeyDef('BracketRight', {
        base: '$',
        shift: '*',
        alt: '¤',
      }),
      createKeyDef('Backslash', {
        base: '`',
        shift: '£',
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

        caps: 'Q',
      }),

      createKeyDef('KeyS', {
        base: 's',

        shift: 'S',

        caps: 'S',
      }),

      createKeyDef('KeyD', {
        base: 'd',

        shift: 'D',

        caps: 'D',
      }),

      createKeyDef('KeyF', {
        base: 'f',

        shift: 'F',

        caps: 'F',
      }),

      createKeyDef('KeyG', {
        base: 'g',

        shift: 'G',

        caps: 'G',
      }),

      createKeyDef('KeyH', {
        base: 'h',

        shift: 'H',

        caps: 'H',
      }),

      createKeyDef('KeyJ', {
        base: 'j',

        shift: 'J',

        caps: 'J',
      }),

      createKeyDef('KeyK', {
        base: 'k',

        shift: 'K',

        caps: 'K',
      }),

      createKeyDef('KeyL', {
        base: 'l',

        shift: 'L',

        caps: 'L',
      }),

      createKeyDef('Semicolon', {
        base: 'm',

        shift: 'M',

        caps: 'M',
      }),

      createKeyDef('Quote', {
        base: 'ù',

        shift: '%',
      }),


      createKeyDef('Enter', {
        base: 'Enter',
      }),
    ],

    // Bottom letter row

    [
      createKeyDef('ShiftLeft', {
        base: 'Maj',
      }),
      createKeyDef('KeyZ', {
        base: 'w',

        shift: 'W',

        caps: 'W',
      }),

      createKeyDef('KeyX', {
        base: 'x',

        shift: 'X',

        caps: 'X',
      }),

      createKeyDef('KeyC', {
        base: 'c',

        shift: 'C',

        caps: 'C',
      }),

      createKeyDef('KeyV', {
        base: 'v',

        shift: 'V',

        caps: 'V',
      }),

      createKeyDef('KeyB', {
        base: 'b',

        shift: 'B',

        caps: 'B',
      }),

      createKeyDef('KeyN', {
        base: 'n',

        shift: 'N',

        caps: 'N',
      }),

      createKeyDef('KeyM', {
        base: ',',

        shift: '?',
      }),

      createKeyDef('Comma', {
        base: ';',

        shift: '.',
      }),

      createKeyDef('Period', {
        base: ':',

        shift: '/',
      }),

      createKeyDef('Slash', {
        base: '=',

        shift: '+',
      }),

      createKeyDef('ShiftRight', {
        base: 'Maj',
      }),
    ],

    WINDOWS_MODIFIER_ROW,
  ],
  rightPanel: RIGHT_PANEL_ROWS,
};
