/**
 * @Purpose: US English keyboard layout
 * @Author: zhanglei
 * @Date: 2026-01-23
 */
import type { LanguageLayoutModule, LayoutMeta } from '../types';
import { US_WIN_LAYOUT } from './windows';
// import { US_MAC_LAYOUT } from './mac'

/** US English layout metadata */
export const meta: LayoutMeta = {
  id: 'en-US-qwerty',
  tag: 'US',
  name: 'US English – QWERTY',
  nativeName: 'English (US)',
  layout: 'qwerty',
  standard: 'ansi',
  region: 'americas',
  priority: 1,
  recommended: true,
  hasAltGr: false, // US keyboard does not use AltGr
  note: 'Recommended for KVM / BIOS / CLI',
};

/** US English layout module */
const enUS: LanguageLayoutModule = {
  meta,
  windows: US_WIN_LAYOUT, // TODO
  // mac: US_MAC_LAYOUT, // TODO
};

export default enUS;
