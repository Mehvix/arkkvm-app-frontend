/*
 * @Author: zhanglei
 * @Date: 2026-07-02 16:54:33
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-06 19:18:42
 */
import type { LayoutChars } from '../../../utils/generateCharMap';

const DEAD_KEYS: Record<string, { code: string; mod: string[] }> = {
  acute: { code: 'Quote', mod: [] }, // ´
  grave: { code: 'BracketLeft', mod: [] }, // `
  diaeresis: { code: 'Quote', mod: ['ShiftLeft'] }, // ¨
  tilde: { code: 'Semicolon', mod: ['AltGr'] }, // ~
  circumflex: { code: 'BracketLeft', mod: ['ShiftLeft'] }, // ^
  cedilla: { code: 'Comma', mod: [] }, // ¸
};
export const ES_SPECIAL_CHARS: LayoutChars = {
  // Acute accents (acentos agudos) - using dead key ´ (apostrophe key)
  'á': { code: 'KeyA', mod: [], deadKey: DEAD_KEYS.acute},
  'é': { code: 'KeyE', mod: [], deadKey: DEAD_KEYS.acute },
  'í': { code: 'KeyI', mod: [], deadKey: DEAD_KEYS.acute },
  'ó': { code: 'KeyO', mod: [], deadKey: DEAD_KEYS.acute },
  'ú': { code: 'KeyU', mod: [], deadKey: DEAD_KEYS.acute },
  'Á': { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute },
  'É': { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute },
  'Í': { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute },
  'Ó': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute },
  'Ú': { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute },

  // Grave accent (acento grave) - using dead key ` (backtick)
  'à': { code: 'KeyA', mod: [], deadKey: DEAD_KEYS.grave },
  'è': { code: 'KeyE', mod: [], deadKey: DEAD_KEYS.grave },
  'ì': { code: 'KeyI', mod: [], deadKey: DEAD_KEYS.grave },
  'ò': { code: 'KeyO', mod: [], deadKey: DEAD_KEYS.grave },
  'ù': { code: 'KeyU', mod: [], deadKey: DEAD_KEYS.grave },
  'À': { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave },
  'È': { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave },
  'Ì': { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave },
  'Ò': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave },
  'Ù': { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave },

  // Diaeresis/Umlaut (diéresis) - using dead key ¨ (shift+2)
  'ä': { code: 'KeyA', mod: [], deadKey: DEAD_KEYS.diaeresis },
  'ë': { code: 'KeyE', mod: [], deadKey: DEAD_KEYS.diaeresis },
  'ï': { code: 'KeyI', mod: [], deadKey: DEAD_KEYS.diaeresis },
  'ö': { code: 'KeyO', mod: [], deadKey: DEAD_KEYS.diaeresis },
  'ü': { code: 'KeyU', mod: [], deadKey: DEAD_KEYS.diaeresis },
  'Ä': { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis },
  'Ë': { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis },
  'Ï': { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis },
  'Ö': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis },
  'Ü': { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis },

  // Tilde (virgulilla) - using dead key ~ (shift+4)
  'ã': { code: 'KeyA', mod: [], deadKey: DEAD_KEYS.tilde },
  'ñ': { code: 'KeyN', mod: [], deadKey: DEAD_KEYS.tilde },
  'õ': { code: 'KeyO', mod: [], deadKey: DEAD_KEYS.tilde },
  'Ã': { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.tilde },
  'Ñ': { code: 'KeyN', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.tilde },
  'Õ': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.tilde },

  // Circumflex (circunflejo) - using dead key ^ (shift+6)
  'â': { code: 'KeyA', mod: [], deadKey: DEAD_KEYS.circumflex },
  'ê': { code: 'KeyE', mod: [], deadKey: DEAD_KEYS.circumflex },
  'î': { code: 'KeyI', mod: [], deadKey: DEAD_KEYS.circumflex },
  'ô': { code: 'KeyO', mod: [], deadKey: DEAD_KEYS.circumflex },
  'û': { code: 'KeyU', mod: [], deadKey: DEAD_KEYS.circumflex },
  'Â': { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex },
  'Ê': { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex },
  'Î': { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex },
  'Ô': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex },
  'Û': { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex },

  // Cedilla (cedilla) - using dead key ¸ (comma key)
  'ç': { code: 'KeyC', mod: [], deadKey: DEAD_KEYS.cedilla },
  'Ç': { code: 'KeyC', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.cedilla },
  '\\':{code:'IntlBackslash',mod: ['AltRight']},

  // Note: Special Spanish punctuation symbols (¡, ¿, «, », ·)
  // are now defined in the base layout (windows.ts) and no longer need special handling
};

/**
 * Get Spanish special characters for use in character mapping
 * @returns LayoutChars object with Spanish special character mappings
 */
export function getSpecialChars(): LayoutChars {
  return ES_SPECIAL_CHARS;
}
