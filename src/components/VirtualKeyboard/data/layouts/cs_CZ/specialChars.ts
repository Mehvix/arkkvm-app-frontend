/*
 * @Author: zhanglei
 * @Date: 2026-07-02 16:52:38
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-09 22:30:25
 */
import type { LayoutChars } from '../../../utils/generateCharMap';

// const DEAD_KEYS: Record<string, { code: string; mod: string[] }> = {
//   acute: { code: 'Semicolon', mod: [] },
//   acuteQuote: { code: 'Quote', mod: [] },
//   caron: { code: 'Digit2', mod: [] },
//   diaeresis: { code: 'Digit2', mod: ['ShiftLeft'] },
//   ring: { code: 'Digit3', mod: ['ShiftLeft'] },
// };
const DEAD_KEYS: Record<string, { code: string; mod: string[] }> = {
  acute: { code: 'Equal', mod: [] }, // Acute accent: ´
  caron: { code: 'Equal', mod: ['ShiftLeft'] }, // Caron / háček: ˇ
  diaeresis: { code: 'Backslash', mod: [] }, // Diaeresis / Umlaut: ¨
   circumflex: { code: 'Equal', mod: ['AltGr'] }, // ^
} as const;

/**
 * Czech special characters that require multi-key combinations
 * These characters need accent keys + base keys to type
 */
export const CZ_SPECIAL_CHARS: LayoutChars = {
  // Acute accents (čárka)
  á: { code: 'KeyA', mod: [], deadKey: DEAD_KEYS.acute },
  é: { code: 'KeyE', mod: [], deadKey: DEAD_KEYS.acute },
  í: { code: 'KeyI', mod: [], deadKey: DEAD_KEYS.acute },
  ý: { code: 'KeyY', mod: [], deadKey: DEAD_KEYS.acute },
  ú: { code: 'KeyU', mod: [], deadKey: DEAD_KEYS.acute },
  ó: { code: 'KeyO', mod: [], deadKey: DEAD_KEYS.acute },
  Á: { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute },
  É: { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute },
  Í: { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute },
  Ý: { code: 'KeyY', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute },
  Ú: { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute },
  Ó: { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute },

  // Caron/háček (requires equals key)
  č: { code: 'KeyC', mod: [], deadKey: DEAD_KEYS.caron },
   ě: { code: 'KeyE', mod: [], deadKey: DEAD_KEYS.caron },
  š: { code: 'KeyS', mod: [], deadKey: DEAD_KEYS.caron },
  ž: { code: 'KeyZ', mod: [], deadKey: DEAD_KEYS.caron },
  ř: { code: 'KeyR', mod: [], deadKey: DEAD_KEYS.caron },
  ď: { code: 'KeyD', mod: [], deadKey: DEAD_KEYS.caron },
  ť: { code: 'KeyT', mod: [], deadKey: DEAD_KEYS.caron },
  ň: { code: 'KeyN', mod: [], deadKey: DEAD_KEYS.caron },
  Č: { code: 'KeyC', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.caron },
  Ě: { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.caron },
  Š: { code: 'KeyS', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.caron },
  Ž: { code: 'KeyZ', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.caron },
  Ř: { code: 'KeyR', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.caron },
  Ď: { code: 'KeyD', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.caron },
  Ť: { code: 'KeyT', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.caron },
  Ň: { code: 'KeyN', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.caron },


  // Umlaut/diaeresis (requires shift+2)
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
  'ô': { code: 'KeyO', mod: [], deadKey: DEAD_KEYS.circumflex },
  'Ô': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex },

  // Ring above (requires shift+3)
  ů: { code: 'KeyU', mod: [], deadKey: DEAD_KEYS.ring },
  Ů: { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.ring },
};

/**
 * Get Czech special characters for use in character mapping
 * @returns LayoutChars object with Czech special character mappings
 */
export function getSpecialChars(): LayoutChars {
  return CZ_SPECIAL_CHARS;
}
