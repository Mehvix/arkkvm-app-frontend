import { WelcomeBackground } from '@/components'
import WelcomeSetupBtn from '@/components/WelcomeSetupBtn'
import { useAppStore } from '@/stores'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const SetupMicrophonePage: React.FC = () => {
  const navigate = useNavigate()
  const setCameraEmulation = useAppStore(state => state.setCameraEmulation)
  const { t } = useTranslation('messages')
  const handleAction = useCallback(() => {
    setCameraEmulation(true)
    navigate('/welcome/setup-file-transfer')
  }, [setCameraEmulation, navigate])
  const handleLater = useCallback(() => {
    setCameraEmulation(false)
    navigate('/welcome/setup-file-transfer')
  }, [setCameraEmulation, navigate])
  return (
    <WelcomeBackground
      title={t('welcome.camera.title')}
      subtitle={[t('welcome.camera.line1'), t('welcome.camera.line2')]}
    >
      <WelcomeSetupBtn
        actionText={t('welcome.camera.action')}
        onAction={handleAction}
        onLater={handleLater}
      ></WelcomeSetupBtn>
    </WelcomeBackground>
  )
}

export default SetupMicrophonePage
