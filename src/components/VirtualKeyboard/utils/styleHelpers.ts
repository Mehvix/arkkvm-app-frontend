/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-11-03 14:42:29
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-15 18:20:27
 */
import { KEY_STYLES } from '../constants';

/**
 * Utility functions for generating key styles
 */

export interface StyleConfig {
  disabled: boolean
  isPressed: boolean
  isActive: boolean
  compact: boolean
  isFixedWidth: boolean
}

/**
 * Get state-dependent styles for a key
 *
 * @param config - Style configuration object
 * @returns Array of CSS class strings
 */
export const getKeyStateStyles = (config: StyleConfig) => {
  const { disabled, isPressed, isActive } = config;

  if (disabled) {
    return KEY_STYLES.states.disabled;
  }

  if (isPressed) {
    return KEY_STYLES.states.pressed;
  }

  if (isActive) {
    return KEY_STYLES.states.active;
  }

  return KEY_STYLES.states.normal;
};

/**
 * Get conditional styles for a key
 *
 * @param config - Style configuration object
 * @returns Array of CSS class strings
 */
export const getKeyConditionalStyles = (config: StyleConfig) => {
  const { compact, isFixedWidth } = config;

  return [
    compact ? 'm-0 h-5' : 'm-[2px] h-10',
    isFixedWidth ? 'flex-none' : 'flex-1 basis-0  min-w-[10px] md:min-w-[32px]',
  ];
};

/**
 * Generate complete key styles
 *
 * @param config - Style configuration object
 * @returns Array of CSS class strings
 */
export const generateKeyStyles = (config: StyleConfig) => {
  return [
    ...KEY_STYLES.base,
    ...getKeyConditionalStyles(config),
    ...getKeyStateStyles(config),
  ];
};
