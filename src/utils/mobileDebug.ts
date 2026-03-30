/**
 * Lightweight mobile debugging console loader using Eruda.
 * Usage:
 *  - Add `?debug=1` to URL, or set `localStorage.setItem('eruda', 'true')` to persist
 *  - Call `initMobileDebug()` as early as possible (e.g., in index.tsx)
 */
export function initMobileDebug() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const qs = new URLSearchParams(window.location.search)
  const enabled =
    qs.get('debug') === '1' || localStorage.getItem('eruda') === 'true'
  if (!enabled) return

  // Avoid duplicate loads
  if ((window as any).__eruda_loading || (window as any).eruda) return
  ;(window as any).__eruda_loading = true

  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/eruda@3.4.1/eruda.min.js'
  script.async = true
  script.onload = () => {
    try {
      ;(window as any).eruda?.init()
      ;(window as any).eruda?.show()
      console.log('[mobileDebug] Eruda initialized')
    } catch (e) {
      console.warn('[mobileDebug] Eruda init failed', e)
    }
  }
  script.onerror = () => {
    console.warn('[mobileDebug] Failed to load Eruda script')
  }
  document.head.appendChild(script)
}
