/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-06 02:44:23
 */
/*
 * Common formatting utilities
 */

/**
 * Human readable bytes, e.g. 1.23 GB
 */
export function humanSize(n?: number | null): string {
  if (n == null || Number.isNaN(Number(n))) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const
  let v = Number(n)
  let i = 0
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i++
  }
  return `${v.toFixed(2)} ${units[i]}`
}

/**
 * Format speed in bytes/sec to human readable, e.g. 12.3 MB/s
 */
export function formatSpeed(bps?: number | null): string {
  if (!bps) return '0 B/s'
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'] as const
  let v = bps
  let i = 0
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i++
  }
  return `${v.toFixed(1)} ${units[i]}`
}

/**
 * Simple ETA in m/s given remainingBytes and speed (B/s)
 */
export function formatETA(remainingBytes: number, bps: number): string {
  if (!bps || !remainingBytes) return '--'
  const sec = Math.max(0, Math.round(remainingBytes / bps))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
