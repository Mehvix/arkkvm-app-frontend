/**
 * @Purpose: UK English keyboard layout
 * @Author: zhanglei
 * @Date: 2026-01-23
 */
import type { LanguageLayoutModule } from '../types';
import { enGBMeta as meta } from '../meta';
import { UK_WIN_LAYOUT } from './windows';
import { macLayout } from './mac';
const enGB: LanguageLayoutModule = {
  meta,
  windows: UK_WIN_LAYOUT,
  mac: macLayout,
};

export default enGB;
