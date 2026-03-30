import { request } from '@/api'
import { createLogger } from '@/utils/logger'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import SettingBlock from './SettingBlock'
import type { SettingLocalAuthProps } from './SettingLocalAuth'

const logger = createLogger('SettingLocalAuthChangePassword')

const SettingLocalAuth = function SettingLocalAuth({
  onClose,
}: SettingLocalAuthProps) {
  const { t } = useTranslation('settings')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successPannel, setSuccessPannel] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleClose() {
    onClose && onClose()
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setError(t('accessibility.changePassword.errorMismatch'))
      return
    }

    if (oldPassword === '') {
      setError(t('accessibility.changePassword.errorOldEmpty'))
      return
    }

    if (newPassword === '') {
      setError(t('accessibility.changePassword.errorNewEmpty'))
      return
    }

    if (/\s/.test(newPassword)) {
      setError(t('accessibility.changePassword.errorSpaces'))
      return
    }

    try {
      setLoading(true)
      const res = await request.put('/auth/password-local', {
        oldPassword,
        newPassword,
      })
      setLoading(false)
      if ('error' in res) {
        setError(res.error || t('accessibility.changePassword.errorGeneral'))
      } else {
        setSuccessPannel(true)
      }
    } catch (error) {
      logger.error('Failed to change password', error)
      setError(t('accessibility.changePassword.errorGeneral'))
    }
  }
  return (
    <>
      {successPannel ? (
        <div>
          <h2 className="text-lg font-medium mb-[var(--spacing-base)]">
            {t('accessibility.changePassword.successTitle')}
          </h2>
          <p className="mb-[var(--spacing-base)] text-sm text-[var(--inactive-text-color)]">
            {t('accessibility.changePassword.successDesc')}
          </p>
          <div className="flex gap-x-2">
            <Button className="" size="xs" onClick={handleClose}>
              {t('accessibility.changePassword.close')}
            </Button>
          </div>
        </div>
      ) : (
        <SettingBlock
          title={t('accessibility.changePassword.formTitle')}
          content={t('accessibility.changePassword.formDesc')}
        >
          <SettingBlock.Bottom className="flex flex-col gap-y-[16px]">
            <Input
              size="xs"
              type="password"
              id="new-password"
              className="w-full"
              placeholder={t(
                'accessibility.changePassword.oldPasswordPlaceholder'
              )}
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
            />
            <Input
              size="xs"
              type="password"
              id="new-password"
              className="w-full"
              placeholder={t(
                'accessibility.changePassword.newPasswordPlaceholder'
              )}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <Input
              size="xs"
              type="password"
              id="confirm-password"
              className="w-full"
              placeholder={t(
                'accessibility.changePassword.confirmPasswordPlaceholder'
              )}
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
            />
            <div className="flex gap-x-2">
              <Button
                loading={loading}
                size="xs"
                variant="primary"
                onClick={handleChangePassword}
              >
                {t('accessibility.changePassword.changeButton')}
              </Button>
              <Button className="" size="xs" onClick={handleClose}>
                {t('accessibility.changePassword.cancel')}
              </Button>
            </div>
          </SettingBlock.Bottom>
        </SettingBlock>
      )}
    </>
  )
}

export default SettingLocalAuth
