/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-14 15:45:53
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-21 16:14:06
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ensurePrefixed } from './ensurePrefixed'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function pn(...inputs: ClassValue[]) {
  return twMerge(ensurePrefixed(clsx(...inputs)))
}
