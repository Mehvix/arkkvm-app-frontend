import { request } from '@/api'
import { SettingLocalAuth } from '@/components'
import { useJsonRpc } from '@/hooks/useJsonRpc'
import { useRestartDialog } from '@/hooks/useRestartDialog'
import { env } from '@/utils/env'
import { createLogger } from '@/utils/logger'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Textarea } from '../ui/textarea'
import SettingBlock from './SettingBlock'
import SettingPageContainer from './SettingPageContainer'

const logger = createLogger('SettingAccessibility')

export interface TLSState {
  mode: 'self-signed' | 'custom' | 'disabled'
  certificate?: string
  privateKey?: string
}

export default function SettingAccessibility() {
  const { t } = useTranslation(['settings'])
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isAdopted, setAdopted] = useState(false)
  const [cloudApiUrl, setCloudApiUrl] = useState('')
  const [cloudAppUrl, setCloudAppUrl] = useState('')
  const [send, isChannelReady, sendAsync] = useJsonRpc()
  const [tlsMode, setTlsMode] = useState<string>('disabled')
  const [tlsCert, setTlsCert] = useState<string>('')
  const [tlsKey, setTlsKey] = useState<string>('')
  const [selectedProvider, setSelectedProvider] = useState<string>('arkkvm')
  const [loading, setLoading] = useState(false)
  const [localAuth, setLocalAuth] = useState(false)
  const [localAuthAction, setLocalAuthAction] = useState('')
  const [authMode, setAauthMode] = useState<string>()
  const [deregisterLoading, setDeregisterLoading] = useState(false)
  const { showRestartDialog } = useRestartDialog()
  const navigate = useNavigate()
  useEffect(() => {
    let cancelled = false
    if (!isChannelReady) return
    void (async () => {
      try {
        const [cloudState, deviceId] = await Promise.all([
          sendAsync({ method: 'getCloudState' }),
          sendAsync({ method: 'getDeviceID' }),
        ])
        logger.info('Cloud state and device ID loaded', {
          connected: cloudState?.result?.connected,
          hasDeviceId: !!deviceId?.result,
        })

        if (cancelled) return
        if (
          (cloudState && 'error' in cloudState) ||
          (deviceId && 'error' in deviceId)
        ) {
          toast.error(
            `Failed to get cloud state: ${cloudState.error?.data || cloudState.error?.message || 'Unknown error'}`
          )
          return
        }
        setAdopted(cloudState.result.connected)
        setCloudApiUrl(cloudState.result.url)
        setCloudAppUrl(cloudState.result.appUrl)
        // setDeviceId(deviceId.result);

        if (
          cloudState.result.url === env.officialCloudApiUrl &&
          cloudState.result.appUrl === env.officialCloudAppUrl
        ) {
          setSelectedProvider('arkkvm')
        } else {
          setSelectedProvider('custom')
        }
      } catch (error) {
        logger.error('Failed to load cloud state', error)
        toast.error('Failed to load cloud state')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isChannelReady, sendAsync])

  useEffect(() => {
    if (!isChannelReady) return
    void (async () => {
      const resp = await sendAsync(
        { method: 'getTLSState' },
        { timeout: 10000 }
      )

      if ('error' in resp) {
        logger.error('Failed to get TLS state', resp.error)
        return
      }
      const tlsState = resp.result as TLSState
      if (!tlsState.mode) {
        setTlsMode('disabled')
      } else {
        setTlsMode(tlsState.mode)
      }
      if (tlsState.certificate) setTlsCert(tlsState.certificate)
      if (tlsState.privateKey) setTlsKey(tlsState.privateKey)
    })()
  }, [isChannelReady, sendAsync])

  useEffect(() => {
    const fetchAuthMode = async () => {
      const deviceRes: any = await request.get('/device')
      logger.info('Device auth mode loaded', { authMode: deviceRes?.authMode })
      setDeviceId(deviceRes?.deviceId)
      setAauthMode(deviceRes.authMode)
    }
    if (env.target === 'device') {
      fetchAuthMode()
    }
  }, [localAuth])
  const updateTlsState = useCallback(
    (mode: string, cert?: string, key?: string) => {
      void (async () => {
        const state = { mode } as TLSState
        if (cert && key) {
          state.certificate = cert
          state.privateKey = key
        }
        logger.info('Updating TLS state', { mode: state.mode })
        const resp = await sendAsync(
          { method: 'setTLSState', params: { state: state } },
          { timeout: 10000 }
        )
        if ('error' in resp) {
          toast.error(
            `Failed to update TLS settings: ${resp.error.data || 'Unknown error'}`
          )
          return
        }
        showRestartDialog()
        toast.success('TLS settings updated successfully')
      })()
    },
    [sendAsync]
  )

  const handleProviderChange = (value: string) => {
    setSelectedProvider(value)
    if (value === 'arkkvm') {
      setCloudApiUrl(env.officialCloudApiUrl)
      setCloudAppUrl(env.officialCloudAppUrl)
    } else {
      if (cloudApiUrl || cloudAppUrl) return
      setCloudApiUrl('')
      setCloudAppUrl('')
    }
  }

  const handleTlsModeChange = (value: string) => {
    setTlsMode(value)
    if (value !== 'custom') {
      updateTlsState(value)
    }
  }
  const handleTlsCertChange = (value: string) => {
    setTlsCert(value)
  }
  const handleTlsKeyChange = (value: string) => {
    setTlsKey(value)
  }
  const handleCustomTlsUpdate = () => {
    updateTlsState(tlsMode, tlsCert, tlsKey)
  }
  const onCloudAdoptClick = useCallback(
    (cloudApiUrl: string, cloudAppUrl: string) => {
      if (!deviceId) {
        toast.error('No device ID available')
        return
      }
      setLoading(true)
      send({
        method: 'setCloudUrl',
        params: { apiUrl: cloudApiUrl, appUrl: cloudAppUrl },
        onResponse: (resp: JsonRpcResponse) => {
          setLoading(false)
          if ('error' in resp) {
            toast.error(
              `Failed to update cloud URL: ${resp.error.data || 'Unknown error'}`
            )
            return
          }

          const returnTo = new URL(window.location.href)
          returnTo.pathname = '/ad-login'
          returnTo.search = ''
          returnTo.hash = ''
          window.location.href =
            cloudAppUrl +
            '/login?deviceId=' +
            deviceId +
            `&returnTo=${returnTo.toString()}&cloudApiUrl=${cloudApiUrl}`
        },
      })
    },
    [deviceId, send]
  )
  const deregisterDevice = () => {
    setDeregisterLoading(true)
    send({
      method: 'deregisterDevice',
      params: {},
      onResponse: resp => {
        if ('error' in resp) {
          toast.error(
            `Failed to deregister device: ${resp.error?.data || 'Unknown error'}`
          )
          return
        }
        toast.success('Device deregistered')
        setDeregisterLoading(false)
        if (env.target === 'cloud') {
          navigate('/devices/list')
        } else {
          send({
            method: 'getCloudState',
            params: {},
            onResponse: resp => {
              if ('error' in resp) {
                toast.error(
                  `Failed to get cloud state: ${resp.error?.data || 'Unknown error'}`
                )
                return
              }
              setAdopted(resp.result.connected)
            },
          })
        }
      },
    })
  }
  const stopKeyEventPropagation = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    // Prevent event bubbling to avoid global hotkey/KVM capture
    e.stopPropagation()
  }

  // Local auth
  const handleLocalAuth = (action: string) => {
    setLocalAuth(true)
    setLocalAuthAction(action)
  }
  const handleLocalAuthClose = () => {
    setLocalAuth(false)
    setLocalAuthAction('')
  }

  const settingLoaclAuthComponent = useMemo(() => {
    return (
      <SettingLocalAuth
        onClose={handleLocalAuthClose}
        localAuthAction={localAuthAction}
      ></SettingLocalAuth>
    )
  }, [localAuth, localAuthAction])

  return (
    <SettingPageContainer
      title={t('settings:pages.accessibility.title')}
      description={t('settings:pages.accessibility.description')}
    >
      {localAuth ? (
        settingLoaclAuthComponent
      ) : (
        <div>
          <SettingBlock
            title={t('settings:accessibility.local.title')}
            content={t('settings:accessibility.local.desc')}
          ></SettingBlock>
          <SettingBlock
            title={t('settings:accessibility.httpsMode.title')}
            content={t('settings:accessibility.httpsMode.desc')}
          >
            <SettingBlock.Right>
              <Select
                value={tlsMode}
                onChange={handleTlsModeChange}
                placeholder={t(
                  'settings:hardware.displayBrightness.placeholder',
                  'Select brightness'
                )}
                size="xs"
                options={[
                  {
                    value: 'disabled',
                    label: t('settings:accessibility.httpsMode.disabled'),
                  },
                  {
                    value: 'self-signed',
                    label: t('settings:accessibility.httpsMode.selfSigned'),
                  },
                  {
                    value: 'custom',
                    label: t('settings:accessibility.httpsMode.custom'),
                  },
                ]}
                disabled={!isChannelReady}
              />
            </SettingBlock.Right>
          </SettingBlock>
          {tlsMode === 'custom' && (
            <SettingBlock
              title={t('settings:accessibility.tlsCertificate.title')}
              content={t('settings:accessibility.tlsCertificate.desc')}
            >
              <SettingBlock.Bottom className="flex flex-col gap-[20px]">
                <Textarea
                  value={tlsCert}
                  onChange={e => setTlsCert(e.target.value)}
                  labelPosition="top"
                  label={t('settings:accessibility.tlsCertificate.certLabel')}
                  labelClassName="text-[var(--text-color)] text-[12px] mt-[14px]"
                  className="text-[12px] h-[100px] font-[400]"
                  rows={3}
                  placeholder={t(
                    'settings:accessibility.tlsCertificate.certPlaceholder'
                  )}
                  onChange={e => handleTlsCertChange(e.target.value)}
                ></Textarea>
                <Textarea
                  value={tlsKey}
                  onChange={e => setTlsKey(e.target.value)}
                  labelPosition="top"
                  label={t('settings:accessibility.tlsCertificate.keyLabel')}
                  labelClassName="text-[var(--text-color)] text-[12px] mt-[14px]"
                  className="text-[12px] h-[100px]"
                  description={t(
                    'settings:accessibility.tlsCertificate.keyDescription'
                  )}
                  rows={3}
                  placeholder={t(
                    'settings:accessibility.tlsCertificate.keyPlaceholder'
                  )}
                  onChange={e => handleTlsKeyChange(e.target.value)}
                ></Textarea>
                <Button
                  className="mt-[15px]"
                  size="xs"
                  variant="primary"
                  onClick={handleCustomTlsUpdate}
                >
                  {t('settings:accessibility.tlsCertificate.updateButton')}
                </Button>
              </SettingBlock.Bottom>
            </SettingBlock>
          )}
          {env.target === 'device' && (
            <SettingBlock
              title={t('settings:accessibility.authMode.title')}
              content={`${t('settings:accessibility.authMode.currentMode')} ${authMode === 'password' ? t('settings:accessibility.authMode.passwordProtected') : t('settings:accessibility.authMode.noPassword')}`}
            >
              <SettingBlock.Right>
                {authMode === 'password' && (
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => {
                      handleLocalAuth('removePwd')
                    }}
                  >
                    {t('settings:accessibility.authMode.disableButton')}
                  </Button>
                )}
                {authMode !== 'password' && (
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => {
                      handleLocalAuth('initPwd')
                    }}
                  >
                    {t('settings:accessibility.authMode.enableButton')}
                  </Button>
                )}
              </SettingBlock.Right>
            </SettingBlock>
          )}
          {env.target === 'device' && authMode === 'password' && (
            <SettingBlock
              title={t('settings:accessibility.changePassword.title')}
              content={t('settings:accessibility.changePassword.desc')}
            >
              <SettingBlock.Right>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => {
                    handleLocalAuth('changePwd')
                  }}
                >
                  {t('settings:accessibility.changePassword.button')}
                </Button>
              </SettingBlock.Right>
            </SettingBlock>
          )}
          <p className="border-b border-[var(--border-color)] h-[1px] mb-[24px]"></p>
          <SettingBlock
            title={t('settings:accessibility.remote.title')}
            content={t('settings:accessibility.remote.desc')}
          />
          {!isAdopted && (
            <SettingBlock
              title={t('settings:accessibility.cloudProvider.title')}
              content={t('settings:accessibility.cloudProvider.desc')}
            >
              <SettingBlock.Right>
                <Select
                  value={selectedProvider}
                  onChange={handleProviderChange}
                  placeholder={t(
                    'settings:hardware.displayBrightness.placeholder',
                    'Select brightness'
                  )}
                  size="xs"
                  options={[
                    {
                      value: 'arkkvm',
                      label: t('settings:accessibility.cloudProvider.arkkvm'),
                    },
                    {
                      value: 'custom',
                      label: t('settings:accessibility.cloudProvider.custom'),
                    },
                  ]}
                  disabled={!isChannelReady}
                />
              </SettingBlock.Right>

              <SettingBlock.Bottom>
                {selectedProvider === 'arkkvm' ? (
                  <div className="flex items-start gap-3 p-4 bg-[var(--card-background)] border border-[var(--border-color)] rounded-lg mt-[10px]">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-[var(--text-color)] mb-2">
                        {t('settings:accessibility.cloudSecurity.title')}
                      </h3>
                      <ul className="space-y-1 text-xs text-[var(--inactive-text-color)]">
                        <li>
                          • {t('settings:accessibility.cloudSecurity.feature1')}
                        </li>
                        <li>
                          • {t('settings:accessibility.cloudSecurity.feature2')}
                        </li>
                        <li>
                          • {t('settings:accessibility.cloudSecurity.feature3')}
                        </li>
                        <li>
                          • {t('settings:accessibility.cloudSecurity.feature4')}
                        </li>
                      </ul>
                      {/* <p className="text-xs text-[var(--inactive-text-color)] mt-3">
                        {t(
                          'settings:accessibility.cloudSecurity.openSourceText'
                        )}{' '}
                        <a
                          href="https://github.com"
                          className="text-blue-500 hover:text-blue-600 underline"
                        >
                          GitHub
                        </a>
                        .
                      </p>
                      <button className="mt-3 px-3 py-1.5 text-xs border border-[var(--border-color)] rounded-md hover:bg-[var(--hover-background)] transition-colors">
                        {t(
                          'settings:accessibility.cloudSecurity.learnMoreButton'
                        )}
                      </button> */}
                    </div>
                  </div>
                ) : (
                  <div className="text-[var(--text-color)]">
                    <Input
                      label={t('settings:accessibility.cloudUrls.apiLabel')}
                      labelPosition="top"
                      size="xs"
                      labelSize={12}
                      labelClassName="text-[var(--text-color)] text-[12px] mt-[14px]"
                      placeholder={t(
                        'settings:accessibility.cloudUrls.apiPlaceholder'
                      )}
                      value={cloudApiUrl}
                      onChange={e => setCloudApiUrl(e.target.value)}
                    ></Input>
                    <Input
                      label={t('settings:accessibility.cloudUrls.appLabel')}
                      labelPosition="top"
                      size="xs"
                      labelSize={12}
                      labelClassName="text-[var(--text-color)] text-[12px] mt-[14px]"
                      placeholder={t(
                        'settings:accessibility.cloudUrls.appPlaceholder'
                      )}
                      value={cloudAppUrl}
                      onChange={e => setCloudAppUrl(e.target.value)}
                    ></Input>
                  </div>
                )}
              </SettingBlock.Bottom>
            </SettingBlock>
          )}
          {!isAdopted ? (
            <Button
              onClick={() => onCloudAdoptClick(cloudApiUrl, cloudAppUrl)}
              disabled={loading}
              size="xs"
              variant="primary"
            >
              {loading
                ? t('settings:accessibility.cloudButtons.loading')
                : t('settings:accessibility.cloudButtons.adopt')}
            </Button>
          ) : (
            <Button
              loading={deregisterLoading}
              onClick={() => deregisterDevice()}
              disabled={loading}
              size="xs"
              variant="primary"
            >
              {loading
                ? t('settings:accessibility.cloudButtons.loading')
                : t('settings:accessibility.cloudButtons.deregister')}
            </Button>
          )}
        </div>
      )}
    </SettingPageContainer>
  )
}
