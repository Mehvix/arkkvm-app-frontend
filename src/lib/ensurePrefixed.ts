/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-16 15:46:15
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-16 15:47:14
 */
import { env } from '@/utils/env'
const { cssPrefix } = env
const DEFAULT_PREFIX = cssPrefix || 'jg'

function hasPrefix(token: string, prefix: string) {
  return (
    token.startsWith(`${prefix}:`) || // text-xl
    token.startsWith(`${prefix}-`) ||
    token.split(':').includes(prefix) // md:hover:bg-blue-500
  )
}

export function ensurePrefixed(
  classStr: string,
  prefix: string = DEFAULT_PREFIX
): string {
  if (!classStr) return ''

  return classStr
    .split(/\s+/)
    .filter(Boolean)
    .map(token => (hasPrefix(token, prefix) ? token : `${prefix}:${token}`))
    .join(' ')
}
