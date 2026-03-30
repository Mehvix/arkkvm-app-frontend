import { request } from '@/api'
import { createLogger } from '@/utils/logger'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import SettingBlock from './SettingBlock'
import type { SettingLocalAuthProps } from './SettingLocalAuth'

const logger = createLogger('SettingLocalAuthCreatePassword')

const SettingLocalAuth = function SettingLocalAuth({
  onClose,
}: SettingLocalAuthProps) {
  const { t } = useTranslation('settings')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successPannel, setSuccessPannel] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleClose() {
    onClose && onClose()
  }

  const handleCreatePassword = async () => {
    if (password === '') {
      setError(t('accessibility.localAuth.errorEmpty'))
      return
    }

    if (/\s/.test(password)) {
      setError(t('accessibility.localAuth.errorSpaces'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('accessibility.localAuth.errorMismatch'))
      return
    }
    try {
      setLoading(true)
      const res: any = await request.post('/auth/password-local', { password })
      setLoading(false)
      if ('error' in res) {
        setError(res.error || t('accessibility.localAuth.errorGeneral'))
      } else {
        setSuccessPannel(true)
      }
    } catch (error) {
      logger.error('Failed to create password', error)
      setError(t('accessibility.localAuth.errorGeneral'))
    }
  }

  return (
    <>
      {successPannel ? (
        <SettingBlock
          title={t('accessibility.localAuth.successTitle')}
          content={t('accessibility.localAuth.successDesc')}
        >
          <SettingBlock.Bottom>
            <div className="flex gap-x-2">
              <Button
                className=""
                size="xs"
                variant="outline"
                onClick={handleClose}
              >
                {t('accessibility.localAuth.close')}
              </Button>
            </div>
          </SettingBlock.Bottom>
        </SettingBlock>
      ) : (
        <SettingBlock
          title={t('accessibility.localAuth.title')}
          content={t('accessibility.localAuth.desc')}
        >
          <SettingBlock.Bottom>
            <div className="mb-4">
              <Input
                size="xs"
                label={t('accessibility.localAuth.newPassword')}
                type="password"
                id="new-password"
                placeholder={t(
                  'accessibility.localAuth.newPasswordPlaceholder'
                )}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <Input
                size="xs"
                label={t('accessibility.localAuth.confirmPassword')}
                type="password"
                id="confirm-password"
                placeholder={t(
                  'accessibility.localAuth.confirmPasswordPlaceholder'
                )}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="mb-4 text-sm text-red-500"> {error} </div>
            )}

            <div className="flex gap-x-2">
              <Button
                loading={loading}
                size="xs"
                variant="primary"
                onClick={handleCreatePassword}
              >
                {t('accessibility.localAuth.secureDevice')}
              </Button>
              <Button size="xs" variant="default" onClick={handleClose}>
                {t('accessibility.localAuth.notNow')}
              </Button>
            </div>
          </SettingBlock.Bottom>
        </SettingBlock>
      )}
    </>
  )
}

export default SettingLocalAuth
