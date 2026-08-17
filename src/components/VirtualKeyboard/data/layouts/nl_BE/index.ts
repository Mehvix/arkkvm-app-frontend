/**
 * @Author: zhanglei
 * @Date: 2026-01-28 23:41:23
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-08-04 22:07:25
 */
import type { LanguageLayoutModule } from '../types';
import { nlBEMeta as meta } from '../meta';
import { NL_BE_WIN_LAYOUT } from './windows';
import { macLayout } from './mac';

const nlBE: LanguageLayoutModule = {
  meta,
  windows: NL_BE_WIN_LAYOUT,
  mac: macLayout,
};

export default nlBE;
