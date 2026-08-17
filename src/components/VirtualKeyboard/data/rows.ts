/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-11-03 17:46:00
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-08-06 17:18:36
 */
/*
 * Virtual Keyboard key rows
 * Centralized config for reuse and easier maintenance.
 */
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

export const WINDOWS_MODIFIER_ROW_FN_ALTGR = [
  createKeyDef('ControlLeft'),
  createKeyDef('Fn', { base: 'Fn' }),
  createKeyDef('MetaLeft'),
  createKeyDef('AltLeft'),
  createKeyDef('Space', undefined, { width: 7 }),
  createKeyDef('AltGr'),
  createKeyDef('ControlRight'),
];

export const WINDOWS_MODIFIER_ROW_ALTGR = [
  createKeyDef('ControlLeft'),
  createKeyDef('MetaLeft'),
  createKeyDef('AltLeft'),
  createKeyDef('Space', undefined, { width: 7 }),
  createKeyDef('AltGr'),
  createKeyDef('MetaRight'),
  createKeyDef('ControlRight'),
  createKeyDef('ContextMenu'),
];

export const MAC_MODIFIER_ROW = [
  createKeyDef('ControlLeft', { base: '⌃' }),
  createKeyDef('AltLeft', { base: '⌥' }), // Option key
  createKeyDef('MetaLeft', { base: '⌘' }), // Cmd key
  createKeyDef('Space', undefined, { width: 7 }),
  createKeyDef('MetaRight', { base: '⌘' }), // Cmd key
  createKeyDef('AltRight', { base: '⌥' }), // Option key
];

// Mac modifier row variant for layouts that use AltGr (e.g. es-ES, pt-PT)
export const MAC_MODIFIER_ROW_ALTGR = [
  createKeyDef('ControlLeft', { base: '⌃' }),
  createKeyDef('AltLeft', { base: '⌥' }), // Option key
  createKeyDef('MetaLeft', { base: '⌘' }), // Cmd key
  createKeyDef('Space', undefined, { width: 7 }),
  createKeyDef('MetaRight', { base: '⌘' }), // Cmd key
  createKeyDef('AltGr', { base: '⌥' }), // AltGr for special characters
];

// Mac special keys with proper symbols
export const MAC_SPECIAL_KEYS = {
  Tab: createKeyDef('Tab', { base: '⇥' }), // Tab key
  CapsLock: createKeyDef('CapsLock', { base: '⇪' }), // Caps Lock key
  ShiftLeft: createKeyDef('ShiftLeft', { base: '⇧' }, { width: 1.5 }), // Left Shift key
  ShiftRight: createKeyDef('ShiftRight', { base: '⇧' }, { width: 1.5 }), // Right Shift key
  Backquote: createKeyDef('Backquote', { base: '~' }), // Tilde key
  Enter: createKeyDef('Enter', { base: '↩' }), // Enter key
};
// Right panel keys (common across all keyboard layouts)
export const RIGHT_PANEL_ROWS = [
  [createKeyDef('Insert'), createKeyDef('Home'), createKeyDef('PageUp')],
  [createKeyDef('Delete'), createKeyDef('End'), createKeyDef('PageDown')],
  [createKeyDef('PrintScreen'), createKeyDef('ScrollLock'), createKeyDef('Pause')],
  [createKeyDef('__vk_spacer__placeholder1', { base: '' })],
  [
    createKeyDef('__vk_spacer__arrowUpLeft', { base: '' }),
    createKeyDef('ArrowUp', { base: '⌃' }),
    createKeyDef('__vk_spacer__arrowUpRight', { base: '' }),
  ],
  [
    createKeyDef('ArrowLeft', { base: '‹' }),
    createKeyDef('ArrowDown', { base: '⌄' }),
    createKeyDef('ArrowRight', { base: '›' }),
  ],
];
