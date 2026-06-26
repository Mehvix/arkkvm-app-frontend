/**
 * @Purpose: Swiss German keyboard layout
 * @Author: zhanglei
 * @Date: 2026-01-26
 */
import type { LanguageLayoutModule, LayoutMeta } from '../types';
import { DE_CH_WIN_LAYOUT } from './windows';

/** Swiss German layout metadata */
export const meta: LayoutMeta = {
  id: 'de-CH-qwertz',
  tag: 'DE-CH',
  name: 'Swiss German – QWERTZ',
  nativeName: 'Deutsch (Schweiz)',
  layout: 'qwertz',
  standard: 'iso',
  region: 'europe',
  priority: 13,
  hasAltGr: true,
};

/** Swiss German layout module */
const deCH: LanguageLayoutModule = {
  meta,
  windows: DE_CH_WIN_LAYOUT,
  // mac: DE_CH_MAC_LAYOUT, // Add when needed
};

export default deCH;
