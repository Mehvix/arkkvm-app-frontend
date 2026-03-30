import type { LanguageLayoutModule, LayoutMeta } from '../types'
import { UK_WIN_LAYOUT } from './windows'

export const meta: LayoutMeta = {
  id: 'en-GB-qwerty',
  tag: 'UK',
  name: '英国英语 – QWERTY',
  nativeName: 'English (UK)',
  layout: 'qwerty',
  standard: 'iso',
  region: 'europe',
  priority: 2,
  recommended: true,
  hasAltGr: true,
  note: 'UK ISO layout',
}

const enGB: LanguageLayoutModule = {
  meta,
  windows: UK_WIN_LAYOUT,
}

export default enGB
