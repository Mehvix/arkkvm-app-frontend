import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import SettingBlock from './SettingBlock'

export type UsbPresetOption = { value: string; label: string }

export interface UsbDeviceSettingProps {
  title: string
  content: string
  options: UsbPresetOption[]
  placeholder?: string
  value: string
  onChange: (val: string) => void
  onUpdate: () => void
  onRefresh: () => void
  devices: any[]
  loading?: boolean
  saving?: boolean
  disabled?: boolean // e.g., channel not ready
  renderDevices?: (devices: any[]) => ReactNode // slot for rendering devices
  children?: ReactNode
}

export default function UsbDeviceSetting({
  title,
  content,
  options,
  value,
  placeholder,
  onChange,
  onUpdate,
  onRefresh,
  devices,
  loading,
  saving,
  disabled,
  renderDevices,
  children,
}: UsbDeviceSettingProps) {
  const { t } = useTranslation(['settings'])
  const renderDevicesNode = useMemo(
    () => (renderDevices ? renderDevices(devices || []) : null),
    [renderDevices, devices]
  )

  return (
    <SettingBlock
      title={title}
      content={content}
      titleSize={12}
      contentSize={10}
      className="mt-[10px]"
    >
      <SettingBlock.Right>
        <Select
          triggerClassName="w-[150px] text-[var(--text-color)]"
          size="xs"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          options={options || []}
          disabled={disabled}
        />
      </SettingBlock.Right>
      <SettingBlock.Bottom className="mt-[10px]">
        {value === 'custom' && (
          <>
            {children}
            <div className="flex gap-2 mt-[10px] ml-[20px]">
              <Button onClick={onUpdate} size="xs" variant="primary">
                Update
              </Button>
              <Button onClick={onRefresh} disabled={!!loading} size="xs">
                {t('settings:common.refresh', 'Refresh')}
              </Button>
            </div>
          </>
        )}
      </SettingBlock.Bottom>
    </SettingBlock>
  )
}
