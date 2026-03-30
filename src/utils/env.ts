type TargetMode = 'device' | 'cloud'
const isHttps = window.location.protocol === 'https:'
const isSecureContext = (() => {
  if (typeof window.isSecureContext !== 'undefined') {
    return window.isSecureContext
  }
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1'

  return isHttps || isLocalhost
})()

const MODE = import.meta.env.RSB_MODE || import.meta.env.MODE || 'development'
const isDev = MODE === 'development' || import.meta.env.DEV === (true as any)
const target = import.meta.env.RSB_TARGET_MODE || 'device'
const isAgent = target !== 'cloud' && isDev

const withSlash = (s: string) => (s?.endsWith('/') ? s : (s || '') + '/')
const join = (base: string, path: string) =>
  withSlash(base) + String(path || '').replace(/^\//, '')

const API = import.meta.env.RSB_API_BASE_URL || ''
const SIG = import.meta.env.RSB_SIGNALING_URL || ''

// 1) API base：

const apiBaseUrl = isAgent
  ? '/api'
  : API || new URL('', window.location.origin).href

// 2) signaling：

const signalingUrl = (() => {
  if (isDev) {
    if (SIG && /^wss?:\/\//i.test(SIG) && target === 'cloud') return SIG

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    const port = window.location.port || '9000'
    return `${protocol}//${host}:${port}/webrtc/signaling/client`
  }
  if (SIG && /^wss?:\/\//i.test(SIG) && target === 'cloud') return SIG
  return join(apiBaseUrl, '/webrtc/signaling/client')
})()

const officialCloudApiUrl = import.meta.env.RSB_API_BASE_URL_CLOUD || ''
const officialCloudAppUrl = import.meta.env.RSB_APP_BASE_URL_CLOUD || ''
const loginCloudUrl = API
export const env = {
  API,
  SIG,
  target,
  isDev,
  isHttps,
  isSecureContext,
  apiBaseUrl,
  signalingUrl,
  officialCloudApiUrl,
  officialCloudAppUrl,
  loginCloudUrl,
} as const

export type Env = typeof env
