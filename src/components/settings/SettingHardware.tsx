import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useJsonRpc } from '@/hooks/useJsonRpc'
import {
  USBConfig,
  UsbDeviceConfig,
  defaultUsbConfig,
  defaultUsbDeviceConfig,
  useActiveDeviceSettings,
  useSettingsActions,
  useSettingsStore,
} from '@/stores/devicesStore'
import { createLogger } from '@/utils/logger'
import { Select } from '../ui/select'

const logger = createLogger('SettingHardware')

import { useLoadingMap } from '@/hooks/useLoading'
import { Switch } from '../ui/switch'
import SettingBlock from './SettingBlock'
import SettingPageContainer from './SettingPageContainer'

const generatedSerialNumber = [
  generateNumber(1, 9),
  generateHex(7, 7),
  0,
  1,
].join('&')

function generateNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function generateHex(min: number, max: number) {
  const len = generateNumber(min, max)
  const n = (Math.random() * 0xfffff * 1000000).toString(16)
  return n.slice(0, len)
}
// USB Presets Configuration
const usbPresets = [
  {
    label: 'Keyboard, Mouse and Mass Storage',
    value: 'default',
    config: {
      keyboard: true,
      absolute_mouse: true,
      relative_mouse: true,
      mass_storage: true,
    },
  },
  {
    label: 'Keyboard Only',
    value: 'keyboard_only',
    config: {
      keyboard: true,
      absolute_mouse: false,
      relative_mouse: false,
      mass_storage: false,
    },
  },
  {
    label: 'Custom',
    value: 'custom',
  },
]

// USB Identifier Configurations
const usbConfigs = [
  {
    label: 'ArkKVM Default',
    value: 'USB Emulation Device',
    config: {
      vendor_id: '0x1d6b',
      product_id: '0x0104',
      serial_number: 'deviceId',
      manufacturer: 'ArkKVM',
      product: 'USB Emulation Device',
    },
  },
  {
    label: 'Logitech Universal Adapter',
    value: 'Logitech USB Input Device',
    config: {
      vendor_id: '0x046d',
      product_id: '0xc52b',
      serial_number: generatedSerialNumber,
      manufacturer: 'Logitech (x64)',
      product: 'Logitech USB Input Device',
    },
  },
  {
    label: 'Microsoft Wireless MultiMedia Keyboard',
    value: 'Wireless MultiMedia Keyboard',
    config: {
      vendor_id: '0x045e',
      product_id: '0x005f',
      serial_number: generatedSerialNumber,
      manufacturer: 'Microsoft',
      product: 'Wireless MultiMedia Keyboard',
    },
  },
  {
    label: 'Dell Multimedia Pro Keyboard',
    value: 'Multimedia Pro Keyboard',
    config: {
      vendor_id: '0x413c',
      product_id: '0x2011',
      serial_number: generatedSerialNumber,
      manufacturer: 'Dell Inc.',
      product: 'Multimedia Pro Keyboard',
    },
  },
  {
    label: 'Custom',
    value: 'custom',
  },
]
function findByKeys<
  T extends Record<string, any>,
  R extends 'item' | 'index' = 'item',
