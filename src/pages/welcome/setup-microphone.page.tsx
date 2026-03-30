/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-03 15:46:24
 */
import { WelcomeBackground } from '@/components'
import WelcomeSetupBtn from '@/components/WelcomeSetupBtn'
import { useAppStore } from '@/stores'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const SetupMicrophonePage: React.FC = () => {
  const navigate = useNavigate()
  const setMicrophoneEmulation = useAppStore(
    state => state.setMicrophoneEmulation
  )
  const { t } = useTranslation('messages')
  const handleAction = useCallback(() => {
    setMicrophoneEmulation(true)
    navigate('/welcome/setup-file-transfer')
  }, [setMicrophoneEmulation, navigate])
  const handleLater = useCallback(() => {
    setMicrophoneEmulation(false)
    navigate('/welcome/setup-file-transfer')
  }, [setMicrophoneEmulation, navigate])
  return (
    <WelcomeBackground
      title={t('welcome.microphone.title')}
      subtitle={[t('welcome.microphone.line1'), t('welcome.microphone.line2')]}
    >
      <WelcomeSetupBtn
        actionText={t('welcome.microphone.action')}
        onAction={handleAction}
        onLater={handleLater}
      ></WelcomeSetupBtn>
    </WelcomeBackground>
  )
}

export default SetupMicrophonePage
