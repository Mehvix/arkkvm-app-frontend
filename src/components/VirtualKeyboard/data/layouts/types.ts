/**
 * @Purpose: Keyboard layout metadata type definitions
 * @Author: zhanglei
 * @Date: 2026-01-23
 */

import type { KeyboardLayout } from '../keyboard-types';

/** Keyboard layout standard */
export type KeyboardStandard = 'ansi' | 'iso' | 'jis'

/** Keyboard layout type */
export type LayoutType = 'qwerty' | 'qwertz' | 'azerty' | 'dvorak' | 'colemak'

/** Region classification */
export type LayoutRegion = 'global' | 'europe' | 'asia' | 'americas'

/** Layout metadata - used for generating options list */
export interface LayoutMeta {
  /** Unique identifier, e.g. "cs-CZ-qwerty" */
  id: string
  /** Short tag, e.g. "CZ" */
  tag: string
  /** Chinese name, e.g. "Czech – QWERTY" */
  name: string
  /** Native language name, e.g. "Čeština" */
  nativeName: string
  /** Layout type */
  layout: LayoutType
  /** Keyboard standard */
  standard: KeyboardStandard
  /** Region classification */
  region: LayoutRegion
  /** Sort priority (smaller number = higher priority) */
  priority: number
  /** Whether recommended */
  recommended?: boolean
  /** Whether includes AltGr extended characters */
  hasAltGr?: boolean
  /** Note/comment */
  note?: string
}

/** Language layout module export structure */
export interface LanguageLayoutModule {
  /** Layout metadata */
  meta: LayoutMeta
  /** Windows layout */
  windows?: KeyboardLayout
  /** Mac layout */
  mac?: KeyboardLayout
}

/** Layout option (used for dropdown selection and other UI) */
export type LayoutOption = LayoutMeta & {
  /** Whether has Windows layout */
  hasWindows: boolean
  /** Whether has Mac layout */
  hasMac: boolean
}
