/**
 * Keyboard type definitions.
 * Defines key structures, modifiers, and layout types.
 */

/** Modifier key combinations (used for legends indexing) */
export type ModChord =
  | 'base'
  | 'shift'
  | 'caps'
  | 'shift+caps'
  | 'altGr'
  | 'shift+altGr'
  | 'fn'
  | 'fn+shift'
  | 'fn+altGr'
  | 'fn+shift+altGr'

/** Characters/text displayed for each key under different chords */
export type KeyLegends = Partial<Record<ModChord, string>>

/** UI semantic classification (for unified styling) */
export type KeyRole =
  | 'alpha'
  | 'digit'
  | 'symbol'
  | 'modifier'
  | 'system'
  | 'function'
  | 'navigation'
  | 'enter'
  | 'backspace'
  | 'tab'
  | 'space'

/** Keycap text display method */
export type LegendLayout = 'single' | 'dual' | 'quad' | 'auto'

/** Visual style */
export type KeyVariant = 'default' | 'muted' | 'primary' | 'danger'
export interface KeyGrid {
  colSpan?: number
  rowSpan?: number
  colStart?: number
  rowStart?: number
  area?: string
}

/** Style metadata (does not affect input logic) */
export interface KeyStyle {
  variant?: KeyVariant
  legendLayout?: LegendLayout
  align?: 'center' | 'left'
  className?: string
}

/** Key data structure */
export interface KeyDefinition {
  keyCode: string

  /** Content displayed under different states (core) */
  legends: KeyLegends

  /** Mac display text (optional) */
  appleLegends?: KeyLegends
  width?: number

  grid?: KeyGrid

  role?: KeyRole

  isModifier?: boolean

  showLegends?: boolean

  style?: KeyStyle
}

export type KeyRow = KeyDefinition[]

export interface KeyboardLayout {
  id: string
  name: string
  rows: KeyRow[]
  rightPanel?: KeyRow[]
}
