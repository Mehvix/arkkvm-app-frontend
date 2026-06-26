/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-01-23 11:05:33
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-24 16:58:50
 */
import { createKeyDef } from '../../merge';
import { FUNCTION_KEYS_ROW, RIGHT_PANEL_ROWS } from '../../rows';
export const US_WIN_LAYOUT = {
  id: 'us-win',
  name: 'English (US)',
  rows: [
    FUNCTION_KEYS_ROW,
    [
      createKeyDef('Backquote', { fn: 'F1' }),
      createKeyDef('Digit1', { fn: 'F2' }),
      createKeyDef('Digit2', { fn: 'F3' }),
      createKeyDef('Digit3', { fn: 'F4' }),
      createKeyDef('Digit4', { fn: 'F5' }),
      createKeyDef('Digit5', { fn: 'F6' }),
      createKeyDef('Digit6', { fn: 'F7' }),
      createKeyDef('Digit7', { fn: 'F8' }),
      createKeyDef('Digit8', { fn: 'F9' }),
      createKeyDef('Digit9', { fn: 'F10' }),
      createKeyDef('Digit0', { fn: 'F11' }),
      createKeyDef('Minus', { fn: 'F12' }),
      createKeyDef('Equal'),
      createKeyDef('Backspace', undefined, { width: 1.5 }),
    ],
    // Row 2: Tab, Q-P, [, ], \, Del
    [
      createKeyDef('Tab', undefined, { width: 1.5 }),
      createKeyDef('KeyQ'),
      createKeyDef('KeyW'),
      createKeyDef('KeyE'),
      createKeyDef('KeyR'),
      createKeyDef('KeyT'),
      createKeyDef('KeyY'),
      createKeyDef('KeyU'),
      createKeyDef('KeyI'),
      createKeyDef('KeyO'),
      createKeyDef('KeyP'),
      createKeyDef('BracketLeft'),
      createKeyDef('BracketRight'),
      createKeyDef('Backslash'),
      createKeyDef('Delete'),
    ],
    // Row 3: Caps, A-L, ;, ', Enter
    [
      createKeyDef('CapsLock', undefined, { width: 1.8 }),
      createKeyDef('KeyA'),
      createKeyDef('KeyS'),
      createKeyDef('KeyD'),
      createKeyDef('KeyF'),
      createKeyDef('KeyG'),
      createKeyDef('KeyH'),
      createKeyDef('KeyJ'),
      createKeyDef('KeyK'),
      createKeyDef('KeyL'),
      createKeyDef('Semicolon'),
      createKeyDef('Quote'),
      createKeyDef('Enter', undefined, { width: 2.7 }),
    ],
    // Row 4: Shift, Z-M, ,, ., /, ↑, Shift
    [
      createKeyDef('ShiftLeft', undefined, { width: 2.5 }),
      createKeyDef('KeyZ'),
      createKeyDef('KeyX'),
      createKeyDef('KeyC'),
      createKeyDef('KeyV'),
      createKeyDef('KeyB'),
      createKeyDef('KeyN'),
      createKeyDef('KeyM'),
      createKeyDef('Comma'),
      createKeyDef('Period'),
      createKeyDef('Slash'),

      createKeyDef('ShiftRight', undefined, { width: 2 }),
    ],
    // Row 5: Ctrl, Fn, Win, Alt, Space, Alt, Ctrl, ←, ↓, →, Menu
    [
      createKeyDef('ControlLeft'),
      createKeyDef('MetaLeft'),
      createKeyDef('AltLeft'),
      createKeyDef('Space', undefined, { width: 7 }),
      createKeyDef('AltRight'),
      createKeyDef('ControlRight'),

      createKeyDef('ContextMenu'),
    ],
  ],
  rightPanel: RIGHT_PANEL_ROWS,
};
