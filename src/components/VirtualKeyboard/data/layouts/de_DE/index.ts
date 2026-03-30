import type { LanguageLayoutModule, LayoutMeta } from '../types'
import { DE_WIN_LAYOUT } from './windows'

export const meta: LayoutMeta = {
  id: 'de-DE-qwertz',
  tag: 'DE',
  name: '德语 – QWERTZ',
  nativeName: 'Deutsch (Deutschland)',
  layout: 'qwertz',
  standard: 'iso',
  region: 'europe',
  priority: 12,
  hasAltGr: true,
}

const deDE: LanguageLayoutModule = {
  meta,
  windows: DE_WIN_LAYOUT,
}

export default deDE
