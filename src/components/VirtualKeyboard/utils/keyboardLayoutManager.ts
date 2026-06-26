/**
 * Keyboard layout manager
 * Used for managing and selecting different keyboard layouts
 *
 * Now uses dynamic layout list from language-layouts.ts
 */

import {
    getLanguageKeyboardLayout,
    languageLayoutOptions,
    type LayoutOption,
} from '../data/language-layouts';
import { generateCharMapFromLayout } from './generateCharMap';

// Keyboard layout interface
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

// Get list of all available layouts (for dropdown selection)
// Now dynamically generated from languageLayoutOptions
export function getAvailableLayoutOptions(): Array<{
  value: string
  label: string
  isoCode: string
}> {
  return languageLayoutOptions.map((option: LayoutOption) => ({
    value: extractIsoCode(option.id), // 'cs-CZ-qwerty' -> 'cs-CZ'
    label: option.nativeName,
    isoCode: extractIsoCode(option.id),
  }));
}

/**
 * Extract ISO code from layout ID
 * 'cs-CZ-qwerty' -> 'cs-CZ'
 */
function extractIsoCode(layoutId: string): string {
  const parts = layoutId.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return layoutId;
}

// Get layout info by isoCode
export function getLayoutByIsoCode(isoCode: string): KeyboardLayoutInfo | null {
  // Find matching layout
  const option = languageLayoutOptions.find((opt: LayoutOption) =>
    opt.id.startsWith(isoCode)
  );

  if (!option) return null;

  // Get keyboard layout data
  const keyboardLayout = getLanguageKeyboardLayout(option.id, 'windows');
  if (!keyboardLayout) return null;

  // Dynamically generate character mapping
  const chars = generateCharMapFromLayout(keyboardLayout);

  return {
    name: option.nativeName,
    isoCode: extractIsoCode(option.id),
    chars,
  };
}

// Get default layout
export function getDefaultLayout(): KeyboardLayoutInfo {
  return (
    getLayoutByIsoCode('en-US') || {
      name: 'English (US)',
      isoCode: 'en-US',
      chars: {},
    }
  );
}

// Validate if layout exists
export function isValidLayout(isoCode: string): boolean {
  return languageLayoutOptions.some((opt: LayoutOption) =>
    opt.id.startsWith(isoCode)
  );
}
