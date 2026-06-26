import { useGlobalSettingsStore } from '@/stores';
import {
  useActiveDeviceSettings,
  type UsbDeviceConfig,
} from '@/stores/devicesStore';
import { useEffect } from 'react';
import { toast } from 'sonner';

export type MouseInputMode = 'absolute' | 'relative'
export type UsbMouseOption = 'none' | 'relative' | 'absolute' | 'both'

export const getUsbMouseOption = (
  usbDeviceConfig?: UsbDeviceConfig
): UsbMouseOption | null => {
  if (!usbDeviceConfig) return null;
  const hasAbsoluteMouse = !!usbDeviceConfig.absolute_mouse;
  const hasRelativeMouse = !!usbDeviceConfig.relative_mouse;
  if (hasAbsoluteMouse && hasRelativeMouse) return 'both';
  if (hasRelativeMouse) return 'relative';
  if (hasAbsoluteMouse) return 'absolute';
  return 'none';
};

export const isMouseModeAvailable = (
  mode: MouseInputMode,
  usbDeviceConfig?: UsbDeviceConfig
) => {
  if (!usbDeviceConfig) return false;
  return mode === 'absolute'
    ? !!usbDeviceConfig.absolute_mouse
    : !!usbDeviceConfig.relative_mouse;
};

export const normalizeMouseInputMode = (mode?: string): MouseInputMode => {
  return mode === 'relative' ? 'relative' : 'absolute';
};

export const getFallbackMouseMode = (
  usbDeviceConfig?: UsbDeviceConfig
): MouseInputMode | null => {
  if (!usbDeviceConfig) return null;
  if (usbDeviceConfig.relative_mouse) return 'relative';
  if (usbDeviceConfig.absolute_mouse) return 'absolute';
  return null;
};

export const resolveUsbMouseInputMode = ({
  usbDeviceConfig,
  currentMouseInputMode,
  preferredMouseInputMode,
}: {
  usbDeviceConfig?: UsbDeviceConfig
  currentMouseInputMode: string
  preferredMouseInputMode: string
}) => {
  const currentMode = normalizeMouseInputMode(currentMouseInputMode);
  const preferredMode = normalizeMouseInputMode(preferredMouseInputMode);

  if (!usbDeviceConfig) {
    return { nextMouseInputMode: null, mouseModeChanged: false };
  }

  if (isMouseModeAvailable(preferredMode, usbDeviceConfig)) {
    return {
      nextMouseInputMode: preferredMode,
      mouseModeChanged: preferredMode !== currentMode,
    };
  }

  const fallbackMode = getFallbackMouseMode(usbDeviceConfig);
  return {
    nextMouseInputMode: fallbackMode,
    mouseModeChanged: fallbackMode !== null && fallbackMode !== currentMode,
  };
};

export const notifyUsbMouseModeChange = ({
  previousUsbDeviceConfig,
  nextUsbDeviceConfig,
  nextMouseInputMode,
  mouseModeChanged,
  t,
}: {
  previousUsbDeviceConfig?: UsbDeviceConfig
  nextUsbDeviceConfig: UsbDeviceConfig
  nextMouseInputMode: MouseInputMode | null
  mouseModeChanged: boolean
  t: (key: string) => string
}) => {
  const previousUsbMouseOption = getUsbMouseOption(previousUsbDeviceConfig);
  const nextUsbMouseOption = getUsbMouseOption(nextUsbDeviceConfig);

  if (!previousUsbMouseOption || previousUsbMouseOption === nextUsbMouseOption) {
    return;
  }

  if (nextUsbMouseOption === 'none') {
    toast.warning(t('settings:mouse.inputMode.toast.noMouseDevice'));
    return;
  }

  if (!mouseModeChanged) return;

  if (nextMouseInputMode === 'relative') {
    toast.info(t('settings:mouse.inputMode.toast.changedToRelative'));
  } else if (nextMouseInputMode === 'absolute') {
    toast.info(t('settings:mouse.inputMode.toast.changedToAbsolute'));
  }
};

interface UsbMouseModeSyncProps {
  usbDeviceConfig?: UsbDeviceConfig
}

export function UsbMouseModeSync({ usbDeviceConfig }: UsbMouseModeSyncProps) {
  const {
    mouseInputMode,
    preferredMouseInputMode,
    setTemporaryMouseInputMode,
  } = useGlobalSettingsStore();
  const storedUsbDeviceConfig = useActiveDeviceSettings(
    state => state.usbDeviceConfig
  );
  const effectiveUsbDeviceConfig = usbDeviceConfig ?? storedUsbDeviceConfig;

  useEffect(() => {
    const { nextMouseInputMode, mouseModeChanged } = resolveUsbMouseInputMode({
      usbDeviceConfig: effectiveUsbDeviceConfig,
      currentMouseInputMode: mouseInputMode,
      preferredMouseInputMode,
    });

    if (mouseModeChanged && nextMouseInputMode) {
      setTemporaryMouseInputMode(nextMouseInputMode);
    }
  }, [
    effectiveUsbDeviceConfig,
    mouseInputMode,
    preferredMouseInputMode,
    setTemporaryMouseInputMode,
  ]);

  return null;
}
