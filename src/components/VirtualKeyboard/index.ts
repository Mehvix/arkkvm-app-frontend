/**
 * VirtualKeyboard module exports
 *
 * This module provides a complete virtual keyboard implementation
 * with support for mobile devices, accessibility, and customization.
 */

/**
 * VirtualKeyboard component exports
 */

export { default } from './index.tsx'
export { default as VirtualKeyboard } from './index.tsx'
export type { VirtualKeyboardProps } from './index.tsx'

// Export key components
export { default as Key } from './components/Key.tsx'
export type { KeyProps } from './types'

// Export utilities (includes keyboard simulator)
export * from './utils'

// Export data types
export type * from './data'

// Hooks
export * from './hooks'
// Constants
export * from './constants'
