import type { KeyboardLayout } from '../keyboard-types'

export type KeyboardStandard = 'ansi' | 'iso' | 'jis'

export type LayoutType = 'qwerty' | 'qwertz' | 'azerty' | 'dvorak' | 'colemak'

export type LayoutRegion = 'global' | 'europe' | 'asia' | 'americas'

export interface LayoutMeta {
  id: string

  tag: string

  name: string

  nativeName: string

  layout: LayoutType

  standard: KeyboardStandard

  region: LayoutRegion

  priority: number

  recommended?: boolean

  hasAltGr?: boolean

  note?: string
}

export interface LanguageLayoutModule {
  meta: LayoutMeta

  windows?: KeyboardLayout

  mac?: KeyboardLayout
}

export type LayoutOption = LayoutMeta & {
  hasWindows: boolean

  hasMac: boolean
}
