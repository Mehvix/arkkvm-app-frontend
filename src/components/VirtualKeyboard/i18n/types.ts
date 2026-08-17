/**
 * VirtualKeyboard self-contained i18n types.
 *
 * Designed so the component can be extracted as an independent open-source
 * package without relying on an external i18n framework.
 */

/** Supported locale identifiers. */
export type VirtualKeyboardLocale = 'en' | 'zh' | string;

/** Translation message shape used by the virtual keyboard UI. */
export interface VirtualKeyboardTranslations {
  /** Last pressed key label, e.g. "Last pressed: {{key}}". */
  lastPressed: string;
  /** Layout selector label. */
  layout: string;
  /** Windows layout label. */
  windows: string;
  /** Mac layout label. */
  mac: string;
  /** Hide keyboard button label. */
  hide: string;
  /** Active modifier status label. */
  active: string;
  /** Inactive modifier status label. */
  inactive: string;
  /** Modifier status section label. */
  status: string;
}
