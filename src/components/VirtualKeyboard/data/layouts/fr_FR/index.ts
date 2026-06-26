import type { LanguageLayoutModule, LayoutMeta } from '../types';
import { macLayout } from './macOs';
import { winLayout } from './windows';

export const meta: LayoutMeta = {
  id: 'fr-FR-azerty',
  tag: 'fr-FR',
  name: 'French (France)',
  nativeName: 'Français (France)',
  layout: 'azerty',
  standard: 'iso',
  region: 'europe',
  priority: 15,
  recommended: true,
  hasAltGr: true,
};

const frFR: LanguageLayoutModule = {
  meta,
  windows: winLayout,
  mac: macLayout,
};

export default frFR;
