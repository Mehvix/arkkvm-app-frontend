import { Loading } from '@/components/ui/Loading'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'

interface RestartOverlayProps {
  isVisible: boolean
  onClose: () => void
  delaySeconds?: number
}

export function RestartOverlay({
  isVisible,
  onClose,
  delaySeconds = 15,
}: RestartOverlayProps) {
  const { t } = useTranslation('common')
  const [countdown, setCountdown] = useState(delaySeconds)

  useEffect(() => {
    if (!isVisible) {
      setCountdown(delaySeconds)
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
  }, [isVisible, delaySeconds])

  useEffect(() => {
    if (isVisible && countdown === 0) {
      onClose()
    }
  }, [isVisible, countdown, onClose])

  const handleReconnectNow = useCallback(() => {
    onClose()
  }, [onClose])

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
              {t('restart.title', { defaultValue: 'Device Restarting' })}
            </h2>

            {}
            <p className="max-w-md text-base text-gray-300">
              {t('restart.desc', {
                defaultValue:
                  'Your device is restarting. Reconnecting in {{seconds}} seconds...',
                seconds: countdown,
              })}
            </p>

            {}
            <Button onClick={handleReconnectNow}>
              {t('reconnect', { defaultValue: 'Reconnect Now' })}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
