/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-11-03 17:46:00
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-29 12:23:21
 */
/*
 * Virtual Keyboard key rows
 * Centralized config for reuse and easier maintenance.
 */
import type { KeyRow } from './keyboard-types'
import { createKeyDef } from './merge'

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
]

export const functionKeys: KeyRow = [
  { keyCode: 'Escape', label: 'Esc' },
  { keyCode: 'F1', label: 'F1' },
  { keyCode: 'F2', label: 'F2' },
  { keyCode: 'F3', label: 'F3' },
  { keyCode: 'F4', label: 'F4' },
  { keyCode: 'F5', label: 'F5' },
  { keyCode: 'F6', label: 'F6' },
  { keyCode: 'F7', label: 'F7' },
  { keyCode: 'F8', label: 'F8' },
  { keyCode: 'F9', label: 'F9' },
  { keyCode: 'F10', label: 'F10' },
  { keyCode: 'F11', label: 'F11' },
  { keyCode: 'F12', label: 'F12' },
]

export const numberKeys: KeyRow = [
  {
    keyCode: 'Backquote',
    label: ['~', '`'],
    appleLabel: ['~', '`'],
    showDualState: true,
  },
  {
    keyCode: 'Digit1',
    label: ['!', '1'],
    appleLabel: ['!', '1'],
    showDualState: true,
  },
  {
    keyCode: 'Digit2',
    label: ['@', '2'],
    appleLabel: ['@', '2'],
    showDualState: true,
  },
  {
    keyCode: 'Digit3',
    label: ['#', '3'],
    appleLabel: ['#', '3'],
    showDualState: true,
  },
  {
    keyCode: 'Digit4',
    label: ['$', '4'],
    appleLabel: ['$', '4'],
    showDualState: true,
  },
  {
    keyCode: 'Digit5',
    label: ['%', '5'],
    appleLabel: ['%', '5'],
    showDualState: true,
  },
  {
    keyCode: 'Digit6',
    label: ['^', '6'],
    appleLabel: ['^', '6'],
    showDualState: true,
  },
  {
    keyCode: 'Digit7',
    label: ['&', '7'],
    appleLabel: ['&', '7'],
    showDualState: true,
  },
  {
    keyCode: 'Digit8',
    label: ['*', '8'],
    appleLabel: ['*', '8'],
    showDualState: true,
  },
  {
    keyCode: 'Digit9',
    label: ['(', '9'],
    appleLabel: ['(', '9'],
    showDualState: true,
  },
  {
    keyCode: 'Digit0',
    label: [')', '0'],
    appleLabel: [')', '0'],
    showDualState: true,
  },
  {
    keyCode: 'Minus',
    label: ['_', '-'],
    appleLabel: ['_', '-'],
    showDualState: true,
  },
  {
    keyCode: 'Equal',
    label: ['+', '='],
    appleLabel: ['+', '='],
    showDualState: true,
  },
  { keyCode: 'Backspace', label: '←', width: 'auto', appleLabel: '⌫' },
]

export const qwertyKeys: KeyRow = [
  { keyCode: 'Tab', label: 'Tab', width: '60px', appleLabel: '⇥' },
  { keyCode: 'KeyQ', label: ['Q', 'q'], appleLabel: ['Q', 'q'] },
  { keyCode: 'KeyW', label: ['W', 'w'], appleLabel: ['W', 'w'] },
  { keyCode: 'KeyE', label: ['E', 'e'], appleLabel: ['E', 'e'] },
  { keyCode: 'KeyR', label: ['R', 'r'], appleLabel: ['R', 'r'] },
  { keyCode: 'KeyT', label: ['T', 't'], appleLabel: ['T', 't'] },
  { keyCode: 'KeyY', label: ['Y', 'y'], appleLabel: ['Y', 'y'] },
  { keyCode: 'KeyU', label: ['U', 'u'], appleLabel: ['U', 'u'] },
  { keyCode: 'KeyI', label: ['I', 'i'], appleLabel: ['I', 'i'] },
  { keyCode: 'KeyO', label: ['O', 'o'], appleLabel: ['O', 'o'] },
  { keyCode: 'KeyP', label: ['P', 'p'], appleLabel: ['P', 'p'] },
  {
    keyCode: 'BracketLeft',
    label: ['{', '['],
    appleLabel: ['{', '['],
    showDualState: true,
  },
  {
    keyCode: 'BracketRight',
    label: ['}', ']'],
    appleLabel: ['}', ']'],
    showDualState: true,
  },
  {
    keyCode: 'Backslash',
    label: ['|', '\\'],
    appleLabel: ['|', '\\'],
    showDualState: true,
  },
]

