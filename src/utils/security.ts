/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-05-18 16:15:49
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-26 16:04:59
 */
import { env } from './env';

const BLOCKED_SCHEMES = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'ftp:',
  'blob:',
];

function hasUnsafeControlChars(value: string): boolean {
  return /[\r\n\t]/.test(value);
}

function isUnsafeRelativeRedirect(value: string): boolean {
  const normalized = value.replace(/\\/g, '/').toLowerCase();

  return (
    normalized.startsWith('//') ||
    normalized.startsWith('/%2f') ||
    normalized.startsWith('/%5c')
  );
}

/**
 * Validates a redirect URL and returns it if safe, otherwise returns null.
 *
 * Allowed cases:
 *  - Relative paths starting with '/' but not protocol-relative or encoded protocol-relative URLs
 *  - Absolute HTTPS URLs whose origin matches window.location.origin
 *    or env.officialCloudAppUrl
 */
export function getSafeRedirectUrl(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (hasUnsafeControlChars(trimmed)) return null;

  const lower = trimmed.toLowerCase();

  if (BLOCKED_SCHEMES.some(scheme => lower.startsWith(scheme))) {
    return null;
  }

  if (trimmed.startsWith('/')) {
    if (isUnsafeRelativeRedirect(trimmed)) return null;
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);

    const allowedOrigins = new Set<string>([window.location.origin]);

    if (env.officialCloudAppUrl) {
      allowedOrigins.add(new URL(env.officialCloudAppUrl).origin);
    }

    if (parsed.protocol === 'https:' && allowedOrigins.has(parsed.origin)) {
      return parsed.href;
    }
  } catch {
    // invalid URL
  }

  return null;
}

/**
 * Normalizes and validates a user-configured cloud URL.
 * Returns only the origin: scheme + host + port.
 *
 * Supports both https:// and http:// for private/LAN self-hosted deployments.
 * Returns null if the URL is invalid or uses a disallowed scheme.
 */
export function normalizeCloudOrigin(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  const raw = value.trim();
  if (!raw) return null;

  if (hasUnsafeControlChars(raw)) return null;

  const lower = raw.toLowerCase();

  if (BLOCKED_SCHEMES.some(scheme => lower.startsWith(scheme))) {
    return null;
  }

  if (raw.startsWith('//')) return null;

  try {
    const url = new URL(raw);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    if (!url.hostname) {
      return null;
    }

    if (url.username || url.password) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Sanitize a string for safe HTML rendering to prevent XSS attacks.
 * Escapes HTML special characters: < > " '
 */
export function sanitizeError(msg: string): string {
  return msg
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
