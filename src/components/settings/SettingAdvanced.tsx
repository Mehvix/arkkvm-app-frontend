import { type JsonRpcHandle } from '@/hooks/useJsonRpc'
import { useLoadingMap } from '@/hooks/useLoading'
import { useAppStore } from '@/stores'
import {
  useActiveDeviceSettings,
  useSettingsActions,
  useSettingsStore,
} from '@/stores/devicesStore'
import { createLogger } from '@/utils/logger'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { useConfirmDialog } from '../ui/confirm-dialog'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import SettingBlock from './SettingBlock'
import SettingPageContainer from './SettingPageContainer'

const logger = createLogger('SettingAdvanced')

export default function SettingAdvanced({ rpc }: { rpc: JsonRpcHandle }) {
  const { t } = useTranslation(['settings'])
  const [send, isChannelReady, sendAsync] = rpc
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // State management
  const [devChannel, setDevChannel] = useState(false)
  const webTerminalEnabled = useActiveDeviceSettings(s => s.webTerminalEnabled)
  const [developerMode, setDeveloperMode] = useState(false)
  const [localLoopbackOnly, setLocalLoopbackOnly] = useState(false)
  const [sshKey, setSshKey] = useState('')
  const debugMode = useActiveDeviceSettings(s => s.debugMode)
  const [usbEmulation, setUsbEmulation] = useState(false)
  const setNestedDeviceSetting = useSettingsActions().setNestedDeviceSetting
  const removeDevice = useSettingsActions().removeDevice
  const resetSetup = useAppStore(state => state.resetSetup)
  const activeDeviceId = useSettingsStore(s => s.activeDeviceId)
  const { isLoading, startLoading, stopLoading } = useLoadingMap([
    'resetConfig',
    'allLoading',
    'localLoopbackOnly',
  ])
  const { confirm } = useConfirmDialog()
  useEffect(() => {
    if (!isChannelReady) return
    let isCancelled = false
    void (async () => {
      startLoading('allLoading')
      const [
        devModeState,
        sshKeyState,
        usbEmulationState,
        devChannelState,
        localLoopbackOnlyState,
      ] = await Promise.all([
        sendAsync({ method: 'getDevModeState' }, { resultOnly: true }).catch(
          e => e
        ),
        sendAsync({ method: 'getSSHKeyState' }, { resultOnly: true }).catch(
          e => e
        ),
        sendAsync(
          { method: 'getUsbEmulationState' },
          { resultOnly: true }
        ).catch(e => e),
        sendAsync({ method: 'getDevChannelState' }, { resultOnly: true }).catch(
          e => e
        ),
        sendAsync(
          { method: 'getLocalLoopbackOnly' },
          { resultOnly: true }
        ).catch(e => e),
      ])
      logger.info('Settings loaded', {
        localLoopbackOnly: localLoopbackOnlyState,
      })
      stopLoading('allLoading')
      if (isCancelled) return
      setDevChannel(!!devChannelState)
      setDeveloperMode(!!devModeState?.enabled)
      setLocalLoopbackOnly(!!localLoopbackOnlyState)
      setSshKey(sshKeyState || '')
      setUsbEmulation(!!usbEmulationState)
      setNestedDeviceSetting(prev => ({
        ...prev,
        developerMode: !!devModeState?.enabled,
      }))
    })()
    return () => {
      isCancelled = true
    }
  }, [isChannelReady, sendAsync])
  // Event handler functions
  const toggleDevChannelUpdates = useCallback(
    (enabled: boolean) => {
      setDevChannel(enabled)
      send({
        method: 'setDevChannelState',
        params: { enabled },
        onResponse(resp) {
          logger.info('Dev channel state updated', { enabled, response: resp })
        },
        onError(err) {
          toast.error(
            `Failed to set dev channel state: ${err.message || 'Unknown error'}`
          )
          // Rollback state
          setDevChannel(!enabled)
        },
      })
    },
    [send]
  )

  const handleDeveloperModeChange = useCallback(
    async (checked: boolean) => {
      startLoading('developerMode')
      const { success } = await sendAsync({
        method: 'setDevModeState',
        params: { enabled: checked },
      })
      stopLoading('developerMode')
      if (success) {
        setNestedDeviceSetting(prev => ({
          ...prev,
          developerMode: checked,
        }))
        setDeveloperMode(checked)
      } else {
        toast.error(
          `Failed to ${checked ? 'enable' : 'disable'} Developer Mode`
        )
        // Rollback state
        setDeveloperMode(!checked)
      }
    },
    [sendAsync, setNestedDeviceSetting]
  )

  const handleLoopbackOnlyChange = useCallback(
    (checked: boolean) => {
      confirm({
        title: 'Enable Loopback-Only Mode?',
        content: (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-orange-600 mt-0.5">⚠️</div>
              <div>
                <div className="font-medium text-orange-800 mb-2">
                  WARNING: This will restrict web interface access to localhost
                  (127.0.0.1) only.
                </div>
                <div className="text-sm">
                  Before enabling this feature, make sure you have either:
                </div>
                <ul className="text-xs space-y-1 ml-4">
                  <li className="text-xs">
                    • SSH access configured and tested
                  </li>
                  <li className="text-xs">
                    • Cloud access enabled and working
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ),
        confirmText: 'I Understand, Enable Anyway',
        cancelText: 'Cancel',
        type: 'confirm',
        onConfirm: async () => {
          // setLocalLoopbackOnly(checked);
          //startLoading
          startLoading('localLoopbackOnly')
          const resChecked = await sendAsync(
            {
              method: 'setLocalLoopbackOnly',
              params: { enabled: checked },
            },
            {
              resultOnly: true,
              showUnhandledErrorToast: true,
              successMessage: `Loopback-only mode enabled. Restart your device to apply.`,
            }
          )
          stopLoading('localLoopbackOnly')
          setLocalLoopbackOnly(resChecked ?? false)
        },
      })
    },
    [send, confirm]
  )

  const handleWebTerminalChange = useCallback(
    (checked: boolean) => {
      logger.info('Web Terminal changed', { enabled: checked })
      setNestedDeviceSetting(prev => ({
        ...prev,
        webTerminalEnabled: checked,
      }))
    },
    [setNestedDeviceSetting]
  )

  const handleDebugModeChange = useCallback(
    (checked: boolean) => {
      logger.info('Debug mode changed', { enabled: checked })
      setNestedDeviceSetting(prev => ({
        ...prev,
        debugMode: checked,
      }))
    },
    [setNestedDeviceSetting]
  )

  const handleUpdateSshKey = useCallback(() => {
    send({
      method: 'setSSHKeyState',
      params: { sshKey },
      onResponse(resp) {
        if (!('error' in resp)) {
          toast.success('SSH Key updated successfully')
        } else {
          toast.error(
            `Failed to update SSH Key: ${resp.error.message || 'Unknown error'}`
          )
        }
      },
      onError(err) {
        toast.error(
          `Failed to update SSH Key: ${err.message || 'Network error'}`
        )
      },
    })
  }, [send, sshKey])

  const handleDisableUsbEmulation = useCallback(
    (enabled: boolean) => {
      setUsbEmulation(enabled)
      send({
        method: 'setUsbEmulationState',
        params: { enabled },
        onResponse(resp) {
          if (!('error' in resp)) {
            toast.success('USB Emulation disabled successfully')
          } else {
            toast.error(
              `Failed to disable USB Emulation: ${resp.error.message || 'Unknown error'}`
            )
            setUsbEmulation(!enabled)
          }
        },
        onError(err) {
          toast.error(
            `Failed to disable USB Emulation: ${err.message || 'Network error'}`
          )
          setUsbEmulation(!enabled)
        },
      })
    },
    [send]
  )

  const handleResetConfig = useCallback(async () => {
    startLoading('resetConfig')
    try {
      const { success } = await sendAsync({
        method: 'resetConfig',
      })

      if (success) {
        resetSetup()
        toast.success('Configuration reset to default successfully')
        if (activeDeviceId) removeDevice(activeDeviceId)
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        //  toast.error(
        //             `Failed to reset configuration: ${resp.error.message || 'Unknown error'}`
        //           )
      }
    } catch (error) {
      logger.error('Failed to clear localStorage:', error)
      toast.error('Failed to clear local storage')
    }
  }, [sendAsync])

  return (
    <SettingPageContainer
      title={t('settings:pages.advanced.title')}
      description={t('settings:pages.advanced.description')}
    >
      <div className="max-w-[840px]">
        {/* Dev Channel Updates */}

        {/* <SettingBlock
        title="Dev Channel Updates"
        content="Receive early updates from the development channel"
      >
        <SettingBlock.Right>
          <Switch checked={devChannel} onCheckedChange={toggleDevChannelUpdates} />
        </SettingBlock.Right>
      </SettingBlock> */}

        {/* Web Terminal */}
        <SettingBlock
          title={t('settings:advanced.webTerminal.title')}
          content={t('settings:advanced.webTerminal.desc')}
        >
          <SettingBlock.Right>
            <Switch
              checked={webTerminalEnabled}
              onCheckedChange={handleWebTerminalChange}
            />
          </SettingBlock.Right>
        </SettingBlock>

        {/* Loopback-Only Mode */}
        <SettingBlock
          title={t('settings:advanced.loopbackOnly.title')}
          content={t('settings:advanced.loopbackOnly.desc')}
        >
          <SettingBlock.Right>
            <Switch
              checked={localLoopbackOnly}
              onCheckedChange={handleLoopbackOnlyChange}
              disabled={
                isLoading('allLoading') || isLoading('localLoopbackOnly')
              }
            />
          </SettingBlock.Right>
        </SettingBlock>

        {/* SSH Access */}
        <SettingBlock
          title={t('settings:advanced.sshAccess.title')}
          content={t('settings:advanced.sshAccess.desc')}
        >
          <SettingBlock.Right>
            <Switch
              checked={developerMode}
              onCheckedChange={handleDeveloperModeChange}
              disabled={isLoading('allLoading') || isLoading('developerMode')}
            />
          </SettingBlock.Right>
          {developerMode && (
            <SettingBlock.Bottom className="pl-[24px]">
              <div className="space-y-3">
                <Textarea
                  ref={textareaRef}
                  value={sshKey}
                  label={t('settings:advanced.sshAccess.keyLabel')}
                  rows={3}
                  onChange={e => setSshKey(e.target.value)}
                  placeholder={t('settings:advanced.sshAccess.keyPlaceholder')}
                  className="font-mono !text-xs"
                  labelClassName="text-xs"
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600  md:text-xs">
                    {t('settings:advanced.sshAccess.defaultUserText')}{' '}
                    <span className="font-mono bg-gray-100 px-1 rounded">
                      root
                    </span>
                    .
                  </div>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={handleUpdateSshKey}
                  >
                    {t('settings:advanced.sshAccess.updateButton')}
                  </Button>
                </div>
              </div>
            </SettingBlock.Bottom>
          )}
        </SettingBlock>

        <SettingBlock
          title={t('settings:advanced.troubleshooting.resetConfig.title')}
          content={t('settings:advanced.troubleshooting.resetConfig.desc')}
        >
          <SettingBlock.Right>
            <Button
              size="xs"
              variant="default"
              status="danger"
              className="bg-[var(--btn-filled-bg-danger)]"
              onClick={handleResetConfig}
              loading={isLoading('resetConfig')}
            >
              {t('settings:advanced.troubleshooting.resetConfig.button')}
            </Button>
          </SettingBlock.Right>
        </SettingBlock>
        {/* TODO: Troubleshooting Mode - USB Emulation feature to be implemented later
         * This feature allows users to toggle USB emulation and provides
         * debugging capabilities for hardware communication issues.
         */}
        {/* <SettingBlock
          title={t('settings:advanced.troubleshooting.title')}
          content={t('settings:advanced.troubleshooting.desc')}
        >
          <SettingBlock.Right>
            <Switch
              checked={debugMode}
              disabled={isLoading('allLoading') || isLoading('debugMode')}
              onCheckedChange={handleDebugModeChange}
            />
          </SettingBlock.Right>
          {debugMode && (
            <SettingBlock.Bottom className="pl-[20px]">
              <SettingBlock
                title={t(
                  'settings:advanced.troubleshooting.usbEmulation.title'
                )}
                content={t(
                  'settings:advanced.troubleshooting.usbEmulation.desc'
                )}
                paddingBottom={10}
              >
                <SettingBlock.Right>
                  <Button
                    size="xs"
                    onClick={() => handleDisableUsbEmulation(!usbEmulation)}
                  >
                    {usbEmulation
                      ? t(
                          'settings:advanced.troubleshooting.usbEmulation.disableButton'
                        )
                      : t(
                          'settings:advanced.troubleshooting.usbEmulation.enableButton'
                        )}
                  </Button>
                </SettingBlock.Right>
              </SettingBlock>
            </SettingBlock.Bottom>
          )}
        </SettingBlock> */}
      </div>
    </SettingPageContainer>
  )
}
