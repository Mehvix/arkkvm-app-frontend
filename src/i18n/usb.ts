/*
 * USB state i18n accessors
 * Reads labels from i18next resources under key: common:usb.state.<state>
 */
import i18n from '@/i18n'
import { getStatusColor } from '@/ui/statusColors'

export type USBStates =
  | 'configured'
  | 'attached'
  | 'addressed'
  | 'not attached'
  | 'suspended'
  | 'disconnected'

export function getUsbStateLabel(
  state: USBStates,
  locale?: 'en' | 'zh'
): string {
  const lng = locale ?? (i18n.language as 'en' | 'zh')
  const t = i18n.getFixedT(lng)
  const key = `usb.state.${state}`
  // Use namespaced lookup with fallback to key itself if missing
  const label = t(`common:${key}`, key)
  return label
}

// Tailwind text color for each USB state (semantic colors for dark UI)
export function getUsbStateColor(state: USBStates): string {
  return getStatusColor('usb', state)
}

export function getUsbStateVisual(state: USBStates, locale?: 'en' | 'zh') {
  return {
    label: getUsbStateLabel(state, locale),
    colorClass: getUsbStateColor(state),
  } as const
}
