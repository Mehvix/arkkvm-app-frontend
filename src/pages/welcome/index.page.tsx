/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-21 16:52:10
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-31 20:57:33
 */
import { IconRightSmall } from '@/assets/icons';
import devicesPng from '@/assets/images/devices.png';
import { Button, WelcomeBackground } from '@/components';
import type { PageMeta } from '@/types/page-meta';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
export const meta:PageMeta = {
  auth: false,
  title: 'welcome',
  isMenu: false,
  path: '/welcome',
  target: 'device',
};

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('messages');

  return (
    <WelcomeBackground
      title={t('welcome.hero.title')}
      subtitle={t('welcome.hero.subtitle')}
    >
      <img
        src={devicesPng}
        alt="devices"
        className="my-[32px] w-[300px] h-auto animate-soft-bounce animate__animated animate__fadeInDown animate-delay-300"
      />
      <p
        className="text-[18px] font-normal text-[var(--text-color)] animate__animated animate__fadeInDown animate-delay-400"
      >
        {t('welcome.hero.line1')}
      </p>
      <p
        className="text-[18px] font-normal text-[var(--text-color)] mb-[32px] animate__animated animate__fadeInDown animate-delay-500"
      >
        {t('welcome.hero.line2')}
      </p>
      <Button
        size="lg"
        className="w-[204px] font-normal animate__animated animate__fadeInDown animate-delay-600"
        variant="primary"
        onClick={() => navigate('/welcome/auth-method')}
      >
        {t('welcome.hero.setupButton')}
        <IconRightSmall></IconRightSmall>
      </Button>
    </WelcomeBackground>
  );
};

export default WelcomePage;
