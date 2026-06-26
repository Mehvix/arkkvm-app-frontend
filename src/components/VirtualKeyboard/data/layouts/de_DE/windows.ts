import { createKeyDef } from '../../merge';
import { FUNCTION_KEYS_ROW, RIGHT_PANEL_ROWS } from '../../rows';

/**
 * German dead key definitions (for diacritic composition)
 * Dead keys: do not emit characters immediately, and wait for the next key to compose accented characters
 */
const DEAD_KEY_ACUTE = { code: 'Equal' }; // ´ acute accent
const DEAD_KEY_GRAVE = { code: 'Equal', mod: ['ShiftLeft'] }; // ` grave accent
const DEAD_KEY_CIRCUMFLEX = { code: 'Backquote' }; // ^ circumflex accent
const DEAD_KEY_TILDE = { code: 'BracketRight', mod: ['AltRight'] }; // ~ tilde accent

/**
 * German AltGr character mapping
 * Refer to the AltGr mapping in keyboardLayouts/de_DE.ts
 */
const DE_DE_ALTGR: Record<string, { altGr?: string; 'shift+altGr'?: string }> =
  {
    // Top number row
    Digit2: { altGr: '²' },
    Digit3: { altGr: '³' },
    Digit7: { altGr: '{' },
    Digit8: { altGr: '[' },
    Digit9: { altGr: ']' },
    Digit0: { altGr: '}' },
    Minus: { altGr: '\\' }, // AltGr+ß -> \
    BracketRight: { altGr: '~' },
    // Letter section
    KeyQ: { altGr: '@' },
    KeyE: { altGr: '€' },
    KeyM: { altGr: 'µ' },
    // Extra ISO key
    IntlBackslash: { altGr: '|' },
  };

