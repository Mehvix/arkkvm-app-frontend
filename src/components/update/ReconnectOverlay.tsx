import { Loading } from '@/components/ui/Loading'
import { useAppStore } from '@/stores'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'

const RECONNECT_DELAY_SECONDS = 15

export function ReconnectOverlay() {
  const { t } = useTranslation('settings')
  const [countdown, setCountdown] = useState(RECONNECT_DELAY_SECONDS)

  const isVisible = useAppStore(s => s.update.isReconnectOverlayVisible)
  const hideOverlay = useAppStore.getState().update.hideReconnectOverlay

  useEffect(() => {
    if (!isVisible) {
      setCountdown(RECONNECT_DELAY_SECONDS)
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible])

  useEffect(() => {
    if (isVisible && countdown === 0) {
      hideOverlay()
    }
  }, [isVisible, countdown, hideOverlay])

  const handleReconnectNow = useCallback(() => {
    hideOverlay()
  }, [hideOverlay])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col items-center gap-6 p-8 text-center"
          >
            {}
            <div className="relative">
              <Loading type="spinner" size="xl" color="blue" />
            </div>

            {}
            <h2 className="text-2xl font-semibold text-white">
              {t('updateDialog.reconnect.title', {
                defaultValue: 'Update Completed',
              })}
            </h2>

            {}
            <p className="max-w-md text-base text-gray-300">
              {t('updateDialog.reconnect.desc', {
                defaultValue:
                  'Your device has been updated successfully. Reconnecting in {{seconds}} seconds...',
                seconds: countdown,
              })}
            </p>

            {}
            <Button onClick={handleReconnectNow}>
              {t('updateDialog.reconnect.reconnectNow', {
                defaultValue: 'Reconnect Now',
              })}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
