/*
 * @Author: zhanglei
 * @Date: 2026-01-23 23:57:11
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-16 19:20:28
 */
/**
 * @Purpose: Swiss German keyboard layout
 * @Author: zhanglei
 * @Date: 2026-01-26
 */
import type { LanguageLayoutModule } from '../types';
import { DE_CH_WIN_LAYOUT } from './windows';
import { deCHMeta as meta } from '../meta';
import { macLayout } from './mac';
import { getSpecialChars } from './specialChars';
const deCH: LanguageLayoutModule = {
  meta,
  windows: DE_CH_WIN_LAYOUT,
  mac: macLayout,
  getSpecialChars,
};

export default deCH;
export { getSpecialChars };
