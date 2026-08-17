/*
 * @Author: zhanglei
 * @Date: 2026-07-03 20:04:15
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-10 23:16:02
 */
import type { LayoutChars } from '../../../utils/generateCharMap';

const DEAD_KEYS: Record<string, { code: string; mod: string[] }> = {

  grave: { code: 'BracketRight', mod: ['ShiftLeft'] }, // `
  diaeresis: {  code: 'BracketLeft',  mod: ['ShiftLeft'] },// ¨
  tilde: { code: 'KeyN',  mod: [ 'AltRight']  }, // ~
  circumflex: { code: 'BracketLeft',mod: []},// ^
  cedilla: { code: 'Comma', mod: [] },// ¸
};

// Mac-specific dead keys configuration
const MAC_DEAD_KEYS: Record<string, { code: string; mod: string[] }> = {
   grave: { code: 'BracketRight', mod: ['ShiftLeft'] }, // `
  diaeresis: {  code: 'BracketLeft',  mod: ['ShiftLeft'] },// ¨
  tilde: { code: 'KeyN',  mod: [ 'AltRight']  }, // ~
  circumflex: { code: 'BracketLeft',mod: []},// ^
  cedilla: { code: 'Comma', mod: [] },// ¸
};

export const SPECIAL_CHARS: LayoutChars = {
  // Grave accent (acento grave)
  'à': { code: 'KeyQ', mod: [], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'è': { code: 'KeyE', mod: [], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'ì': { code: 'KeyI', mod: [], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'ò': { code: 'KeyO', mod: [], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'ù': { code: 'KeyU', mod: [], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'À': { code: 'KeyQ', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'È': { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'Ì': { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'Ò': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'Ù': { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
 
  // Diaeresis/Umlaut — fr-FR AZERTY: ¨ + a(KeyQ) e(KeyE) y(KeyY) u(KeyU) i(KeyI) o(KeyO)
  'ä': { code: 'KeyQ', mod: [], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'ë': { code: 'KeyE', mod: [], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'ÿ': { code: 'KeyY', mod: [], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'ü': { code: 'KeyU', mod: [], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'ï': { code: 'KeyI', mod: [], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'ö': { code: 'KeyO', mod: [], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ä': { code: 'KeyQ', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ë': { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ÿ': { code: 'KeyY', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ü': { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ï': { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ö': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },

  // Tilde (virgulilla)
  'ã': { code: 'KeyQ', mod: [], deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },
  'ñ': { code: 'KeyN', mod: [], deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },
  'õ': { code: 'KeyO', mod: [], deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },
  'Ã': { code: 'KeyQ', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },
  'Ñ': { code: 'KeyN', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },
  'Õ': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },

  // Circumflex (circunflejo)
  'â': { code: 'KeyQ', mod: [], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'ê': { code: 'KeyE', mod: [], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'î': { code: 'KeyI', mod: [], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'ô': { code: 'KeyO', mod: [], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'û': { code: 'KeyU', mod: [], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'Â': { code: 'KeyQ', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'Ê': { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'Î': { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'Ô': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'Û': { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },

  // Cedilla (cedilla)
  'ç': { code: 'KeyC', mod: [], deadKey: DEAD_KEYS.cedilla, macDeadKey: MAC_DEAD_KEYS.cedilla },
  'Ç': { code: 'KeyC', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.cedilla, macDeadKey: MAC_DEAD_KEYS.cedilla },
  '\\': { code: 'IntlBackslash', mod: ['AltRight'] },
};
export function getSpecialChars(): LayoutChars {
  return SPECIAL_CHARS;
}
