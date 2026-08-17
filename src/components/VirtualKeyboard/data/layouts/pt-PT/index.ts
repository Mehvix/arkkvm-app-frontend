/*
 * @Author: zhanglei
 * @Date: 2026-07-02 17:27:41
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-09 15:54:49
 */
import type { LanguageLayoutModule } from '../types';
import { ptPTMeta as meta } from '../meta';
import { winLayout } from './windows';
import { getSpecialChars } from './specialChars';
import { macLayout } from './mac';

const ptPT: LanguageLayoutModule = {
  meta,
  windows: winLayout,
  mac:macLayout,
  getSpecialChars,
};

export { getSpecialChars };

export default ptPT;
