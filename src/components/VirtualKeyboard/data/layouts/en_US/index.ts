/**
 * @Purpose: US English keyboard layout
 * @Author: zhanglei
 * @Date: 2026-01-23
 */
import type { LanguageLayoutModule } from '../types';
import { enUSMeta as meta } from '../meta';
import { US_WIN_LAYOUT } from './windows';
import { macLayout } from './mac';

/** US English layout module */
const enUS: LanguageLayoutModule = {
  meta,
  windows: US_WIN_LAYOUT, // TODO
  mac: macLayout,
};

export default enUS;
