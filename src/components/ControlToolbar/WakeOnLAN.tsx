import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useJsonRpc } from '@/hooks/useJsonRpc';
import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiDeleteBin5Line } from 'react-icons/ri';
import { toast } from 'sonner';
interface WakeOnLANDevice {
  name: string
  macAddress: string
}

interface WakeOnLANProps {
  onWake?: (device: WakeOnLANDevice) => void
  onClose?: () => void
}

const WakeOnLAN: React.FC<WakeOnLANProps> = ({ onWake }) => {
  const [send, isConnected, sendAsync] = useJsonRpc();
  const { t } = useTranslation('common');
  const [view, setView] = useState<'list' | 'add'>('list');
  const [devices, setDevices] = useState<WakeOnLANDevice[]>([
    // { name: 'Remote Device 001', macAddress: '00:11:22:33:45:67' },
    // { name: 'Remote Device 002', macAddress: '00:11:22:33:45:68' }
  ]);

  // Add-device form state
  const [newDevice, setNewDevice] = useState({
    name: '',
    macAddress: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    macAddress: '',
  });

  // Unified helper to clear validation errors
  const clearError = useCallback((field?: keyof typeof errors) => {
    if (field) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    } else {
      setErrors({ name: '', macAddress: '' });
    }
  }, []);

  // Clear all errors and reset form
  const resetForm = useCallback(() => {
    setNewDevice({ name: '', macAddress: '' });
    clearError();
  }, [clearError]);

  // Validate MAC address format
  const validateMacAddress = (mac: string): boolean => {
    const macRegex =
      /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^[0-9A-Fa-f]{12}$/;
    const isValid = macRegex.test(mac);
    return isValid;
  };

  // Normalize MAC address to canonical format
  const formatMacAddress = (mac: string): string => {
    // Remove all non-hex characters
    const cleanMac = mac.replace(/[^0-9A-Fa-f]/g, '');
    // Add colon separators when length is 12
    if (cleanMac.length === 12) {
      return cleanMac.match(/.{2}/g)?.join(':') || cleanMac;
    }
    return mac;
  };
  const syncGetWakeOnLanDevices = useCallback(async () => {
    const respResult = await sendAsync(
      {
        method: 'getWakeOnLanDevices',
      },
      { resultOnly: true }
    );
    setDevices(respResult || []);
  }, [sendAsync]);
  useEffect(() => {
    if (!isConnected) return;
    syncGetWakeOnLanDevices();
  }, [syncGetWakeOnLanDevices, sendAsync, isConnected]);
  const handleWakeDevice = useCallback(
    (device: WakeOnLANDevice) => {
      send({
        method: 'sendWOLMagicPacket',
        params: { macAddress: device.macAddress },
        onResponse: resp => {
          if ('error' in resp) {
            const isInvalid = resp.error.data?.includes('invalid MAC address');
            if (isInvalid) {
              toast.error(t('wol.toastInvalidMac'));
            } else {
              toast.error(t('wol.toastSendFailed'));
            }
          } else {
            toast.success(t('wol.toastSendSuccess'));
            onWake?.(device);
          }
        },
      });
    },
    [send, t, onWake]
  );

  const handleDeleteDevice = (macAddress: string) => {
    const nDevices = devices.filter(d => d.macAddress !== macAddress);
    asynSetWakeOnLanDevices(nDevices, 'delete');
  };

  const validateForm = useCallback((): boolean => {
    const newErrors = { name: '', macAddress: '' };
    let isValid = true;
    // Validate device name
    if (!newDevice.name.trim()) {
      newErrors.name = t('wol.errorNameRequired');
      isValid = false;
    } else if (newDevice.name.trim().length < 2) {
      newErrors.name = t('wol.errorNameMinLength');
      isValid = false;
    }
    // Validate MAC address
    const trimmedMac = newDevice.macAddress.trim();
    if (!trimmedMac) {
      newErrors.macAddress = t('wol.errorMacRequired');
      isValid = false;
    } else if (!validateMacAddress(trimmedMac)) {
      newErrors.macAddress = t('wol.errorMacInvalid');
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  }, [newDevice.name, newDevice.macAddress]);
  const asynSetWakeOnLanDevices = useCallback(
    (devices: WakeOnLANDevice[], type = 'add') => {
      send({
        method: 'setWakeOnLanDevices',
        params: { params: { devices } },
        onResponse: resp => {
          if ('error' in resp) {
            toast.error(resp.error?.data || 'Unknown error');
            return;
          }
          toast.success(
            type === 'add'
              ? t('wol.toastAddSuccess')
              : t('wol.toastDeleteSuccess')
          );
          setDevices(devices);
          resetForm();
          setView('list');
        },
      });
    },
    [send]
  );
  const handleAddDevice = useCallback(() => {
    if (validateForm()) {
      const formattedMac = formatMacAddress(newDevice.macAddress);

      // Check whether a device with the same MAC already exists
      const existingDevice = devices.find(d => d.macAddress === formattedMac);
      if (existingDevice) {
        setErrors(prev => ({
          ...prev,
          macAddress: t('wol.errorMacDuplicate'),
        }));
        return;
      }

      const device: WakeOnLANDevice = {
        name: newDevice.name.trim(),
        macAddress: formattedMac,
      };

      asynSetWakeOnLanDevices([...devices, device]);
    }
  }, [newDevice, devices, validateForm, send]);

  const handleBack = () => {
    setView('list');
    resetForm();
  };

  if (view === 'add') {
    return (
      <div className="w-full text-[var(--text-color)] rounded-lg">
        <h2 className="font-semibold mb-2 text-[var(--text-color)] text-base">
          {t('wol.title')}
        </h2>

        <div className="space-y-[12px]">
          <div>
            <Input
              label={t('wol.deviceNameLabel')}
              id="device-name"
              size='mini'
              placeholder={t('wol.deviceNamePlaceholder')}
              value={newDevice.name}
              onChange={e => {
                setNewDevice({ ...newDevice, name: e.target.value });
                // Clear field error
                if (errors.name) {
                  clearError('name');
                }
              }}
              className={cn(
                'mt-1  border-gray-700 text-[var(--text-color)] placeholder-gray-400',
                errors.name && 'border-red-500 focus:border-red-500'
              )}
            />
            {errors.name && (
              <p className="text-caption text-red-400 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Input
              label={t('wol.macLabel')}
              id="mac-address"
               size='mini'
              placeholder={t('wol.macPlaceholder')}
              value={newDevice.macAddress}
              onChange={e => {
                const value = e.target.value;
                setNewDevice({ ...newDevice, macAddress: value });
                // Clear field error
                if (errors.macAddress) {
                  clearError('macAddress');
                }
              }}
              onBlur={() => {
                // Auto-normalize MAC address on blur
                if (
                  newDevice.macAddress &&
                  validateMacAddress(newDevice.macAddress)
                ) {
                  setNewDevice({
                    ...newDevice,
                    macAddress: formatMacAddress(newDevice.macAddress),
                  });
                }
              }}
              className={cn(
                'mt-1  border-[var(--border-color)] text-[var(--text-color)] placeholder-gray-400',
                errors.macAddress && 'border-red-500 focus:border-red-500'
              )}
            />
            {errors.macAddress && (
              <p className="text-caption text-red-400 mt-1">
                {errors.macAddress}
              </p>
            )}
            <p className="text-micro text-gray-500 mt-1">
              {t('wol.macFormatsHint')}
            </p>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button  size="mini" variant="default" onClick={handleBack}>
            <span>←</span>
            {t('wol.backButton')}
          </Button>
          <Button  size="mini" onClick={handleAddDevice} disabled={false} variant="primary">
            {t('wol.addDeviceButton')}

          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-[var(--text-color)] rounded-lg flex flex-col min-h-0">
      {/* Fixed header */}
      <div className="flex-shrink-0">
        <h2 className="text-h1 mb-2 text-[var(--text-color)]">
          {t('wol.title')}
        </h2>
        <p className="text-sub mb-4">{t('wol.subtitle')}</p>
      </div>

      {/* Scrollable device list area */}
      <div
        className="flex-1 overflow-y-auto min-h-0 mb-4 max-h-[50vh]"
      >
        <div className="space-y-3 pr-2">
          {devices.map((device, index) => (
            <div
              key={`${device.macAddress}-${index}`}
              className="flex items-end justify-between p-[12px] rounded-[4px] border border-[var(--border-color)]"
            >
              <div className="flex-1">
                <div className="text-body text-[var(--text-color)]">
                  {device.name}
                </div>
                <div className="text-caption text-gray-400">
                  {device.macAddress}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="mini"
                  variant="primary"

                  onClick={() => handleWakeDevice(device)}
                >
                  {t('wol.wakeButton')}
                </Button>
                <Button
                  size="mini"
                  variant="destructive"
                  onClick={() => handleDeleteDevice(device.macAddress)}
                >
                   {/* {t('wol.wakeDel')} */}
                    <RiDeleteBin5Line></RiDeleteBin5Line>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed footer action */}
      <div className="flex-shrink-0 flex justify-end pt-2]">
        <Button
          onClick={() => {
            setView('add');
            resetForm(); // clear previous validation errors and form values
          }}
          size="mini"
          variant="primary"
        >
          {t('wol.addDeviceButton')}
        </Button>
      </div>
    </div>
  );
};

export default WakeOnLAN;
