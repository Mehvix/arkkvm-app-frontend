/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-03 22:50:47
 */
import { WelcomeBackground, WelcomeSetupBtn } from '@/components'
import { useAppStore } from '@/stores'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const SetupFileTransferPage: React.FC = () => {
  const navigate = useNavigate()
  const setFileTransfer = useAppStore(state => state.setFileTransfer)
  const { t } = useTranslation('messages')
  const handleAction = useCallback(() => {
    setFileTransfer(true)
    navigate('/welcome/setup-auto-update')
  }, [setFileTransfer, navigate])
  const handleLater = useCallback(() => {
    setFileTransfer(false)
    navigate('/welcome/setup-auto-update')
  }, [setFileTransfer, navigate])
  return (
    <WelcomeBackground
      title={t('welcome.fileTransfer.title')}
      subtitle={[
        t('welcome.fileTransfer.line1'),
        t('welcome.fileTransfer.line2'),
        t('welcome.fileTransfer.line3'),
      ]}
    >
      <WelcomeSetupBtn
        actionText={t('welcome.fileTransfer.action')}
        onAction={handleAction}
        onLater={handleLater}
      ></WelcomeSetupBtn>
    </WelcomeBackground>
  )
}

export default SetupFileTransferPage
