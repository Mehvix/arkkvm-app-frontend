/*
 * RTC state i18n accessors
 * Labels are stored under common:rtc.peer.<state> and common:rtc.rpc.<state>
 */
import i18n from '@/i18n'

export type PeerStates =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed'
export type RpcStates = 'connecting' | 'open' | 'closing' | 'closed'

export function getPeerStateLabel(
  state: PeerStates,
  locale?: 'en' | 'zh'
): string {
  const lng = locale ?? (i18n.language as 'en' | 'zh')
  const t = i18n.getFixedT(lng)
  const key = `rtc.peer.${state}`
  return t(`common:${key}`, state)
}

export function getRpcStateLabel(
  state: RpcStates,
  locale?: 'en' | 'zh'
): string {
  const lng = locale ?? (i18n.language as 'en' | 'zh')
  const t = i18n.getFixedT(lng)
  const key = `rtc.rpc.${state}`
  return t(`common:${key}`, state)
}
