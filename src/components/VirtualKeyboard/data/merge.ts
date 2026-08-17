/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-01-22 18:53:32
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-06 18:40:57
 */
// VirtualKeyboard/data/merge.ts
import {
  COMMON_KEYS,
  CURRENCY_KEYS,
  FUNCTION_KEYS,
  INTERNATIONAL_KEYS,
  LETTER_BASE_KEYS,
  MODIFIER_KEYS,
  NAVIGATION_KEYS,
  NUMPAD_KEYS,
  SYSTEM_KEYS,
  US_SYMBOL_KEYS,
  type BaseKeyDefinition,
} from './baseKeys';
import type { KeyDefinition, KeyLegends, ModChord } from './keyboard-types';

export type LegendPart = Partial<Record<ModChord, string>> | undefined

export function mergeLegends(...parts: LegendPart[]): KeyLegends {
  return Object.assign({}, ...parts.filter(Boolean));
}

/**
 * Lookup order for all base definitions
 * Priority: MODIFIER_KEYS > US_SYMBOL_KEYS > LETTER_BASE_KEYS > others
 */
const BASE_KEY_SOURCES: Record<string, BaseKeyDefinition>[] = [
  MODIFIER_KEYS,
  US_SYMBOL_KEYS,
  FUNCTION_KEYS,
  NAVIGATION_KEYS,
  SYSTEM_KEYS,
  NUMPAD_KEYS,
  INTERNATIONAL_KEYS,
  CURRENCY_KEYS,
  COMMON_KEYS
];

/**
 * Get base key definition
 */
function getBaseKeyDefinition(
  keyCode: string
): BaseKeyDefinition | { legends: KeyLegends } | null {
  // 1. Check all BaseKeyDefinition type definitions
  for (const source of BASE_KEY_SOURCES) {
    if (source[keyCode]) {
      return source[keyCode];
    }
  }
  // 2. Check letter keys (only legends, no other properties)
  if (LETTER_BASE_KEYS[keyCode]) {
    return { legends: LETTER_BASE_KEYS[keyCode] };
  }
  return null;
}

/**
 * Create key definition
 * @param keyCode - Key code
 * @param legends - Custom legends (merged with base definition, overwrites same names)
 * @param meta - Other metadata (width, isModifier, showDualState, etc.)
 *
 * Auto-fetched from base definitions:
 * - Letter keys: get legends from LETTER_BASE_KEYS
 * - Modifier keys: get legends + isModifier from MODIFIER_KEYS
 * - Symbol keys: get legends + showDualState from US_SYMBOL_KEYS
 *
 * Example: createKeyDef('KeyA') => { keyCode: 'KeyA', legends: { base: 'a', shift: 'A' } }
 * Example: createKeyDef('ShiftLeft') => { keyCode: 'ShiftLeft', legends: { base: 'Shift' }, isModifier: true }
 * Example: createKeyDef('Digit1') => { keyCode: 'Digit1', legends: { base: '1', shift: '!', caps: '1' }, showDualState: true }
 */
export function createKeyDef(
  keyCode: string,
  legends?: LegendPart,
  meta?: Omit<KeyDefinition, 'keyCode' | 'legends'>
): KeyDefinition {
  const baseDef = getBaseKeyDefinition(keyCode);

  if (baseDef) {
    const mergedLegends = mergeLegends(baseDef.legends, legends);
    if (
      US_SYMBOL_KEYS[keyCode] &&
      mergedLegends.base !== undefined &&
      mergedLegends.caps === undefined
    ) {
      mergedLegends.caps = mergedLegends.base;
    }
    const { legends: _, ...baseMeta } = baseDef as BaseKeyDefinition;
    return {
      keyCode,
      legends: mergedLegends,
      ...baseMeta,
      ...meta,
    };
  }
  return { keyCode, legends: legends || {}, ...meta };
}
