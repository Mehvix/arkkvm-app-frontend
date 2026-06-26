/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-14 15:45:53
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-03-26 22:32:42
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ensurePrefixed } from './ensurePrefixed';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function pn(...inputs: ClassValue[]) {
  return twMerge(ensurePrefixed(clsx(...inputs)));
}
