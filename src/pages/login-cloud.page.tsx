/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-29 11:24:06
 */
export const meta = {
  auth: false,
  title: 'Cloud Login',
  isMenu: false,
  cloudPath: '/login',
  target: 'cloud',
};
import { IconGoogleLogo as GoogleIcon } from '@/assets/icons';
import { AuthLayout } from '@/components';
import { env } from '@/utils/env';
import { normalizeCloudOrigin } from '@/utils/security';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

export default function LoginCloudPage() {
  const { t } = useTranslation('common');
  const [sq] = useSearchParams();

  let cloudApiUrl: string | null = '';
  if (env.target === 'device') {
    cloudApiUrl = normalizeCloudOrigin(sq.get('cloudApiUrl'));
  } else {
    cloudApiUrl = env.loginCloudUrl;
  }
  const actionUrl = cloudApiUrl ? `${cloudApiUrl}/oidc/google` : '';
  const deviceId = sq.get('deviceId');

  if (deviceId) {
    return (
      <AuthLayout
        title={t('cloudLogin.title')}
        description={t('cloudLogin.description')}
        action={t('cloudLogin.action')}
        footerText={t('cloudLogin.encryptedHint')}
        leadingIcon={GoogleIcon}
        actionUrl={actionUrl}
      />
    );
  }
  return (
    <AuthLayout
      title={t('cloudLoginDirect.title')}
      description={t('cloudLoginDirect.description')}
      action={t('cloudLoginDirect.action')}
      footerText={t('cloudLoginDirect.encryptedHint')}
      leadingIcon={GoogleIcon}
      actionUrl={actionUrl}
    />
  );
}
