/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-12-30 20:26:56
 */
import { useAppStore, useRTCStore } from '@/stores'
import React from 'react'
import { useTranslation } from 'react-i18next'
function useQuery() {
  const [params] = React.useState(
    () => new URLSearchParams(window.location.search)
  )
  return params
}

export default function SessionTakeoverPage() {
  const { t } = useTranslation('common')
  const query = useQuery()
  const deviceId = query.get('deviceId') || ''
  const from = query.get('from') || '/devices'
  const rtc = useRTCStore()
  const resetHID = useAppStore(s => s.resetHID)

  // Reset RTC/HID state to initial when entering takeover page
  React.useEffect(() => {
    try {
      rtc?.resetRTC?.()
    } catch (e) {
      console.warn('[SessionTakeover] resetRTC failed', e)
    }
    try {
      resetHID?.()
    } catch (e) {
      console.warn('[SessionTakeover] resetHID failed', e)
    }
    // We only want to execute on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUseHere = () => {
    // TODO: integrate with your signaling layer (e.g., JSON-RPC) to request takeover
    // Example (pseudo): rpc.call('takeover', { deviceId })
    // Navigate back to from
    try {
      if (from) {
        window.location.assign(from)
      } else {
        window.history.back()
      }
    } catch {
      window.location.assign('/devices')
    }
  }

  const handleCancel = () => {
    // Cancel and go back to previous page
    if (from) {
      window.location.assign(from)
    } else {
      window.history.back()
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-900 text-neutral-100">
      <div className="rounded-xl bg-neutral-800/80 backdrop-blur p-6 w-[420px] shadow-xl border border-neutral-700/50">
        <div className="text-lg font-semibold">{t('session.active.title')}</div>
        <div className="mt-2 text-xs text-neutral-300">
          {t('session.active.desc')}
        </div>
        {deviceId && (
          <div className="mt-2 text-xs text-neutral-400">
            Device: <span className="font-mono">{deviceId}</span>
          </div>
        )}
        <div className="mt-5 flex gap-2 justify-end">
          <button
            className="px-3 py-2 rounded bg-neutral-700 hover:bg-neutral-600"
            onClick={handleCancel}
          >
            {t('session.active.cancel')}
          </button>
          <button
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500"
            onClick={handleUseHere}
          >
            {t('session.active.use_here')}
          </button>
        </div>
      </div>
    </div>
  )
}
