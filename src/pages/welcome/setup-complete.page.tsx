/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-26 00:22:00
 */
import { request } from '@/api'
import { IconRightSmall } from '@/assets/icons'
import devicesPng from '@/assets/images/devices2.png'
import { Button, WelcomeBackground } from '@/components'
import { useAppStore } from '@/stores'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const SetupCompletePage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const localAuthMode = useAppStore(state => state.localAuthMode)
  const password = useAppStore(state => state.password)
  const microphoneEmulation = useAppStore(state => state.microphone_emulation)
  const cameraEmulation = useAppStore(state => state.camera_emulation)
  const fileTransfer = useAppStore(state => state.file_transfer)
  const audioPlayback = useAppStore(state => state.audio_playback)
  const autoUpdate = useAppStore(state => state.auto_update)
  const navigate = useNavigate()
  const { t } = useTranslation('messages')
  const hasMissing =
    microphoneEmulation === null ||
    fileTransfer === null ||
    audioPlayback === null

  useEffect(() => {
    if (hasMissing) {
      navigate('/welcome', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMissing])
  const onSubmit = useCallback(async () => {
    setLoading(true)

    if (hasMissing) {
      navigate('/welcome', { replace: true })
      setLoading(false)
      return
    }
    // autoUpdate

    let params = {
      localAuthMode,
      password,
      microphoneEmulation,
      cameraEmulation: cameraEmulation ?? false,
      fileTransfer,
      audioPlayback,
      autoUpdate,
    }

    if (password === 'password') {
      params.password = 'password'
    }
    const resultData = await request.post(`/device/setup`, params).catch(() => {
      setLoading(false)
    })
    if (resultData) {
      toast.success(resultData.message)
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 1000)
    } else {
      toast.error(
        'Request blocked by security policy (403). Please refresh the page and try again.'
      )
    }
  }, [
    navigate,
    localAuthMode,
    password,
    microphoneEmulation,
    cameraEmulation,
    fileTransfer,
    audioPlayback,
    autoUpdate,
  ])
  return (
    <WelcomeBackground
      title={t('welcome.complete.title')}
      subtitle={t('welcome.complete.subtitle')}
    >
      <img
        src={devicesPng}
        alt="devices"
        className="my-[32px] w-[300px] h-auto animate-soft-bounce animate__animated animate__fadeInDown"
        style={{ animationDelay: '300ms' }}
      />
      <Button
        type="submit"
        disabled={loading || hasMissing}
        variant="primary"
        className="w-[240px] animate__animated animate__fadeInDown"
        size="xxl"
        onClick={onSubmit}
        style={{ animationDelay: '500ms' }}
      >
        {loading ? (
          <span className="animate-pulse">
            {t('welcome.complete.getStartedLoading')}
          </span>
        ) : (
          t('welcome.complete.getStarted')
        )}
        <IconRightSmall></IconRightSmall>
      </Button>
    </WelcomeBackground>
  )
}

export default SetupCompletePage
