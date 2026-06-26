/**
 * @Purpose: UK English keyboard layout
 * @Author: zhanglei
 * @Date: 2026-01-23
 */
import type { LanguageLayoutModule, LayoutMeta } from '../types';
import { UK_WIN_LAYOUT } from './windows';

/** UK English layout metadata */
export const meta: LayoutMeta = {
  id: 'en-GB-qwerty',
  tag: 'UK',
  name: 'UK English – QWERTY',
  nativeName: 'English (UK)',
  layout: 'qwerty',
  standard: 'iso',
  region: 'europe',
  priority: 2,
  recommended: true,
  hasAltGr: true,
  note: 'UK ISO layout',
};

/** UK English layout module */
const enGB: LanguageLayoutModule = {
  meta,
  windows: UK_WIN_LAYOUT,
};

export default enGB;
