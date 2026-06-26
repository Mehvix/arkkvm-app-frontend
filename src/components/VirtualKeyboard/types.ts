/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-11-03 14:41:22
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-11-03 17:21:33
 */
/**
 * Type definitions for VirtualKeyboard components
 */
import type { KeyDefinition } from './data/keyboard-types';

export interface KeyProps {
  /** Key code identifier */
  keyCode: string
  /** Display content - supports text, dual-state text array, or custom React node */
  label?: React.ReactNode | string | string[]
  /** Key definition object (used to compute label with getDisplayLabel) */
  keyDef?: KeyDefinition
  /** Function to compute display label from key definition */
  getDisplayLabel?: (key: KeyDefinition) => string | string[] | undefined
  /** Additional CSS classes */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
  /** Fixed width (auto for flexible width) */
  width?: string | number
  /** Key press callback (legacy - use onKeyDown/onKeyUp for better control) */
  onKeyPress?: (keyCode: string, label: string) => void
  /** Key down event callback */
  onKeyDown?: (keyCode: string, label: string) => void
  /** Key up event callback */
  onKeyUp?: (keyCode: string, label: string) => void
  /** Compact mode for grouped keys like arrow keys */
  compact?: boolean
  /** Custom height class override */
  heightClass?: string
  /** Value to send when label is a component */
  sendValue?: string
  /** Custom tooltip text */
  title?: string
  /** Whether to show status indicator (LED) */
  showStatusIndicator?: boolean
  /** Whether key is in active state */
  isActive?: boolean
  /** Disable key interactions */
  disabled?: boolean
  /** Whether key is currently pressed (from external events) */
  isPressed?: boolean
  /** Custom color for pressed state */
  pressedColor?: string
  showDualState?: boolean
}

export interface LEDIndicatorProps {
  /** Whether the LED is in active state */
  isActive: boolean
}

export interface KeyLabelProps {
  /** Label content */
  label: React.ReactNode | string | string[]
  /** Whether label is a string */
  isStringLabel: boolean
  /** Whether label is an array */
  isArrayLabel: boolean
}
