/*
 * @Author: zhanglei
 * @Date: 2025-11-03 14:41:34
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-09 18:40:08
 */
/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-11-03 14:41:34
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-22 23:38:16
 */
/**
 * Constants for VirtualKeyboard components
 */

export const LED_COLORS = {
  active: {
    primary: '#4ade80',
    secondary: '#22c55e',
    glow: 'rgba(74, 222, 128, 0.6)',
    glowSecondary: 'rgba(74, 222, 128, 0.2)',
  },
  inactive: {
    primary: '#9ca3af',
    secondary: '#6b7280',
  },
} as const;

export const ANIMATION_DURATION = 300;

export const GLOW_ANIMATION = 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite';

export const KEY_STYLES = {
  base: [
    'rounded-xs flex items-center justify-center relative',
    'border border-[var(--btn-outline-border)] transition-all duration-100 ease-out',
    'text-base md:text-base select-none pointer-events-auto',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70',
  ],
  states: {
    disabled: [
      'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600',
      'border-gray-200 dark:border-gray-800',
      'cursor-not-allowed opacity-50',
    ],
    pressed: [
      'bg-[var(--btn-outline-bg)] text-[var(--text-color)]',
      'border-[var(--btn-outline-border)]',
      'shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transform translate-y-[2px]',
      'cursor-pointer',
    ],
    active: [
      'bg-blue-500 text-text',
      'border-blue-400',
      'shadow-[0_2px_0_rgba(0,0,0,0.2),0_4px_8px_rgba(59,130,246,0.3)]',
      'cursor-pointer',
    ],
    normal: [
      'bg-[var(--btn-outline-bg)] text-[var(--text-color)]',
      'border-[var(--btn-outline-border)]',
      // Bottom shadow simulates key thickness
      'shadow-[0_3px_0_rgba(0,0,0,0.2),0_4px_6px_rgba(0,0,0,0.1)]',
      'hover:shadow-[0_2px_0_rgba(0,0,0,0.2),0_3px_4px_rgba(0,0,0,0.1)] hover:translate-y-[1px]',
      'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[3px]',
      'cursor-pointer',
    ],
  },
} as const;