export const asdfKeys: KeyRow = [
  {
    keyCode: 'CapsLock',
    label: 'Caps',
    width: '140px',
    appleLabel: 'CapsLock',
  },
  { keyCode: 'KeyA', label: ['A', 'a'], appleLabel: ['A', 'a'] },
  { keyCode: 'KeyS', label: ['S', 's'], appleLabel: ['S', 's'] },
  { keyCode: 'KeyD', label: ['D', 'd'], appleLabel: ['D', 'd'] },
  { keyCode: 'KeyF', label: ['F', 'f'], appleLabel: ['F', 'f'] },
  { keyCode: 'KeyG', label: ['G', 'g'], appleLabel: ['G', 'g'] },
  { keyCode: 'KeyH', label: ['H', 'h'], appleLabel: ['H', 'h'] },
  { keyCode: 'KeyJ', label: ['J', 'j'], appleLabel: ['J', 'j'] },
  { keyCode: 'KeyK', label: ['K', 'k'], appleLabel: ['K', 'k'] },
  { keyCode: 'KeyL', label: ['L', 'l'], appleLabel: ['L', 'l'] },
  {
    keyCode: 'Semicolon',
    label: [':', ';'],
    appleLabel: [':', ';'],
    showDualState: true,
  },
  {
    keyCode: 'Quote',
    label: ['"', "'"],
    appleLabel: ['"', "'"],
    showDualState: true,
  },
  { keyCode: 'Enter', label: 'Enter', width: '70px', appleLabel: '↩' },
]

export const zxcvKeys: KeyRow = [
  {
    keyCode: 'ShiftLeft',
    label: 'Shift',
    width: '90px',
    appleLabel: '⇧',
    isModifier: true,
  },
  { keyCode: 'KeyZ', label: ['Z', 'z'], appleLabel: ['Z', 'z'] },
  { keyCode: 'KeyX', label: ['X', 'x'], appleLabel: ['X', 'x'] },
  { keyCode: 'KeyC', label: ['C', 'c'], appleLabel: ['C', 'c'] },
  { keyCode: 'KeyV', label: ['V', 'v'], appleLabel: ['V', 'v'] },
  { keyCode: 'KeyB', label: ['B', 'b'], appleLabel: ['B', 'b'] },
  { keyCode: 'KeyN', label: ['N', 'n'], appleLabel: ['N', 'n'] },
  { keyCode: 'KeyM', label: ['M', 'm'], appleLabel: ['M', 'm'] },
  {
    keyCode: 'Comma',
    label: ['<', ','],
    appleLabel: ['<', ','],
    showDualState: true,
  },
  {
    keyCode: 'Period',
    label: ['>', '.'],
    appleLabel: ['>', '.'],
    showDualState: true,
  },
  {
    keyCode: 'Slash',
    label: ['?', '/'],
    appleLabel: ['?', '/'],
    showDualState: true,
  },
  {
    keyCode: 'ShiftRight',
    label: 'Shift',
    width: '90px',
    appleLabel: '⇧',
    isModifier: true,
  },
]

