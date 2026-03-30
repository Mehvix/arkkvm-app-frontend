/**
 * @Purpose: Page metadata type definitions
 * @Description: Defines the structure and documentation for page-level configuration
 * @Author: zhanglei
 */

/**
 * Page deployment target environment
 */
export type PageTarget = 'device' | 'cloud' | 'universal'

/**
 * Page metadata configuration
 *
 * This interface defines the metadata for each page route, including
 * authentication requirements, routing paths, and deployment targets.
 *
 * @example
 * ```typescript
 * export const meta: PageMeta = {
 *   auth: true,
 *   title: 'device.management',
 *   path: '/',
 *   cloudPath: ':v/device/:id',
 *   target: 'universal',
 * }
 * ```
 */
export interface PageMeta {
  /**
   * Whether authentication is required to access this page
   *
   * - `true`: User must be logged in to access
   * - `false`: Public page, no authentication required
   *
   * @default false
   */
  auth: boolean

  /**
   * Page title (i18n key or static string)
   *
   * - Use i18n key format: 'device.management'
   * - Or static string for non-translated titles
   *
   * This will be used for:
   * - Browser tab title
   * - Navigation breadcrumbs
   * - Page header
   *
   * @example 'device.management' | 'settings.network'
   */
  title: string

  /**
   * Device mode routing path
   *
   * The URL path when running in device mode (local hardware).
   * Must start with '/' for absolute paths.
   *
   * @example '/' | '/settings' | '/device/:id'
   */
  path: string

  /**
   * Cloud mode routing path (optional)
   *
   * The URL path when running in cloud mode (remote access).
   * Supports route parameters with ':' prefix.
   * If not provided, will use the same path as device mode.
   *
   * @example ':v/device/:id' | ':v/settings/:section'
   */
  cloudPath?: string

  /**
   * Page deployment target environment
   *
   * Determines which environments this page is available in:
   * - `device`: Only available in device mode (local hardware)
   * - `cloud`: Only available in cloud mode (remote access)
   * - `universal`: Available in both device and cloud modes
   *
   * @default 'universal'
   */
  target: PageTarget

  /**
   * Whether to show this page in navigation menu (optional)
   *
   * - `true`: Show in navigation menu
   * - `false`: Hide from navigation menu
   * - `undefined`: Default behavior (usually shown if auth is required)
   *
   * @default undefined
   */
  isMenu?: boolean
}

/**
 * Type guard to check if a value is a valid PageMeta object
 */
export function isPageMeta(value: unknown): value is PageMeta {
  if (typeof value !== 'object' || value === null) return false

  const meta = value as Partial<PageMeta>

  return (
    typeof meta.auth === 'boolean' &&
    typeof meta.title === 'string' &&
    typeof meta.path === 'string' &&
    (meta.cloudPath === undefined || typeof meta.cloudPath === 'string') &&
    (meta.target === 'device' ||
      meta.target === 'cloud' ||
      meta.target === 'universal') &&
    (meta.isMenu === undefined || typeof meta.isMenu === 'boolean')
  )
}
