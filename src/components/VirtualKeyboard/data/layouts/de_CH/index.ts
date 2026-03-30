import type { LanguageLayoutModule, LayoutMeta } from '../types'
import { DE_CH_WIN_LAYOUT } from './windows'

export const meta: LayoutMeta = {
  id: 'de-CH-qwertz',
  tag: 'DE-CH',
  name: '瑞士德语 – QWERTZ',
  nativeName: 'Deutsch (Schweiz)',
  layout: 'qwertz',
  standard: 'iso',
  region: 'europe',
  priority: 13,
  hasAltGr: true,
}

const deCH: LanguageLayoutModule = {
  meta,
  windows: DE_CH_WIN_LAYOUT,
}

export default deCH
