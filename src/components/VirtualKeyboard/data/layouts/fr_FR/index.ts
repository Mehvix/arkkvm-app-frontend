/*
 * @Author: zhanglei
 * @Date: 2026-03-30 15:18:35
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-10 22:33:45
 */
import type { LanguageLayoutModule } from '../types';
import { macLayout } from './mac';
import { winLayout } from './windows';
import { getSpecialChars } from './specialChars';
import { frFRMeta as meta } from '../meta';


const frFR: LanguageLayoutModule = {
  meta,
  windows: winLayout,
  mac: macLayout,
  getSpecialChars,
};
export { getSpecialChars };
export default frFR;
