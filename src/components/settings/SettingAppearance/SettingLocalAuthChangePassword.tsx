import { request } from '@/api';
import { createLogger } from '@/utils/logger';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import SettingBlock from '../SettingBlock';
import type { SettingLocalAuthProps } from '../SettingLocalAuth';

const logger = createLogger('SettingLocalAuthChangePassword');

const SettingLocalAuth = function SettingLocalAuth({
  onClose,
}: SettingLocalAuthProps) {
  const { t } = useTranslation('settings');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successPannel, setSuccessPannel] = useState(false);
  const [loading, setLoading] = useState(false);

  // Refs for input navigation
  const oldPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Handle Enter key navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextRef?: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      } else {
        // Last input, submit the form
        void handleChangePassword();
      }
    }
  };


  function handleClose() {
    if (onClose) onClose();
  }

  const handleChangePassword = async () => {
    setError(null);

    if (oldPassword === '') {
      setError(t('accessibility.changePassword.errorOldEmpty'));
      return;
    }

    if (newPassword === '') {
      setError(t('accessibility.changePassword.errorNewEmpty'));
      return;
    }

    if (/\s/.test(newPassword)) {
      setError(t('accessibility.changePassword.errorSpaces'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError(t('accessibility.changePassword.errorMismatch'));
      return;
    }

    try {
      setLoading(true);
      const res = await request.put('/auth/password-local', {
        oldPassword,
        newPassword,
      });
      if (!res.success) {
        setError(res.message || t('accessibility.changePassword.errorGeneral'));
      } else {
        setSuccessPannel(true);
      }
    } catch (error) {
      logger.error('Failed to change password', error);
      setError(t('accessibility.changePassword.errorGeneral'));
    } finally {
      setLoading(false);
    }
  };
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
            <Button
              className=""

              onClick={handleClose}
            >
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
              ref={oldPasswordRef}

              type="password"
              id="old-password"
              label={t('accessibility.changePassword.oldPasswordLabel')}
              className="w-full"
              size="xs"
              placeholder={t('accessibility.changePassword.oldPasswordPlaceholder')}
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              onKeyDownCapture={e => handleKeyDown(e, newPasswordRef)}
            />
            <Input
              ref={newPasswordRef}

              type="password"
              id="new-password"
              label={t('accessibility.changePassword.newPasswordLabel')}
              className="w-full"
              size="xs"
              placeholder={t('accessibility.changePassword.newPasswordPlaceholder')}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              onKeyDownCapture={e => handleKeyDown(e, confirmPasswordRef)}
            />
            <Input
              ref={confirmPasswordRef}

              type="password"
              id="confirm-password"
              label={t('accessibility.changePassword.confirmPasswordLabel')}
              className="w-full"
              size="xs"
              placeholder={t('accessibility.changePassword.confirmPasswordPlaceholder')}
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              onKeyDownCapture={e => handleKeyDown(e)}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <div className="flex gap-x-2">
              <Button
                loading={loading}

                variant="primary" size="xs"
                onClick={handleChangePassword}
              >
                {t('accessibility.changePassword.changeButton')}
              </Button>
              <Button className=""  onClick={handleClose}>
                {t('accessibility.changePassword.cancel')}
              </Button>
            </div>
          </SettingBlock.Bottom>
        </SettingBlock>
      )}
    </>
  );
};

export default SettingLocalAuth;
