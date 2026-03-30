// Centralized status color definitions for Tailwind classes
// Use semantic palette keys across domains (usb/rtc/network/etc.)

export const StatusPalette = {
  ok: 'text-emerald-400',
  warn: 'text-amber-400',
  info: 'text-sky-400',
  error: 'text-rose-400',
  idle: 'text-zinc-400',
} as const

// Registry maps a domain.state to a palette key
export const StatusColorRegistry: Record<string, keyof typeof StatusPalette> = {
  // USB
  'usb.configured': 'ok',
  'usb.attached': 'warn',
  'usb.addressed': 'warn',
  'usb.suspended': 'info',
  'usb.not attached': 'error',
  'usb.disconnected': 'error',

  // RTC PeerConnection states
  'rtc.peer.new': 'warn',
  'rtc.peer.connecting': 'warn',
  'rtc.peer.connected': 'ok',
  'rtc.peer.disconnected': 'error',
  'rtc.peer.failed': 'error',
  'rtc.peer.closed': 'idle',

  // RTC DataChannel states
  'rtc.rpc.connecting': 'warn',
  'rtc.rpc.open': 'ok',
  'rtc.rpc.closing': 'warn',
  'rtc.rpc.closed': 'error',
}

export function getStatusColor(kind: string, state: string): string {
  const key = `${kind}.${state}`
  const paletteKey = StatusColorRegistry[key] ?? 'idle'
  return StatusPalette[paletteKey]
}

export function getStatusVisual(kind: string, state: string) {
  return {
    colorClass: getStatusColor(kind, state),
  } as const
}
