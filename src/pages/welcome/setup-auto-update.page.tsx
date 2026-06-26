/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-01-14 20:40:05
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-03 16:03:26
 */
import { WelcomeBackground, WelcomeSetupBtn } from '@/components';
import { useAppStore } from '@/stores';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const SetupAutoUpdatePage: React.FC = () => {
  const navigate = useNavigate();
  const setAutoUpdate = useAppStore(state => state.setAutoUpdate);
  const { t } = useTranslation('messages');
  const handleAction = useCallback(() => {
    setAutoUpdate(true);
    navigate('/welcome/setup-complete');
  }, [setAutoUpdate, navigate]);
  const handleLater = useCallback(() => {
    setAutoUpdate(false);
    navigate('/welcome/setup-complete');
  }, [setAutoUpdate, navigate]);
  return (
    <WelcomeBackground
      title={t('welcome.autoUpdate.title')}
      subtitle={[
        t('welcome.autoUpdate.subtitle'),

      ]}
    >
      <WelcomeSetupBtn
        actionText={t('welcome.autoUpdate.action')}
        onAction={handleAction}
        onLater={handleLater}
      ></WelcomeSetupBtn>
    </WelcomeBackground>
  );
};

export default SetupAutoUpdatePage;
