import type { LanguageLayoutModule, LayoutMeta } from '../types';
import { NL_BE_WIN_LAYOUT } from './windows';

export const meta: LayoutMeta = {
  id: 'nl-BE-azerty',
  tag: 'NL-BE',
  name: 'Dutch (Belgium)',
  nativeName: 'Dutch (Belgium)',
  layout: 'azerty',
  standard: 'iso',
  region: 'europe',
  priority: 15,
  recommended: false,
  hasAltGr: true,
};

const nlBE: LanguageLayoutModule = {
  meta,
  windows: NL_BE_WIN_LAYOUT,
};

export default nlBE;
