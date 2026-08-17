/*
 * @Author: zhanglei
 * @Date: 2026-05-14 21:03:09
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-09 22:55:07
 */
/**
 * @Purpose: Spanish keyboard layout
 * @Author: zhanglei
 * @Date: 2026-05-06 20:42:27
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-02 16:54:00
 */
import type { LanguageLayoutModule } from '../types';
import { esESMeta as meta } from '../meta';
import { winLayout } from './windows';
import { getSpecialChars } from './specialChars';
import { macLayout } from './mac';

const esES: LanguageLayoutModule = {
  meta,
  windows: winLayout,
  getSpecialChars,
   mac:macLayout,
};

/** Export special characters for external use */
export { getSpecialChars };

export default esES;