// DE German (Windows) — Standard German QWERTZ keyboard layout
export const DE_WIN_LAYOUT = {
  id: 'de-win',
  name: 'Deutsch (Deutschland)',
  rows: [
    FUNCTION_KEYS_ROW,
    [
      createKeyDef('Backquote', {
            base: '§',
            shift: '°',
            caps: '§',

          }),
      createKeyDef('Digit1', { base: '1', shift: '+' }),
      createKeyDef('Digit2', {
        base: '2',
        shift: '"',

        ...DE_DE_ALTGR.Digit2,
      }),
      createKeyDef('Digit3', {
        base: '3',
        shift: '*',
        caps: '3',
        ...DE_DE_ALTGR.Digit3,
      }),
      createKeyDef('Digit4', { base: '4', shift: '$', caps: '4' }),
      createKeyDef('Digit5', { base: '5', shift: '%', caps: '5' }),
      createKeyDef('Digit6', { base: '6', shift: '&', caps: '6' }),
      createKeyDef('Digit7', {
        base: '7',
        shift: '/',
        caps: '7',
        ...DE_DE_ALTGR.Digit7,
      }),
      createKeyDef('Digit8', {
        base: '8',
        shift: '(',
        caps: '8',
        ...DE_DE_ALTGR.Digit8,
      }),
      createKeyDef('Digit9', {
        base: '9',
        shift: ')',
        caps: '9',
        ...DE_DE_ALTGR.Digit9,
      }),
      createKeyDef('Digit0', {
        base: '0',
        shift: '=',
        caps: '0',
        ...DE_DE_ALTGR.Digit0,
      }),
      createKeyDef('Minus', {
        base: 'ß',
        shift: '?',
        ...DE_DE_ALTGR.Minus,
      }),
      createKeyDef('Equal', { base: '´', shift: '`' }),
      createKeyDef('Backspace', undefined, { width: 1.5 }),
    ],
    [
      createKeyDef('Tab', undefined, { width: 1.5 }),
      createKeyDef('KeyQ', DE_DE_ALTGR.KeyQ),
      createKeyDef('KeyW'),
      createKeyDef('KeyE', DE_DE_ALTGR.KeyE),
      createKeyDef('KeyR'),
      createKeyDef('KeyT'),
      createKeyDef('KeyZ', { base: 'y', shift: 'Y' }),
      createKeyDef('KeyU'),
      createKeyDef('KeyI'),
      createKeyDef('KeyO'),
      createKeyDef('KeyP'),
      createKeyDef(
        'BracketLeft',
        { base: 'ü', shift: 'Ü' },
        { showDualState: false }
      ),
      createKeyDef('BracketRight', {
        base: '+',
        shift: '*',
        ...DE_DE_ALTGR.BracketRight,
      }),
      createKeyDef('Delete'),
    ],
    [
      createKeyDef('CapsLock', { base: 'Fest' }, { width: 1.8 }),
      createKeyDef('KeyA'),
      createKeyDef('KeyS'),
      createKeyDef('KeyD'),
      createKeyDef('KeyF'),
      createKeyDef('KeyG'),
      createKeyDef('KeyH'),
      createKeyDef('KeyJ'),
      createKeyDef('KeyK'),
      createKeyDef('KeyL'),
      createKeyDef(
        'Semicolon',
        { base: 'ö', shift: 'Ö' },
        { showDualState: false }
      ),
      createKeyDef(
        'Quote',
        { base: 'ä', shift: 'Ä' },
        { showDualState: false }
      ),
      createKeyDef('Enter', undefined, { width: 2.7 }),
    ],
    // Row 4: Shift, <YXCVBNM,.-, Shift
    [
      createKeyDef('ShiftLeft', { base: 'Umsch' }, { width: 1.8 }),
      createKeyDef('IntlBackslash', {
        base: '<',
        shift: '>',
        ...DE_DE_ALTGR.IntlBackslash,
      }),
      // QWERTZ: this position is Y
      createKeyDef('KeyY', { base: 'z', shift: 'Z' }),
      createKeyDef('KeyX'),
      createKeyDef('KeyC'),
      createKeyDef('KeyV'),
      createKeyDef('KeyB'),
      createKeyDef('KeyN'),
      createKeyDef('KeyM', DE_DE_ALTGR.KeyM),
      createKeyDef('Comma', { base: ',', shift: ';' }),
      createKeyDef('Period', { base: '.', shift: ':' }),
      createKeyDef('Slash', { base: '-', shift: '_' }),
      createKeyDef('ShiftRight', { base: 'Umsch' }, { width: 2 }),
    ],
    // Row 5: Ctrl, Fn, Win, Alt, Space, AltGr, Ctrl, ←↓→, Menu
    [
      createKeyDef('ControlLeft', { base: 'Strg' }, { width: 1.2 }),
      createKeyDef('MetaLeft'),
      createKeyDef('AltLeft'),
      createKeyDef('Space', undefined, { width: 6 }),
      createKeyDef('AltGr', { base: ' AltGr' }),
      createKeyDef('ControlRight', { base: 'Srrg' }),

      createKeyDef('ContextMenu'),
    ],
  ],
  rightPanel: RIGHT_PANEL_ROWS,
  // Extra character mapping: accented characters, etc. (not shown on keyboard UI, but needed for paste input)
  extraChars: {
    // Vowels with acute accent - use dead key ´
    á: { code: 'KeyA', deadKey: DEAD_KEY_ACUTE },
    Á: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    é: { code: 'KeyE', deadKey: DEAD_KEY_ACUTE },
    É: { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    í: { code: 'KeyI', deadKey: DEAD_KEY_ACUTE },
    Í: { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    ó: { code: 'KeyO', deadKey: DEAD_KEY_ACUTE },
    Ó: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },
    ú: { code: 'KeyU', deadKey: DEAD_KEY_ACUTE },
    Ú: { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEY_ACUTE },

    // Vowels with grave accent - use dead key `
    à: { code: 'KeyA', deadKey: DEAD_KEY_GRAVE },
    À: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },
    è: { code: 'KeyE', deadKey: DEAD_KEY_GRAVE },
    È: { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },
    ì: { code: 'KeyI', deadKey: DEAD_KEY_GRAVE },
    Ì: { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },
    ò: { code: 'KeyO', deadKey: DEAD_KEY_GRAVE },
    Ò: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },
    ù: { code: 'KeyU', deadKey: DEAD_KEY_GRAVE },
    Ù: { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEY_GRAVE },

    // Vowels with circumflex accent - use dead key ^
    â: { code: 'KeyA', deadKey: DEAD_KEY_CIRCUMFLEX },
    Â: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEY_CIRCUMFLEX },
    ê: { code: 'KeyE', deadKey: DEAD_KEY_CIRCUMFLEX },
    Ê: { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEY_CIRCUMFLEX },
    î: { code: 'KeyI', deadKey: DEAD_KEY_CIRCUMFLEX },
    Î: { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEY_CIRCUMFLEX },
    ô: { code: 'KeyO', deadKey: DEAD_KEY_CIRCUMFLEX },
    Ô: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_CIRCUMFLEX },
    û: { code: 'KeyU', deadKey: DEAD_KEY_CIRCUMFLEX },
    Û: { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEY_CIRCUMFLEX },

    // Characters with tilde - use dead key ~
    ã: { code: 'KeyA', deadKey: DEAD_KEY_TILDE },
    Ã: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEY_TILDE },
    õ: { code: 'KeyO', deadKey: DEAD_KEY_TILDE },
    Õ: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEY_TILDE },
    ñ: { code: 'KeyN', deadKey: DEAD_KEY_TILDE },
    Ñ: { code: 'KeyN', mod: ['ShiftLeft'], deadKey: DEAD_KEY_TILDE },
  },
};
