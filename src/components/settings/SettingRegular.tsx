import { useUpdateCheck } from '@/components/update/SystemUpdateDialog'
import { useJsonRpc } from '@/hooks/useJsonRpc'
import {
  useActiveDeviceSettings,
  useSettingsStore,
} from '@/stores/devicesStore'
import { createLogger } from '@/utils/logger'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import SettingBlock from './SettingBlock'
import SettingPageContainer from './SettingPageContainer'

const logger = createLogger('SettingRegular')

export default function SettingRegular() {
  const { t } = useTranslation(['settings'])
  const [, , sendAsync] = useJsonRpc()
  const { activeDeviceId, setDeviceSetting } = useSettingsStore()
  const { getUpdateStatus } = useUpdateCheck()
  const autoUpdate = useActiveDeviceSettings(s => s.autoUpdate)
  const appVersion = useActiveDeviceSettings(s => s.appVersion)
  const systemVersion = useActiveDeviceSettings(s => s.systemVersion)
  const onCheckedChange = async (val: boolean) => {
    if (!activeDeviceId) return
    const next = Boolean(val)
    // Optimistic update
    setDeviceSetting('autoUpdate', next)
    try {
      const resp = await sendAsync({
        method: 'setAutoUpdateState',
        params: { enabled: next } as any,
      })
      if ('error' in resp) {
        logger.error('Failed to set auto update state', resp.error)
        // Rollback
        setDeviceSetting('autoUpdate', !next)
      }
    } catch (e) {
      logger.error('Auto update state exception', e)
      // Rollback
      setDeviceSetting('autoUpdate', !next)
    }
  }

  const handleCheckUpdate = useCallback(() => {
    getUpdateStatus()
  }, [getUpdateStatus])
  return (
    <SettingPageContainer
      title={t('settings:pages.regular.title')}
      description={t('settings:pages.regular.description')}
    >
      <SettingBlock
        title={t('settings:regular.checkForUpdates')}
        content={t('settings:regular.status.checking')}
      >
        <ul>
          <li>
            {t('settings:regular.appVersion', {
              version: appVersion,
            })}
          </li>
          <li>
            {t('settings:regular.systemVersion', {
              version: systemVersion,
            })}
          </li>
        </ul>
        <SettingBlock.Right>
          <Button variant="primary" size="xs" onClick={handleCheckUpdate}>
            {t('settings:regular.check')}
          </Button>
        </SettingBlock.Right>
      </SettingBlock>
      <SettingBlock
        title={t('settings:regular.autoUpdate')}
        content={t('settings:regular.autoUpdateDesc')}
      >
        <SettingBlock.Right>
          <Switch
            checked={autoUpdate}
            onCheckedChange={onCheckedChange}
            disabled={!activeDeviceId}
          />
        </SettingBlock.Right>
      </SettingBlock>
    </SettingPageContainer>
  )
}
