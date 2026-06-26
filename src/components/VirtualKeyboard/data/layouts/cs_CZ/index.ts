/**
 * @Purpose: Czech keyboard layout
 * @Author: zhanglei
 * @Date: 2026-01-23 11:07:09
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-23 12:21:47
 */
import type { LanguageLayoutModule, LayoutMeta } from '../types';
import { CZ_WIN_LAYOUT } from './windows';

/** Czech layout metadata */
export const meta: LayoutMeta = {
  id: 'cs-CZ-qwerty',
  tag: 'CZ',
  name: 'Czech – QWERTY',
  nativeName: 'Čeština',
  layout: 'qwerty',
  standard: 'iso',
  region: 'europe',
  priority: 11,
  hasAltGr: true, // Czech keyboard uses AltGr
};

/** Czech layout module */
const csCZ: LanguageLayoutModule = {
  meta,
  windows: CZ_WIN_LAYOUT,
  // mac: CZ_MAC_LAYOUT, // TODO
};

export default csCZ;