>(
  keys: (keyof T)[],
  target: Partial<T>,
  list: T[],
  returnType?: R
): R extends 'index' ? number : T | undefined {
  if (returnType === 'index') {
    const index = list.findIndex(item =>
      keys.every(key => item[key] === target[key])
    )
    return (index === -1 ? -1 : index) as R extends 'index'
      ? number
      : T | undefined
  }

  return list.find(item =>
    keys.every(key => item[key] === target[key])
  ) as R extends 'index' ? number : T | undefined
}
export default function SettingHardware() {
  const { t } = useTranslation(['settings'])
  const [send, isChannelReady, sendAsync] = useJsonRpc()
  const currentSettings = useActiveDeviceSettings()
  const { activeDeviceId } = useSettingsStore()
  const { setDeviceSetting, setNestedDeviceSetting } = useSettingsActions()
  const {
    is: isLoading,
    start,
    stop,
    wrap,
  } = useLoadingMap(['setFileTransfer'])
  // ===== USB Classes =====
  const [usbPreset, setUsbPreset] = useState<string>(
    currentSettings?.usbPreset || 'default'
  )
  const [usbDeviceConfig, setUsbDeviceConfig] = useState<UsbDeviceConfig>(
    currentSettings?.usbDeviceConfig ?? defaultUsbDeviceConfig
  )
  const [usbLoading, setUsbLoading] = useState(false)
  const [usbSaving, setUsbSaving] = useState(false)
  const usbOptions = useMemo(
    () => usbPresets.map(p => ({ value: p.value, label: p.label })),
    []
  )

  // ===== USB Identifiers presentational props =====
  const [usbIdentifierPreset, setUsbIdentifierPreset] = useState<string>(
    currentSettings?.usbConfigProduct || 'USB Emulation Device'
  )
  const [usbIdentifierLoading, setUsbIdentifierLoading] = useState(false)
  const [usbIdentifierSaving, setUsbIdentifierSaving] = useState(false)
  const usbIdentifierOptions = useMemo(
    () => usbConfigs.map(p => ({ value: p.value, label: p.label })),
    []
  )

  const [usbConfigState, setUsbConfigState] = useState<USBConfig>({
    vendor_id: currentSettings?.usbConfig?.vendor_id ?? '',
    product_id: currentSettings?.usbConfig?.product_id ?? '',
    serial_number: currentSettings?.usbConfig?.serial_number ?? '',
    manufacturer: currentSettings?.usbConfig?.manufacturer ?? '',
    product: currentSettings?.usbConfig?.product ?? '',
  })

  // ===== USB Device States =====

  const orientation = currentSettings?.displayRotation ?? '90'

  const bl = useActiveDeviceSettings(state => state.backlightSettings)

  const orientationOptions = useMemo(
    () => [
      {
        value: '270',
        label: t('settings:hardware.orientation.options.inverted'),
      },
      {
        value: '90',

        label: t('settings:hardware.orientation.options.normal'),
      },
    ],
    [t]
  )

  const fileTransfer = useActiveDeviceSettings(state => state.fileTransfer)
  useEffect(() => {
    let cancelled = false

    if (!isChannelReady) return

    void (async () => {
      try {
        await getUsbDevicesAsync()
        await fetchUsbIdentifierConfig()
        const [guiSettings, fileTransferRes, backlightSettingsRes] =
          await Promise.all([
            sendAsync({ method: 'getGuiSettings' }, { resultOnly: true }).catch(
              e => e
            ),

            sendAsync(
              { method: 'getFileTransfer' },
              { resultOnly: true }
            ).catch(e => e),
          ])

        setNestedDeviceSetting(prev => ({
          ...prev,
          backlightSettings: {
            ...guiSettings,
          },
          ...guiSettings,
          fileTransfer: fileTransferRes,
        }))
        if (cancelled) return
      } catch (e) {
        if (!cancelled) {
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sendAsync, setDeviceSetting, isChannelReady])
  const updateBacklight = (patch: Partial<typeof bl>) => {
    if (!isChannelReady) {
      toast.error('Channel not ready, please connect first')
      return
    }
    const next = { ...bl, ...patch }
    // Update locally first to improve interaction fluidity
    setDeviceSetting('backlightSettings', next)
    // Sync to device
    send({
      method: 'setBacklightSettings',
      params: next as any,
      onResponse: resp => {
        if ('error' in resp) {
          toast.error(
            `Failed to set backlight: ${resp.error?.data || 'Unknown error'}`
          )
          return
        }
        toast.success('Backlight settings updated')
      },
    })
  }

  const updateDisplayRotation = (val: string) => {
    if (!isChannelReady) {
      toast.error('Channel not ready, please connect first')
      return
    }
    // Optimistic update
    setDeviceSetting('displayRotation', val as any)
    send({
      method: 'setDisplayRotation',
      // Consistent with setBacklightSettings, backend requires params wrapper
      params: { rotation: val },
      onResponse: resp => {
        if ('error' in resp) {
          toast.error(
            `Failed to set rotation: ${resp.error?.data || 'Unknown error'}`
          )
          return
        }
        toast.success('Display rotation updated')
      },
    })
  }

  // ===== USB Preset Handlers =====
  const getUsbDevicesAsync = async () => {
    if (!isChannelReady) {
      toast.error('Channel not ready, please connect first')
      return null
    }
    try {
      const resp = await sendAsync(
        { method: 'getUsbDevices' },
        { timeout: 10000 }
      )
      logger.info('USB devices retrieved', { hasResult: !!resp.result })
      if ('error' in resp || !resp.result) {
        toast.error(
          `Failed to get USB devices: ${resp.error?.data || resp.error?.message || 'Unknown error'}`
        )
        return null
      }
      const findResIndex = findByKeys(
        ['absolute_mouse', 'keyboard', 'mass_storage', 'relative_mouse'],
        resp.result,
        usbPresets.map(p => p.config).filter(p => p),
        'index'
      )
      const newUsbPreset = usbPresets[findResIndex]?.value || 'custom'
      setDeviceSetting('usbPreset', newUsbPreset)
      setUsbPreset(newUsbPreset)
      setDeviceSetting('usbPreset', newUsbPreset)
      setDeviceSetting('usbDeviceConfig', resp.result)
    } catch (e: any) {
      toast.error(`USB query failed: ${e?.message || e}`)
      return null
    }
  }
  const handleUsbPresetChange = (val: string) => {
    if (val === 'custom') {
      setUsbPreset(val)
      return
    }
    const devices = usbPresets.find(p => p.value === val)?.config
    setUsbPreset(val)
    updateUsbPrese(devices)
    // setUsbPreset(val);
    // setDeviceSetting('usbPreset', val);
  }
  const updateUsbPrese = devices => {
    if (!devices) {
      toast.error('USB devices not found')
      return
    }
    if (!isChannelReady) {
      toast.error('Channel not ready, please connect first')
      return
    }
    setUsbSaving(true)
    sendAsync({ method: 'setUsbDevices', params: { devices } as any })
      .then(resp => {
        if ('error' in resp) {
          toast.error(
            `Failed to set USB devices: ${resp.error?.data || resp.error?.message || 'Unknown error'}`
          )
          return
        }
        toast.success('USB devices applied')
        setDeviceSetting('usbPreset', usbPreset || 'default')
      })
      .catch((e: any) =>
        toast.error(`Apply USB preset failed: ${e?.message || e}`)
      )
      .finally(() => setUsbSaving(false))
  }
  const handleUsbPresetUpdate = () => {
    updateUsbPrese(usbDeviceConfig)
  }

  // ===== USB Identifier Preset Handlers =====
  const fetchUsbIdentifierConfig = async () => {
    if (!isChannelReady) {
      toast.error('Channel not ready, please connect first')
      return null
    }

    try {
      const resp = await sendAsync({ method: 'getUsbConfig' })
      logger.info('USB config retrieved', { hasResult: !!resp.result })
      if ('error' in resp) {
        toast.error(
          `Failed to get USB config: ${resp.error?.data || resp.error?.message || 'Unknown error'}`
        )
        return null
      }

      if ('result' in resp && resp.result) {
        const findRes = findByKeys(
          ['manufacturer', 'product', 'product_id', 'vendor_id'],
          resp.result,
          usbConfigs.map(p => p.config).filter(p => p)
        )
        if (findRes) {
          setUsbIdentifierPreset(findRes.product)
          setDeviceSetting('usbConfigProduct', findRes.product)
        } else {
          setUsbIdentifierPreset('custom')
          setDeviceSetting('usbConfigProduct', 'custom')
        }
        setDeviceSetting('usbConfig', resp.result)
        setUsbConfigState(resp.result)
        return resp.result
      }
      return null
    } catch (e: any) {
      toast.error(`Get USB config failed: ${e?.message || e}`)
      return null
    }
  }
  const setUsbDevicesAsync = async (usbConfig: USBConfig) => {
    if (!usbConfig) return toast.error('USB config not found')
    if (usbConfig.serial_number === 'deviceId') {
      usbConfig.serial_number = activeDeviceId
    }
    send({
      method: 'setUsbConfig',
      params: usbConfig,
      onResponse: resp => {
        if ('error' in resp) {
          toast.error(
            `Failed to update USB config: ${resp.error?.data || 'Unknown error'}`
          )
        } else {
          toast.success('USB config updated successfully')
        }
      },
    })
  }
  const handleUsbIdentifierPresetChange = (val: string) => {
    const newVal = typeof val === 'string' ? val : usbConfigs[0].value
    setUsbIdentifierPreset(newVal)
    if (newVal === 'custom') {
      setUsbConfigState({
        ...defaultUsbConfig,
        serial_number: activeDeviceId,
      })
      return
    }
    // Set preset configuration
    const selectedConfig =
      usbConfigs.find(item => item.value === val)?.config ||
      usbConfigs[0].config
    setUsbDevicesAsync(selectedConfig)
  }
  const handleUsbIdentifierPresetUpdate = () => {
    setUsbDevicesAsync(usbConfigState)
  }
  const toggleFileTransfer = useCallback(
    async enabled => {
      logger.info('File transfer toggle requested', { enabled })
      if (isLoading('setFileTransfer')) return
      start('setFileTransfer')
      const { success } = await sendAsync(
        {
          method: 'setFileTransfer',
          params: {
            enabled,
          },
        },
        {
          showUnhandledErrorToast: true,
        }
      ).catch(() => {
        stop('setFileTransfer')
        toast.error('Failed to update file transfer')
      })
      stop('setFileTransfer')
      logger.info('File transfer update completed', { success })
      if (success) setDeviceSetting('fileTransfer', enabled)
    },
    [sendAsync]
  )
  return (
    <SettingPageContainer
      title={t('settings:pages.hardware.title')}
      description={t('settings:pages.hardware.description')}
    >
      <SettingBlock
        title={t('settings:hardware.orientation.title')}
        content={t('settings:hardware.orientation.desc')}
      >
        <SettingBlock.Right>
          <Select
            value={orientation}
            onChange={val => updateDisplayRotation(val)}
            placeholder={t('settings:hardware.orientation.placeholder')}
            options={orientationOptions}
            size="xs"
            disabled={!isChannelReady}
          />
        </SettingBlock.Right>
      </SettingBlock>
      <SettingBlock
        title={t('settings:hardware.displayBrightness.title')}
        content={t('settings:hardware.displayBrightness.desc')}
      >
        <SettingBlock.Right>
          <Select
            value={String(bl.max_brightness)}
            onChange={val => updateBacklight({ max_brightness: Number(val) })}
            placeholder={t(
              'settings:hardware.displayBrightness.placeholder',
              'Select brightness'
            )}
            size="xs"
            options={[
              { value: '0', label: 'Off' },
              { value: '10', label: 'Low' },
              { value: '35', label: 'Medium' },
              { value: '64', label: 'High' },
            ]}
            disabled={!isChannelReady}
          />
        </SettingBlock.Right>
      </SettingBlock>
      <SettingBlock
        title={t('settings:hardware.dimAfter.title')}
        content={t('settings:hardware.dimAfter.desc')}
      >
        <SettingBlock.Right>
          <Select
            value={String(bl.dim_after)}
            onChange={val => updateBacklight({ dim_after: Number(val) })}
            placeholder={t(
              'settings:hardware.dimAfter.placeholder',
              'Select dim timeout'
            )}
            size="xs"
            options={[
              { value: '0', label: 'Never' },
              { value: '60', label: '1 Minute' },
              { value: '300', label: '5 Minutes' },
              { value: '600', label: '10 Minutes' },
              { value: '1800', label: '30 Minutes' },
              { value: '3600', label: '1 Hour' },
            ]}
            disabled={!isChannelReady}
          />
        </SettingBlock.Right>
      </SettingBlock>
      <SettingBlock
        title={t('settings:hardware.turnOffAfter.title')}
        content={t('settings:hardware.turnOffAfter.desc')}
      >
        <SettingBlock.Right>
          {bl && (
            <Select
              value={String(bl.off_after)}
              onChange={val => updateBacklight({ off_after: Number(val) })}
              placeholder={t(
                'settings:hardware.offAfter.placeholder',
                'Select off timeout'
              )}
              size="xs"
              options={[
                { value: '0', label: 'Never' },
                { value: '300', label: '5 Minutes' },
                { value: '600', label: '10 Minutes' },
                { value: '1800', label: '30 Minutes' },
                { value: '3600', label: '1 Hour' },
              ]}
              disabled={!isChannelReady}
            />
          )}
        </SettingBlock.Right>
        <SettingBlock.Bottom>
          <span className="text-xs">
            {t('settings:hardware.turnOffAfter.tip')}
          </span>
        </SettingBlock.Bottom>
      </SettingBlock>
      <SettingBlock
        title={t('settings:hardware.usb.virtualUsbDrive.title')}
        content={t('settings:hardware.usb.virtualUsbDrive.desc')}
        titleSize={12}
        contentSize={10}
      >
        <SettingBlock.Right>
          <Switch
            checked={fileTransfer}
            onCheckedChange={toggleFileTransfer}
            disabled={isLoading('setFileTransfer')}
          />
        </SettingBlock.Right>
        <SettingBlock.Bottom>
          <span className="text-xs text-[#FB923C]">
            {t('settings:hardware.usb.virtualUsbDrive.warning')}
          </span>
        </SettingBlock.Bottom>
      </SettingBlock>
      {/* TODO: Temporarily commented out, will be restored later - Virtual USB Drive file transfer switch */}
      {/* <SettingBlock
        title={t('settings:hardware.usb.title')}
        content={t('settings:hardware.usb.desc')}
      >
        <SettingBlock.Bottom>
          <div className="ml-[20px]">

            <UsbDeviceSetting
              title={t('settings:hardware.usb.classes.title')}
              content={t('settings:hardware.usb.classes.desc')}
              options={usbOptions}
              value={usbPreset}
              onChange={handleUsbPresetChange}
              onUpdate={handleUsbPresetUpdate}
              onRefresh={() => handleUsbPresetChange('default')}
              loading={usbLoading}
              saving={usbSaving}
              disabled={!isChannelReady}
            >
              <UsbDeviceSwitchGroup
                className="ml-[20px] mt-[10px]"
                value={usbDeviceConfig}
                onChange={setUsbDeviceConfig}
                disabled={!isChannelReady}
                titleSize={10}
                contentSize={10}
              />
            </UsbDeviceSetting>


            <UsbDeviceSetting
              title={t('settings:hardware.usb.identifiers.title')}
              content={t('settings:hardware.usb.identifiers.desc')}
              options={usbIdentifierOptions}
              value={usbIdentifierPreset}
              onChange={handleUsbIdentifierPresetChange}
              onUpdate={handleUsbIdentifierPresetUpdate}
              onRefresh={handleUsbIdentifierPresetChange}
              loading={usbIdentifierLoading}
              saving={usbIdentifierSaving}
              disabled={!isChannelReady}
            >
              <div className="ml mt">
                <UsbConfigForm
                  value={usbConfigState}
                  onChange={setUsbConfigState}
                  disabled={!isChannelReady}
                  titleSize={10}
                  contentSize={10}
                  inputsize="xs"
                />
              </div>
            </UsbDeviceSetting>
          </div>
        </SettingBlock.Bottom>
      </SettingBlock> */}
    </SettingPageContainer>
  )
}
