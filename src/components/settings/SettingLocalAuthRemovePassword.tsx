import { request } from '@/api'
import { createLogger } from '@/utils/logger'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import SettingBlock from './SettingBlock'
import type { SettingLocalAuthProps } from './SettingLocalAuth'

const logger = createLogger('SettingLocalAuthRemovePassword')

const SettingLocalAuth = function SettingLocalAuth({
  onClose,
}: SettingLocalAuthProps) {
  const { t } = useTranslation('settings')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successPannel, setSuccessPannel] = useState(false)
  const [loading, setLoading] = useState(false)
  function handleClose() {
    onClose && onClose()
  }

  const handleRemovePassword = async () => {
    if (password === '') {
      setError(t('accessibility.removePassword.errorEmpty'))
      return
    }

    try {
      setLoading(true)
      const res = await request.delete(
        '/auth/local-password',
        { timeout: 3000 },
        { password }
      )
      setLoading(false)
      if ('error' in res) {
        setError(res.error || t('accessibility.removePassword.errorGeneral'))
      } else {
        setSuccessPannel(true)
      }
    } catch (error) {
      logger.error('Failed to remove password', error)
      setError(t('accessibility.removePassword.errorGeneral'))
    }
  }

  return (
    <>
      {successPannel ? (
        <SettingBlock
          title={t('accessibility.removePassword.successTitle')}
          content={t('accessibility.removePassword.successDesc')}
        >
          <SettingBlock.Bottom>
            <div className="flex gap-x-2">
              <Button
                className=""
                size="xs"
                variant="outline"
                onClick={handleClose}
              >
                {t('accessibility.removePassword.close')}
              </Button>
            </div>
          </SettingBlock.Bottom>
        </SettingBlock>
      ) : (
        <SettingBlock
          title={t('accessibility.removePassword.title')}
          content={t('accessibility.removePassword.desc')}
        >
          <div className="mb-4">
            <Input
              size="xs"
              label={t('accessibility.removePassword.currentPassword')}
              type="password"
              id="new-password"
              placeholder={t(
                'accessibility.removePassword.currentPasswordPlaceholder'
              )}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="mb-4 text-sm text-red-500"> {error} </div>}

          <div className="flex gap-x-2">
            <Button
              loading={loading}
              size="xs"
              variant="primary"
              onClick={handleRemovePassword}
            >
              {t('accessibility.removePassword.disableProtection')}
            </Button>
            <Button size="xs" onClick={handleClose}>
              {t('accessibility.removePassword.cancel')}
            </Button>
          </div>
        </SettingBlock>
      )}
    </>
  )
}

export default SettingLocalAuth
