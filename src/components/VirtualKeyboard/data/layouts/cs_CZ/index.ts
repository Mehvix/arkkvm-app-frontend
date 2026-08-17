/**
 * @Purpose: Czech keyboard layout
 * @Author: zhanglei
 * @Date: 2026-01-23 11:07:09
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-08-04 15:53:52
 */
import type { LanguageLayoutModule } from '../types';
import { csCZMeta as meta } from '../meta';
import { winLayout } from './windows';
import { getSpecialChars } from './specialChars';
import { macLayout } from './mac';

const csCZ: LanguageLayoutModule = {
  meta,
  windows: winLayout,
  mac: macLayout,
  getSpecialChars,
};

export { getSpecialChars };

export default csCZ;
