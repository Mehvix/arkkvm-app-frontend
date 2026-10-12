/**
 * @Purpose: English Colemak-DH keyboard layout
 * @Author: colemak-dh contribution
 */
import type { LanguageLayoutModule } from '../types';
import { colemakDHMeta as meta } from '../meta';
import { winLayout } from './windows';
import { macLayout } from './mac';

/** English Colemak-DH layout module */
const colemakDH: LanguageLayoutModule = {
  meta,
  windows: winLayout,
  mac: macLayout,
};

export default colemakDH;
