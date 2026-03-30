import type { LanguageLayoutModule, LayoutMeta } from '../types'
import { US_WIN_LAYOUT } from './windows'
// import { US_MAC_LAYOUT } from './mac'

export const meta: LayoutMeta = {
  id: 'en-US-qwerty',
  tag: 'US',
  name: '美国英语 – QWERTY',
  nativeName: 'English (US)',
  layout: 'qwerty',
  standard: 'ansi',
  region: 'americas',
  priority: 1,
  recommended: true,
  hasAltGr: false,
  note: 'Recommended for KVM / BIOS / CLI',
}

const enUS: LanguageLayoutModule = {
  meta,
  windows: US_WIN_LAYOUT,
}

export default enUS
