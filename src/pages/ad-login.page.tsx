/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-07 21:00:59
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-26 18:40:29
 */
import { request } from '@/api';
import { Button, TopNavbar } from '@/components';
import { useAppStore } from '@/stores/';
import { getSafeRedirectUrl, sanitizeError } from '@/utils/security';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const meta = {
  // target: 'cloud',
};
export interface CloudState {
  connected: boolean
  url: string
  appUrl: string
}

export default function AdLoginRoute() {
  const { t } = useTranslation('common');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [sq] = useSearchParams();
  const setToken = useAppStore(s => s.setToken);
  const deviceId = sq.get('deviceId');
  const token = sq.get('token');
  const oidcGoogle = sq.get('oidcGoogle');
  const clientId = sq.get('clientId');
  const sn = sq.get('sn');
  const redirectUrl = sq.get('redirectUrl');
  useEffect(() => {
    if (!token) return;
    setToken(token);
    if (sn === '1' && !!redirectUrl) {
      const safeUrl = getSafeRedirectUrl(redirectUrl);
      if (safeUrl) {
        window.location.href = safeUrl;
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [token, sn, redirectUrl, navigate, setToken]);

  useEffect(() => {
    const deviceRegister = async () => {
      try {
        const [stateRes, regRes] = await Promise.all([
          request.get('/cloud/state', { timeout: 3000 }),
          request.post('/cloud/register', {
            token: token,
            oidcGoogle,
            clientId,
          }),
        ]);


        // Use local variables to avoid stale closure bug with setState
        let errMsg =
          !stateRes.success || !regRes.success
            ? regRes?.message || 'Failed to register device'
            : '';

        if (errMsg) setError(sanitizeError(errMsg));

        if (regRes?.success) {
          const {appUrl} = stateRes.data;
          const cloudUrl = `${appUrl}/devices/${deviceId}/set-name`;
          const rUrl = `${appUrl}/ad-login?sn=1&redirectUrl=${encodeURIComponent(cloudUrl)}&token=${token}`;

          window.location.href = rUrl;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Network error';
        setError(sanitizeError(`There was an error during cloud registration: ${errorMsg}`));
      } finally {
        setLoading(false);
      }
    };

    if (!!deviceId) {
      deviceRegister();
    } else {
      navigate('/', { replace: true });
    }
  }, [deviceId, token, oidcGoogle, clientId, navigate, setToken]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopNavbar links={[]} showLoggedIn={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[14px] text-[var(--inactive-text-color)] animate-pulse">
              Connecting to cloud...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopNavbar links={[]} showLoggedIn={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-[32px] font-[700] text-[var(--text-primary)] mb-[12px]">
              {t('adLoginError.title')}
            </h1>
            <p className="text-[14px] text-[var(--inactive-text-color)] mb-[32px] max-w-[400px]">
              {t('adLoginError.description')}
            </p>
            <Button
              className="px-[24px] py-[12px] border border-[var(--border-color)] bg-[var(--bg-button-color)]"
              onClick={() => navigate('/')}
            >
              {t('adLoginError.backButton')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
