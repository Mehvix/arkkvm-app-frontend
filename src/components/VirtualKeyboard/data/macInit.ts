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
import {
  FUNCTION_KEYS_ROW,
  MAC_MODIFIER_ROW,
  MAC_SPECIAL_KEYS,
  RIGHT_PANEL_ROWS,
} from '../../rows';
import { meta as LAYOUT_META } from './meta';

const FR_FUNCTION_KEYS_ROW = [createKeyDef('Escape', {}), ...FUNCTION_KEYS_ROW.slice(1)];

export const macLayout: KeyboardLayout = {
  id: LAYOUT_META.id,
  name: LAYOUT_META.name,
  rows: [
    FR_FUNCTION_KEYS_ROW,
    // Number row
    [
      createKeyDef('Backquote', { altGr: '', 'shift+altGr': '' }),
      createKeyDef('Digit1', {shift: '',  caps: '1', altGr: '', 'shift+altGr': '' }),
      createKeyDef('Digit2', {shift: '',  caps: '2', altGr: '', 'shift+altGr': '' }),
      createKeyDef('Digit3', {shift: '',  caps: '3', altGr: '', 'shift+altGr': '' }),
      createKeyDef('Digit4', {shift: '',  caps: '4', altGr: '', 'shift+altGr': '' }),
      createKeyDef('Digit5', {shift: '',  caps: '5', altGr: '', 'shift+altGr': '' }),
      createKeyDef('Digit6', {shift: '',  caps: '6', altGr: '', 'shift+altGr': '' }),
      createKeyDef('Digit7', {shift: '',  caps: '7', altGr: '', 'shift+altGr': '' }),
      createKeyDef('Digit8', {shift: '',  caps: '8', altGr: '', 'shift+altGr': '' }),
      createKeyDef('Digit9', {shift: '',
        caps: '9',
        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('Digit0', { caps: '0', shift: '', altGr: '', 'shift+altGr': '' }),
      createKeyDef('Minus', {
        caps: "'",
        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('Equal', { caps: '+', altGr: '', 'shift+altGr': '' }),
      createKeyDef('Backspace', {}),
    ],
    // Top letter row
    [
      MAC_SPECIAL_KEYS['Tab'],
      createKeyDef('KeyQ', {
        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyW', {
        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyE', {

        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyR', {

        altGr: '',
      }),
      createKeyDef('KeyT', {
        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyY', {
        base: 'y',
        shift: 'Y',
        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyU', {
        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyI', {

        altGr: '',
      }),
      createKeyDef('KeyO', {
        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyP', {
        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('BracketLeft', { base: '',shift: '', caps: '', altGr: '', 'shift+altGr': '' }),
      createKeyDef('BracketRight', { base: '',shift: '', caps: '', altGr: '', 'shift+altGr': '' }),
      createKeyDef('Backslash', { base: '',shift: '', caps: '', altGr: '', 'shift+altGr': '' }),
    ],
    // Home row
    [
      MAC_SPECIAL_KEYS['CapsLock'],

      createKeyDef('KeyA', {

        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyS', {

        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyD', {

        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyF', {

        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyG', {

        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyH', {

        altGr: '',
      }),
      createKeyDef('KeyJ', {

        altGr: '',
      }),
      createKeyDef('KeyK', {

        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyL', {

        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('Semicolon', { base: '',shift: '', caps: '', altGr: '', 'shift+altGr': '' }, { showDualState: false }),
      createKeyDef('Quote', { base: '',shift: '', caps: '', altGr: '', 'shift+altGr': '' }),

      MAC_SPECIAL_KEYS['Enter'],
    ],
    // Bottom letter row
    [
      MAC_SPECIAL_KEYS['ShiftLeft'],
      // createKeyDef(
      //   'IntlBackslash',
      //   { base: '<', shift: '>' },
      //   { showDualState: true }
      // ),
      createKeyDef('KeyZ', {

        altGr: '',
      }),
      createKeyDef('KeyX', {

        altGr: '',
        'shift+altGr': '',
      }),
      createKeyDef('KeyC', {

        altGr: '',
      }),
      createKeyDef('KeyV', {

        altGr: '',
      }),
      createKeyDef('KeyB', {

        altGr: '',
      }),
      createKeyDef('KeyN', {

        altGr: '',
      }),
      createKeyDef('KeyM', {
        altGr: '',
        'shift+altGr': ''
      }),
      createKeyDef('Comma', {
        base: '',
        shift: '',
        caps: ',',
        altGr: '',
        'shift+altGr': ''
      }),
      createKeyDef('Period', {
        base: '',
        shift: '',
        caps: '.',
        altGr: '',
        'shift+altGr': ''
      }),
      createKeyDef('Slash', { base: '',shift: '', caps: '', altGr: '', 'shift+altGr': '' }, { showDualState: true }),

      MAC_SPECIAL_KEYS['ShiftRight'],
    ],
    MAC_MODIFIER_ROW,
  ],
  rightPanel: RIGHT_PANEL_ROWS,
};
