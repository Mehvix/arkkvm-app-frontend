import React from 'react'
import SettingSwitch from './SettingSwitch'
import { UsbDeviceConfig } from './SettingHardware'

export interface UsbDeviceSwitchGroupProps {
  value: UsbDeviceConfig

  onChange: (config: UsbDeviceConfig) => void

  disabled?: boolean

  titleSize?: string | number

  contentSize?: string | number

  className?: string

  onDeviceChange?: (device: keyof UsbDeviceConfig, enabled: boolean) => void
}

export default function UsbDeviceSwitchGroup({
  value,
  onChange,
  disabled = false,
  titleSize = 12,
  contentSize = 10,
  className,
  onDeviceChange,
}: UsbDeviceSwitchGroupProps) {
  const handleDeviceToggle = (
    device: keyof UsbDeviceConfig,
    enabled: boolean
  ) => {
    const newConfig = {
      ...value,
      [device]: enabled,
    }
    onChange(newConfig)
    onDeviceChange?.(device, enabled)
  }

  return (
    <div className={className}>
      <SettingSwitch
        title="Enable Keyboard"
        content="Enable Keyboard"
        checked={value.keyboard}
        onCheckedChange={enabled => handleDeviceToggle('keyboard', enabled)}
        disabled={disabled}
        titleSize={titleSize}
        contentSize={contentSize}
      />

      <SettingSwitch
        title="Enable Absolute Mouse (Pointer)"
        content="Enable Absolute Mouse (Pointer)"
        checked={value.absolute_mouse}
        onCheckedChange={enabled =>
          handleDeviceToggle('absolute_mouse', enabled)
        }
        disabled={disabled}
        titleSize={titleSize}
        contentSize={contentSize}
      />

      <SettingSwitch
        title="Enable Relative Mouse"
        content="Enable Relative Mouse"
        checked={value.relative_mouse}
        onCheckedChange={enabled =>
          handleDeviceToggle('relative_mouse', enabled)
        }
        disabled={disabled}
        titleSize={titleSize}
        contentSize={contentSize}
      />

      <SettingSwitch
        title="Enable USB Mass Storage"
        content="Sometimes it might need to be disabled to prevent issues with certain devices"
        checked={value.mass_storage}
        onCheckedChange={enabled => handleDeviceToggle('mass_storage', enabled)}
        disabled={disabled}
        titleSize={titleSize}
        contentSize={contentSize}
      />
    </div>
  )
}
