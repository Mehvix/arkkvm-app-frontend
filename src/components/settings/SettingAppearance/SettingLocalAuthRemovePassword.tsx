import { request } from '@/api';
import { createLogger } from '@/utils/logger';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import SettingBlock from '../SettingBlock';
import type { SettingLocalAuthProps } from '../SettingLocalAuth';

const logger = createLogger('SettingLocalAuthRemovePassword');

const SettingLocalAuth = function SettingLocalAuth({
  onClose,
  onAuthModeChange,
}: SettingLocalAuthProps) {
  const { t } = useTranslation('settings');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successPannel, setSuccessPannel] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Handle Enter key to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleRemovePassword();
    }
  };

  function handleClose() {
    if (onClose) onClose();
  }

  const handleRemovePassword = async () => {
    if (password === '') {
      setError(t('accessibility.removePassword.errorEmpty'));
      return;
    }

    setLoading(true);
    logger.debug('Removing local password...');
    const { success, message } = await request.delete(
      '/auth/local-password',
      { timeout: 3000 },
      { password }
    );
    setLoading(false);
    if (!success) {
      logger.warn('Remove password failed:', message);
      setError(message || t('accessibility.removePassword.errorGeneral'));
    } else {
      logger.info('Remove password success');
      onAuthModeChange?.('no');
      setSuccessPannel(true);
    }
  };

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

                variant="outline" size="xs"
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
              ref={passwordRef}

              label={t('accessibility.removePassword.currentPassword')}
              type="password"
              id="current-password"
              placeholder={t('accessibility.removePassword.currentPasswordPlaceholder')}
              size="xs"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDownCapture={handleKeyDown}
            />
          </div>

          {error && <div className="mb-4 text-sm text-red-500"> {error} </div>}

          <div className="flex gap-x-2">
            <Button
              loading={loading}

              variant="primary" size="xs"
              onClick={handleRemovePassword}
            >
              {t('accessibility.removePassword.disableProtection')}
            </Button>
            <Button  onClick={handleClose}>
              {t('accessibility.removePassword.cancel')}
            </Button>
          </div>
        </SettingBlock>
      )}
    </>
  );
};

export default SettingLocalAuth;
