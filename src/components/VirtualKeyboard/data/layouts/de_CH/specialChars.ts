import type { LayoutChars } from '../../../utils/generateCharMap';

const DEAD_KEYS: Record<string, { code: string; mod?: string[] }> = {
  acute: { code: 'Quote' },
  grave: { code: 'BracketLeft', mod: ['ShiftLeft'] },
  circumflex: { code: 'BracketLeft' },
  diaeresis: { code: 'BracketRight' },
  tilde: { code: 'BracketRight', mod: ['AltRight'] },
};

const MAC_DEAD_KEYS: Record<string, { code: string; mod?: string[] }> = {
  acute: { code: 'Equal', mod: ['AltRight'] },
  grave: { code: 'Equal', mod: ['ShiftLeft'] },
  circumflex: { code: 'Equal' },
  diaeresis: { code: 'BracketRight' },
  tilde: { code: 'KeyN', mod: ['AltRight'] },
};

export const DE_CH_SPECIAL_CHARS: LayoutChars = {
  'á': { code: 'KeyA', deadKey: DEAD_KEYS.acute, macDeadKey: MAC_DEAD_KEYS.acute },
  'Á': { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute, macDeadKey: MAC_DEAD_KEYS.acute },
  'é': { code: 'Semicolon', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute, macDeadKey: MAC_DEAD_KEYS.acute },
  'É': { code: 'Semicolon', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute, macDeadKey: MAC_DEAD_KEYS.acute },
  'í': { code: 'KeyI', deadKey: DEAD_KEYS.acute, macDeadKey: MAC_DEAD_KEYS.acute },
  'Í': { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute, macDeadKey: MAC_DEAD_KEYS.acute },
  'ó': { code: 'KeyO', deadKey: DEAD_KEYS.acute, macDeadKey: MAC_DEAD_KEYS.acute },
  'Ó': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute, macDeadKey: MAC_DEAD_KEYS.acute },
  'ú': { code: 'KeyU', deadKey: DEAD_KEYS.acute, macDeadKey: MAC_DEAD_KEYS.acute },
  'Ú': { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.acute, macDeadKey: MAC_DEAD_KEYS.acute },

  'à': { code: 'Quote', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'À': { code: 'Quote', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'è': { code: 'BracketLeft', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'È': { code: 'BracketLeft', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'ì': { code: 'KeyI', deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'Ì': { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'ò': { code: 'KeyO', deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'Ò': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'ù': { code: 'KeyU', deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },
  'Ù': { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.grave, macDeadKey: MAC_DEAD_KEYS.grave },

  'â': { code: 'KeyA', deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'Â': { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'ê': { code: 'KeyE', deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'Ê': { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'î': { code: 'KeyI', deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'Î': { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'ô': { code: 'KeyO', deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'Ô': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'û': { code: 'KeyU', deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },
  'Û': { code: 'KeyU', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.circumflex, macDeadKey: MAC_DEAD_KEYS.circumflex },

  'ä': { code: 'Quote', deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ä': { code: 'Quote', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'ë': { code: 'KeyE', deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ë': { code: 'KeyE', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'ï': { code: 'KeyI', deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ï': { code: 'KeyI', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'ö': { code: 'Semicolon', deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ö': { code: 'Semicolon', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'ü': { code: 'BracketLeft', deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ü': { code: 'BracketLeft', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'ÿ': { code: 'KeyY', deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },
  'Ÿ': { code: 'KeyY', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.diaeresis, macDeadKey: MAC_DEAD_KEYS.diaeresis },

  'ã': { code: 'KeyA', deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },
  'Ã': { code: 'KeyA', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },
  'ñ': { code: 'KeyN', deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },
  'Ñ': { code: 'KeyN', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },
  'õ': { code: 'KeyO', deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },
  'Õ': { code: 'KeyO', mod: ['ShiftLeft'], deadKey: DEAD_KEYS.tilde, macDeadKey: MAC_DEAD_KEYS.tilde },
};

export function getSpecialChars(): LayoutChars {
  return DE_CH_SPECIAL_CHARS;
}
