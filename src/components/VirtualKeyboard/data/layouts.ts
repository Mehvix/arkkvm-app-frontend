/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-11-03 17:46:00
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-11-03 17:46:00
 */
/**
 * Keyboard layout configurations
 * Keyboard layout configuration
 */

import type { KeyRow } from './keyboard-types';
import {
    arrowKeys,
    asdfKeys,
    functionKeys,
    macSpecialKeys,
    navKeys,
    numberKeys,
    qwertyKeys,
    windSpecialKeys,
    zxcvKeys,
} from './rows';

export interface KeyboardLayout {
  name: string
  displayName: string
  keyRows: KeyRow[]
  specialKeys: KeyRow
  navKeys: KeyRow
  arrowKeys: KeyRow
}

export const KEYBOARD_LAYOUTS: Record<string, KeyboardLayout> = {
  windows: {
    name: 'windows',
    displayName: 'Windows',
    keyRows: [functionKeys, numberKeys, qwertyKeys, asdfKeys, zxcvKeys],
    specialKeys: windSpecialKeys,
    navKeys,
    arrowKeys,
  },
  apple: {
    name: 'apple',
    displayName: 'Mac',
    keyRows: [
      functionKeys,
      numberKeys.map(key => ({ ...key, label: key.appleLabel || key.label })),
      qwertyKeys.map(key => ({ ...key, label: key.appleLabel || key.label })),
      asdfKeys.map(key => ({ ...key, label: key.appleLabel || key.label })),
      zxcvKeys.map(key => ({ ...key, label: key.appleLabel || key.label })),
    ],
    specialKeys: macSpecialKeys,
    navKeys: navKeys.map(key => ({
      ...key,
      label: key.appleLabel || key.label,
    })),
    arrowKeys: arrowKeys.map(key => ({
      ...key,
      label: key.appleLabel || key.label,
    })),
  },
};

export const getKeyboardLayout = (layoutName: string): KeyboardLayout => {
  return KEYBOARD_LAYOUTS[layoutName] || KEYBOARD_LAYOUTS.windows;
};
