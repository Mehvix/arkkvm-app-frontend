/*
 * @Author: zhanglei
 * @Date: 2026-02-09 19:54:13
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-16 16:56:52
 */
/**
 * VirtualKeyboard module exports
 *
 * This module provides a complete virtual keyboard implementation
 * with support for mobile devices, accessibility, and customization.
 */

/**
 * VirtualKeyboard component exports
 */

export { default } from './index.tsx';
export { default as VirtualKeyboard } from './index.tsx';
export type { VirtualKeyboardProps } from './index.tsx';

// Export key components
export { default as Key } from './components/Key.tsx';
export type { KeyProps } from './types';

// Export utilities (includes keyboard simulator)
export * from './utils';

// Export data types
export type * from './data';

// Hooks
export * from './hooks';
// Constants
export * from './constants';

// Self-contained i18n layer (no external i18n framework required)
export {
  I18nProvider,
  useI18n,
  getTranslations,
  createT,
  languageDisplayNames,
  getLanguageDisplayName,
  type VirtualKeyboardLocale,
  type VirtualKeyboardTranslations,
  type TFunction,
} from './i18n';
