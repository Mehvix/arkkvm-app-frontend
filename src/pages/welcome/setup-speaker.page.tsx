/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-11-01 20:41:31
 */
import { WelcomeBackground } from '@/components'
import WelcomeSetupBtn from '@/components/WelcomeSetupBtn'
import { useAppStore } from '@/stores'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const SetupSpeakerPage: React.FC = () => {
  const navigate = useNavigate()
  const setAudioPlayback = useAppStore(state => state.setAudioPlayback)
  const { t } = useTranslation('messages')
  const handleAction = useCallback(() => {
    setAudioPlayback(true)
    navigate('/welcome/setup-microphone')
  }, [setAudioPlayback, navigate])

  const handleLater = useCallback(() => {
    setAudioPlayback(false)
    navigate('/welcome/setup-microphone')
  }, [setAudioPlayback, navigate])
  return (
    <WelcomeBackground
      title={t('welcome.speaker.title')}
      subtitle={[t('welcome.speaker.line1'), t('welcome.speaker.line2')]}
    >
      <WelcomeSetupBtn
        actionText={t('welcome.speaker.action')}
        onAction={handleAction}
        onLater={handleLater}
      ></WelcomeSetupBtn>
    </WelcomeBackground>
  )
}

export default SetupSpeakerPage
