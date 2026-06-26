/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-05-06 20:42:27
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-06 21:31:28
 */
import type { LanguageLayoutModule } from '../types';
import { meta } from './meta';
import { winLayout } from './windows';

const frFR: LanguageLayoutModule = {
  meta,
  windows: winLayout,
};

export default frFR;
