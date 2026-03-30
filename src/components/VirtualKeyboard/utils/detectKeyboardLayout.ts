import {
  getLanguageKeyboardLayout,
  languageLayoutOptions,
} from '../data/language-layouts'
import { generateCharMapFromLayout } from './generateCharMap'

export type LayoutId =
  | 'en-US'
  | 'en-GB'
  | 'cs-CZ'
  | 'de-DE'
  | 'de-CH'
  | 'nl-BE'
  | 'unknown'

function extractIsoCode(layoutId: string): string {
  const parts = layoutId.split('-')
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`
  }
  return layoutId
}

function countMissingChars(
  text: string,
  layoutId: string
): { missing: number; total: number; missingChars: Set<string> } {
  const layout = getLanguageKeyboardLayout(layoutId, 'windows')
  if (!layout) {
    return {
      missing: text.length,
      total: text.length,
      missingChars: new Set(text.split('')),
    }
  }

  const charMap = generateCharMapFromLayout(layout)

  const missingChars = new Set<string>()
  let totalChars = 0

  for (const char of text) {
    if (/\s/.test(char) || char.charCodeAt(0) < 32) {
      continue
    }

    totalChars++

    if (!charMap[char]) {
      missingChars.add(char)
    }
  }

  return {
    missing: missingChars.size,
    total: totalChars,
    missingChars,
  }
}

export function detectKeyboardLayout(pasted: string): LayoutId {
  let text = pasted.normalize('NFC')

  if (!text.trim()) {
    return 'en-US'
  }

  const MAX_DETECTION_LENGTH = 2000
  if (text.length > MAX_DETECTION_LENGTH) {
    text = text.slice(0, MAX_DETECTION_LENGTH)
  }

  let bestMatch = {
    isoCode: 'en-US' as LayoutId,
    matchRate: 0,
    missing: Infinity,
  }

  for (const option of languageLayoutOptions) {
    const stats = countMissingChars(text, option.id)
    const matchRate =
      stats.total > 0 ? (stats.total - stats.missing) / stats.total : 0

    if (matchRate === 1.0 && stats.missing === 0) {
      return extractIsoCode(option.id) as LayoutId
    }

    if (
      matchRate > bestMatch.matchRate ||
      (matchRate === bestMatch.matchRate && stats.missing < bestMatch.missing)
    ) {
      bestMatch = {
        isoCode: extractIsoCode(option.id) as LayoutId,
        matchRate,
        missing: stats.missing,
      }
    }
  }

  if (bestMatch.matchRate === 0) {
    return 'en-US'
  }

  return bestMatch.isoCode
}
