import type { LanguageLayoutModule, LayoutMeta } from '../types'
import { CZ_WIN_LAYOUT } from './windows'

export const meta: LayoutMeta = {
  id: 'cs-CZ-qwerty',
  tag: 'CZ',
  name: '捷克 – QWERTY',
  nativeName: 'Čeština',
  layout: 'qwerty',
  standard: 'iso',
  region: 'europe',
  priority: 11,
  hasAltGr: true,
}

const csCZ: LanguageLayoutModule = {
  meta,
  windows: CZ_WIN_LAYOUT,
}

export default csCZ
