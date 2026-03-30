/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-10 21:14:44
 */
// Shared UI variant tokens for size etc.
// Reuse these in Button, Input, Select, etc.

// Height standards: 24px, 28px, 32px, 36px
// Naming: xs(24) / sm(28) / md(32) / lg(36)
export const sizeVariants = {
  xs: 'h-[24px] px-2 py-1 has-[>svg]:px-2 rounded-[6px]',
  sm: 'h-[28px] px-3 py-1 has-[>svg]:px-2.5 rounded-[6px]',
  md: 'h-[32px] px-4 py-2 has-[>svg]:px-3 rounded-[6px]',
  lg: 'h-[36px] px-5 py-2 has-[>svg]:px-4 rounded-[6px]',
  xl: 'h-[40px] px-6 py-2 has-[>svg]:px-5 rounded-[8px]',
  xxl: 'h-[44px] px-7 py-2 has-[>svg]:px-6 rounded-[8px]',
  xxxl: 'h-[48px] px-8 py-2 has-[>svg]:px-7 rounded-[12px]',
  icon: 'size-9 rounded-[8px]',
  // Aliases for backward compatibility
  default: 'h-8 px-4 py-2 has-[>svg]:px-3 rounded-[6px]', // = md
  mini: 'h-[24px] px-2 py-1 has-[>svg]:px-2 rounded-[6px]', // = xs
} as const

// Shared active state class (no hard-coded colors)
// Use for buttons, chips, toolbar items, etc.
export const activeClass =
  'bg-[var(--active-bg-button-color)] text-[var(--active-text-color)] border border-[var(--active-border-color)]' as const
