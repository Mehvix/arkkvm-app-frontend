/**
 * @Purpose: German keyboard layout
 * @Author: zhanglei
 * @Date: 2026-01-23
 */
import type { LanguageLayoutModule } from '../types';
import { deDEMeta as meta } from '../meta';
import { DE_WIN_LAYOUT } from './windows';
import { macLayout } from './mac';

/** German layout module */
const deDE: LanguageLayoutModule = {
  meta,
  windows: DE_WIN_LAYOUT,
  mac: macLayout,
};

export default deDE;
