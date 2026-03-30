import {
  getLanguageKeyboardLayout,
  languageLayoutOptions,
  type LayoutOption,
} from '../data/language-layouts'
import { generateCharMapFromLayout } from './generateCharMap'

export interface KeyboardLayoutInfo {
  name: string
  isoCode: string
  chars: Record<
    string,
    {
      code: string
      mod?: string[]
      accentKey?: { code: string; mod?: string[] }
    }
  >
}

export function getAvailableLayoutOptions(): Array<{
  value: string
  label: string
  isoCode: string
}> {
  return languageLayoutOptions.map((option: LayoutOption) => ({
    value: extractIsoCode(option.id), // 'cs-CZ-qwerty' -> 'cs-CZ'
    label: option.nativeName,
    isoCode: extractIsoCode(option.id),
  }))
}

function extractIsoCode(layoutId: string): string {
  const parts = layoutId.split('-')
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`
  }
  return layoutId
}

export function getLayoutByIsoCode(isoCode: string): KeyboardLayoutInfo | null {
  const option = languageLayoutOptions.find((opt: LayoutOption) =>
    opt.id.startsWith(isoCode)
  )

  if (!option) return null

  const keyboardLayout = getLanguageKeyboardLayout(option.id, 'windows')
  if (!keyboardLayout) return null

  const chars = generateCharMapFromLayout(keyboardLayout)

  return {
    name: option.nativeName,
    isoCode: extractIsoCode(option.id),
    chars,
  }
}

export function getDefaultLayout(): KeyboardLayoutInfo {
  return (
    getLayoutByIsoCode('en-US') || {
      name: 'English (US)',
      isoCode: 'en-US',
      chars: {},
    }
  )
}

export function isValidLayout(isoCode: string): boolean {
  return languageLayoutOptions.some((opt: LayoutOption) =>
    opt.id.startsWith(isoCode)
  )
}
