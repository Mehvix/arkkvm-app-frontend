/**
 * @Purpose: Utility for conditionally joining classNames
 * @Description: Combines multiple class names with conditional logic
 * @Author: zhanglei
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names with conditional logic and merges Tailwind classes
 * @param inputs - Class values to be combined
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
