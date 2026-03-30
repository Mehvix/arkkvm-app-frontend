declare global {
  interface Window {
    customLog: (...args: any[]) => void
    __console_log_enhanced__?: boolean
  }
}

;(function registerGlobalConsoleLog() {
  if (typeof window === 'undefined') return
  if ((window as any).__console_log_enhanced__) return
  if (typeof window.customLog === 'function') {
    ;(window as any).__console_log_enhanced__ = true
    return
  }

  const isProd = Boolean((import.meta as any)?.env?.PROD)

  if (isProd) {
    window.customLog = () => {}
    ;(window as any).__console_log_enhanced__ = true
    return
  }

  const originalConsoleLog = console.log.bind(console)
  window.customLog = (...args: any[]) => {
    originalConsoleLog(...args)
    window.dispatchEvent(
      new CustomEvent('app:console-log', {
        detail: { level: 'log', ts: Date.now(), args },
      })
    )
  }
  ;(window as any).__console_log_enhanced__ = true
})()
