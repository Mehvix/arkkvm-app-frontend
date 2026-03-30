/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-01-22 18:53:32
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-28 14:40:56
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
} from './baseKeys'
import type { KeyDefinition, KeyLegends, ModChord } from './keyboard-types'

export type LegendPart = Partial<Record<ModChord, string>> | undefined

export function mergeLegends(...parts: LegendPart[]): KeyLegends {
  return Object.assign({}, ...parts.filter(Boolean))
}

const BASE_KEY_SOURCES: Record<string, BaseKeyDefinition>[] = [
  MODIFIER_KEYS,
  US_SYMBOL_KEYS,
  FUNCTION_KEYS,
  NAVIGATION_KEYS,
  SYSTEM_KEYS,
  NUMPAD_KEYS,
  INTERNATIONAL_KEYS,
  CURRENCY_KEYS,
  COMMON_KEYS,
]

function getBaseKeyDefinition(
  keyCode: string
): BaseKeyDefinition | { legends: KeyLegends } | null {
  for (const source of BASE_KEY_SOURCES) {
    if (source[keyCode]) {
      return source[keyCode]
    }
  }

  if (LETTER_BASE_KEYS[keyCode]) {
    return { legends: LETTER_BASE_KEYS[keyCode] }
  }
  return null
}

export function createKeyDef(
  keyCode: string,
  legends?: LegendPart,
  meta?: Omit<KeyDefinition, 'keyCode' | 'legends'>
): KeyDefinition {
  const baseDef = getBaseKeyDefinition(keyCode)

  if (baseDef) {
    const mergedLegends = mergeLegends(baseDef.legends, legends)

    const { legends: _, ...baseMeta } = baseDef as BaseKeyDefinition
    return {
      keyCode,
      legends: mergedLegends,
      ...baseMeta,
      ...meta,
    }
  }

  return { keyCode, legends: legends || {}, ...meta }
}