export const windSpecialKeys: KeyRow = [
  {
    keyCode: 'ControlLeft',
    label: 'Ctrl',
    width: '8.33%',
    appleLabel: ['⌃', 'control'],
    isModifier: true,
  },
  {
    keyCode: 'MetaLeft',
    label: 'Win',
    width: '8.33%',
    appleLabel: '⌘',
    isModifier: true,
  },
  {
    keyCode: 'AltLeft',
    label: 'Alt',
    width: '8.33%',
    appleLabel: '⌥',
    isModifier: true,
  },
  { keyCode: 'Space', label: 'Space', width: '', appleLabel: 'Space' },
  {
    keyCode: 'AltRight',
    label: 'Alt',
    width: '8.33%',
    appleLabel: '⌥',
    isModifier: true,
  },
  {
    keyCode: 'MetaRight',
    label: 'Win',
    width: '8.33%',
    appleLabel: '⌘',
    isModifier: true,
  },
  {
    keyCode: 'ContextMenu',
    label: 'Menu',
    width: '8.33%',
    appleLabel: '☰',
  },
  {
    keyCode: 'ControlRight',
    label: 'Ctrl',
    width: '8.33%',
    appleLabel: '⌃',
    isModifier: true,
  },
]

export const macSpecialKeys: KeyRow = [
  { keyCode: 'Fn', label: 'fn', width: '8.33%', isModifier: true },
  {
    keyCode: 'ControlLeft',
    label: '⌃',
    width: '8.33%',
    isModifier: true,
  },
  { keyCode: 'AltLeft', label: '⌥', width: '8.33%', isModifier: true },
  { keyCode: 'MetaLeft', label: '⌘', width: '8.33%', isModifier: true },
  { keyCode: 'Space', label: ' ', width: '' },
  { keyCode: 'MetaRight', label: '⌘', width: '8.33%', isModifier: true },
  { keyCode: 'AltRight', label: '⌥', width: '8.33%', isModifier: true },
]

export const navKeys: KeyRow = [
  { keyCode: 'PrintScreen', label: 'PrtSc', appleLabel: 'PrtSc' },
  { keyCode: 'ScrollLock', label: 'ScrLk', appleLabel: 'ScrLk' },
  { keyCode: 'Pause', label: 'Pause', appleLabel: 'Pause' },
  { keyCode: 'Insert', label: 'Ins', width: '8.33%', appleLabel: 'Ins' },
  { keyCode: 'Home', label: 'Home', width: '8.33%', appleLabel: 'Home' },
  { keyCode: 'PageUp', label: 'PgUp', width: '8.33%', appleLabel: 'PgUp' },
  { keyCode: 'Delete', label: 'Del', width: '8.33%', appleLabel: '⌦' },
  { keyCode: 'End', label: 'End', width: '8.33%', appleLabel: 'End' },
  { keyCode: 'PageDown', label: 'PgDn', width: '8.33%', appleLabel: 'PgDn' },
]

export const arrowKeys: KeyRow = [
  { keyCode: 'ArrowUp', label: '↑', appleLabel: '▲' },
  { keyCode: 'ArrowLeft', label: '←', appleLabel: '◀' },
  { keyCode: 'ArrowDown', label: '↓', appleLabel: '▼' },
  { keyCode: 'ArrowRight', label: '→', appleLabel: '▶' },
]

export const windowsKeys: KeyRow = [
  functionKeys,
  numberKeys,
  qwertyKeys,
  asdfKeys,
  zxcvKeys,
]

export const macKeys: KeyRow = [
  functionKeys,
  numberKeys.map(key => ({ ...key, label: key.appleLabel || key.label })),
  qwertyKeys.map(key => ({ ...key, label: key.appleLabel || key.label })),
  asdfKeys.map(key => ({ ...key, label: key.appleLabel || key.label })),
  zxcvKeys.map(key => ({ ...key, label: key.appleLabel || key.label })),
]

// Right panel keys (common across all keyboard layouts)
export const RIGHT_PANEL_ROWS = [
  [createKeyDef('Insert'), createKeyDef('Home'), createKeyDef('PageUp')],
  [createKeyDef('Delete'), createKeyDef('End'), createKeyDef('PageDown')],
  [
    createKeyDef('PrintScreen'),
    createKeyDef('ScrollLock'),
    createKeyDef('Pause'),
  ],
  [],
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
]
