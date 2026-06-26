/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-16 15:46:15
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-16 15:47:14
 */
import { env } from '@/utils/env';
const { cssPrefix } = env;
const DEFAULT_PREFIX = cssPrefix || 'jg';
/** Check if a token already has a prefix */
function hasPrefix(token: string, prefix: string) {
  return (
    token.startsWith(`${prefix}:`) || // text-xl
    token.startsWith(`${prefix}-`) || // jg-inline-flex (rare)
    token.split(':').includes(prefix) // md:hover:bg-blue-500
  );
}

/**
 * 1. Return empty string for empty input
 * 2. Split by whitespace → remove empty items
 * 3. For each token:
 *    - Already has prefix → keep as is
 *    - Otherwise     → `${prefix}:${token}`
 */
export function ensurePrefixed(
  classStr: string,
  prefix: string = DEFAULT_PREFIX
): string {
  if (!classStr) return '';

  return classStr
    .split(/\s+/) // Split by whitespace
    .filter(Boolean) // Clean up extra spaces
    .map(token => (hasPrefix(token, prefix) ? token : `${prefix}:${token}`))
    .join(' ');
}
