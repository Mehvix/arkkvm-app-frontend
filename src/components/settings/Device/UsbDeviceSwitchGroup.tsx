import type { UsbDeviceConfig } from '@/stores/devicesStore';
import { useTranslation } from 'react-i18next';
import SettingSwitch from '../SettingSwitch';

export interface UsbDeviceSwitchGroupProps {
  /**
   * USB device configuration data
   */
  value: UsbDeviceConfig
  /**
   * Callback triggered when config changes
   */
  onChange: (config: UsbDeviceConfig) => void
  /**
   * Whether all switches are disabled
   */
  disabled?: boolean
  /**
   * Title font size
   */
  titleSize?: string | number
  /**
   * Description font size
   */
  contentSize?: string | number
  /**
   * Custom style class name
   */
  className?: string
  /**
   * Callback triggered when a single device state changes
   */
  onDeviceChange?: (device: keyof UsbDeviceConfig, enabled: boolean) => void
}

/**
 * USB device switch group component.
 * Includes five switches: Keyboard, Absolute Mouse, Relative Mouse, Virtual Storage, and USB Microphone.
 */
export default function UsbDeviceSwitchGroup({
  value,
  onChange,
  disabled = false,
  titleSize = 12,
  contentSize = 10,
  className,
  onDeviceChange,
}: UsbDeviceSwitchGroupProps) {
  const { t } = useTranslation(['settings']);

  const handleDeviceToggle = (
    device: keyof UsbDeviceConfig,
    enabled: boolean
  ) => {
    const newConfig = {
      ...value,
      [device]: enabled,
    };
    onChange(newConfig);
    onDeviceChange?.(device, enabled);
  };

  return (
    <div className={className}>
      <SettingSwitch
        title={t('settings:hardware.usb.devices.keyboard.title')}
        content={t('settings:hardware.usb.devices.keyboard.desc')}
        checked={value.keyboard}
        onCheckedChange={enabled => handleDeviceToggle('keyboard', enabled)}
        disabled={disabled}
        titleSize={titleSize}
        contentSize={contentSize}
      />

      <SettingSwitch
        title={t('settings:hardware.usb.devices.absoluteMouse.title')}
        content={t('settings:hardware.usb.devices.absoluteMouse.desc')}
        checked={value.absolute_mouse}
        onCheckedChange={enabled =>
          handleDeviceToggle('absolute_mouse', enabled)
        }
        disabled={disabled}
        titleSize={titleSize}
        contentSize={contentSize}
      />

      <SettingSwitch
        title={t('settings:hardware.usb.devices.relativeMouse.title')}
        content={t('settings:hardware.usb.devices.relativeMouse.desc')}
        checked={value.relative_mouse}
        onCheckedChange={enabled =>
          handleDeviceToggle('relative_mouse', enabled)
        }
        disabled={disabled}
        titleSize={titleSize}
        contentSize={contentSize}
      />

      <SettingSwitch
        title={t('settings:hardware.usb.devices.virtualStorage.title')}
        content={t('settings:hardware.usb.devices.virtualStorage.desc')}
        checked={value.mass_storage}
        onCheckedChange={enabled => handleDeviceToggle('mass_storage', enabled)}
        disabled={disabled}
        titleSize={titleSize}
        contentSize={contentSize}
      />

      <SettingSwitch
        title={t('settings:hardware.usb.devices.usbMicrophone.title')}
        content={t('settings:hardware.usb.devices.usbMicrophone.desc')}
        checked={value.microphone}
        onCheckedChange={enabled => handleDeviceToggle('microphone', enabled)}
        disabled={disabled}
        titleSize={titleSize}
        contentSize={contentSize}
      />
    </div>
  );
}
