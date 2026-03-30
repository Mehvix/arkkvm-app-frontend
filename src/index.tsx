/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-31 22:33:00
 */
/**
 * Application entry point.
 * Initializes logger, error handlers, mobile debug tools, and renders the React app.
 */
import 'animate.css'
import './autofill-override.css'
import './global.css'

import ReactDOM from 'react-dom/client'
import App from './App'
import { initializeLoggerConfig } from './config/logger.config'
import './i18n'
import { createLogger } from './utils/logger'
import { initMobileDebug } from './utils/mobileDebug'

const logger = createLogger('App')

initializeLoggerConfig()

window.addEventListener('error', event => {
  if (
    event.error &&
    event.error.message &&
    event.error.message.includes('Extension context invalidated')
  ) {
    logger.warn('Browser extension context invalidated, ignoring error')
    event.preventDefault()
    return false
  }
})

window.addEventListener('unhandledrejection', event => {
  if (
    event.reason &&
    event.reason.message &&
    event.reason.message.includes('Extension context invalidated')
  ) {
    logger.warn('Browser extension promise rejected, ignoring error')
    event.preventDefault()
  }
})
;(() => {
  if (typeof document === 'undefined') return
  const name = 'viewport'
  let meta = document.querySelector(
    `meta[name="${name}"]`
  ) as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }
  const content =
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover'
  if (meta.content !== content) meta.setAttribute('content', content)
})()

initMobileDebug()

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(<App />)
}
