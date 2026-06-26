/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-11-03 17:46:00
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-06 19:24:55
 */
/*
 * Virtual Keyboard key rows
 * Centralized config for reuse and easier maintenance.
 */
import type { KeyRow } from './keyboard-types';
import { createKeyDef } from './merge';

// Function keys row: F1-F12 (common across all keyboard layouts)
export const FUNCTION_KEYS_ROW = [
  createKeyDef('Escape'),
  createKeyDef('F1'),
  createKeyDef('F2'),
  createKeyDef('F3'),
  createKeyDef('F4'),
  createKeyDef('F5'),
  createKeyDef('F6'),
  createKeyDef('F7'),
  createKeyDef('F8'),
  createKeyDef('F9'),
  createKeyDef('F10'),
  createKeyDef('F11'),
  createKeyDef('F12'),
];

export const WINDOWS_MODIFIER_ROW = [
      createKeyDef('ControlLeft'),
      createKeyDef('MetaLeft'),
      createKeyDef('AltLeft'),
      createKeyDef('Space', undefined, { width: 7 }),
      createKeyDef('AltRight'),
      createKeyDef('ControlRight'),

      createKeyDef('ContextMenu'),
    ];



export const windowsKeys: KeyRow = [
  // functionKeys,
  // numberKeys,
  // qwertyKeys,
  // asdfKeys,
  // zxcvKeys,
];



// Right panel keys (common across all keyboard layouts)
export const RIGHT_PANEL_ROWS = [
  [createKeyDef('Insert'), createKeyDef('Home'), createKeyDef('PageUp')],
  [createKeyDef('Delete'), createKeyDef('End'), createKeyDef('PageDown')],
  [
    createKeyDef('PrintScreen'),
    createKeyDef('ScrollLock'),
    createKeyDef('Pause'),
  ],
  [    createKeyDef('__vk_spacer__placeholder1', { base: '' })],
  [
    createKeyDef('__vk_spacer__arrowUpLeft', { base: '' }),
    createKeyDef('ArrowUp', { base: '∧' }),
    createKeyDef('__vk_spacer__arrowUpRight', { base: '' }),
  ],
  [
    createKeyDef('ArrowLeft', { base: '<' }),
    createKeyDef('ArrowDown', { base: '∨' }),
    createKeyDef('ArrowRight', { base: '>' }),
  ],
];
