/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-01-10 11:14:20
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-04-20 15:45:21
 */

export const toNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

export const toPositiveInt = (v: unknown, fallback = 0): number => {
  const n = toNumber(v, fallback);
  return n > 0 ? Math.floor(n) : fallback;
};

export const toString = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback;

export const toBoolean = (v: unknown, fallback = false): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    if (v.toLowerCase() === 'true') return true;
    if (v.toLowerCase() === 'false') return false;
  }
  if (typeof v === 'number') return v !== 0;
  return fallback;
};
export const toFixedNumber = (v: unknown, digits = 2, fallback = 0): number => {
  let n: number;
  if (typeof v === 'number') {
    n = v;
  } else if (typeof v === 'string') {
    const parsed = Number(v.trim());
    n = Number.isFinite(parsed) ? parsed : fallback;
  } else {
    n = fallback;
  }
  const d = Math.min(20, Math.max(0, Math.trunc(digits)));
  return Number(n.toFixed(d));
};

/**
 * Normalize URL by removing duplicate slashes
 * @example normalizeUrl('http://localhost:3000//api/v1/user') => 'http://localhost:3000/api/v1/user'
 * @example normalizeUrl('//url/de/ddd') => '/url/de/ddd'
 */
export const normalizeUrl = (url: string): string => {
  return url.replace(/(^|[^:])\/{2,}/g, '$1/');

};
