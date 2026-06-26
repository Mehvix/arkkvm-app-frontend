/**
 * @Purpose: German keyboard layout
 * @Author: zhanglei
 * @Date: 2026-01-23
 */
import type { LanguageLayoutModule, LayoutMeta } from '../types';
import { DE_WIN_LAYOUT } from './windows';

/** German layout metadata */
export const meta: LayoutMeta = {
  id: 'de-DE-qwertz',
  tag: 'DE',
  name: 'German – QWERTZ',
  nativeName: 'Deutsch (Deutschland)',
  layout: 'qwertz',
  standard: 'iso',
  region: 'europe',
  priority: 12,
  hasAltGr: true,
};

/** German layout module */
const deDE: LanguageLayoutModule = {
  meta,
  windows: DE_WIN_LAYOUT,
  // mac: DE_MAC_LAYOUT, // Add when needed
};

export default deDE;
