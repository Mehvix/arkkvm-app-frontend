/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-05-26 18:50:01
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-28 11:48:50
 */
export function parseVersions(input: unknown): string | null {
  if (!input) return 'v-default';

  let parsed: unknown = input;

  // If string, try to parse as JSON (handle double-encoded)
  if (typeof input === 'string') {
    // Try parsing up to 2 times for double-encoded JSON
    for (let i = 0; i < 2; i++) {
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          // Not valid JSON, treat as plain version string
          break;
        }
      }
    }
  }

  // If result is an object, try to extract webVersion
  if (parsed && typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.webVersion === 'string') {
      return obj.webVersion;
    }
    // No webVersion field found
    return 'v-default';
  }

  // If it's a plain string (not JSON), return it as version
  if (typeof parsed === 'string') {
    return parsed;
  }

  return 'v-default';
}
export type ErrorReasonSegmentIndex = 0 | 1 | 2 | 3 | 4 | 5
export type ErrorReasonDelimiter = ':' | '_' | ',' | '-' | ' ' | RegExp
export interface GetErrorReasonKeyOptions {
  segmentIndex?: ErrorReasonSegmentIndex
  delimiter?: ErrorReasonDelimiter
  fallbackToLast?: boolean
}
export function getErrorReasonKey(
  message?: string | null,

  options: GetErrorReasonKeyOptions = {}
): string {
  if (!message) return '';

  const {
    segmentIndex = 1,

    delimiter = ':',

    fallbackToLast = false,
  } = options;

  const segment = pickMessageSegment(message, {
    segmentIndex,

    delimiter,

    fallbackToLast,
  });

  return toCamelCase(segment);
}

function pickMessageSegment(
  message: string,

  options: Required<GetErrorReasonKeyOptions>
): string {
  const { segmentIndex, delimiter, fallbackToLast } = options;

  const normalizedMessage = normalizeErrorText(message);

  const parts = normalizedMessage

    .split(delimiter||':')

    .map(item => item.trim())

    .filter(Boolean);

  if (parts.length === 0) return '';

  return parts[segmentIndex??1] ?? (fallbackToLast ? parts[parts.length - 1] : '');
}

function normalizeErrorText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function toCamelCase(value: string): string {
  return value

    .trim()

    .toLowerCase()

    .replace(/[^a-z0-9]+([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}
