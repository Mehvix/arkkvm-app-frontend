/*
 * @Author: Lei Zhang daisy_zlei@163.com
 * @Date: 2026-06-04 10:57:34
 * @LastEditors: Lei Zhang daisy_zlei@163.com
 * @LastEditTime: 2026-06-18 16:00:18
 * @FilePath: /git-arkkvm-app-frontend/src/components/settings/SettingNetwork.tsx
 */
import { Button } from '@/components/ui/button';
import { useJsonRpc } from '@/hooks/useJsonRpc';
import { createLogger, redirectToIp } from '@/utils';
import { env } from '@/utils/env';
import type React from 'react';
import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import SettingPageContainer from '../SettingPageContainer';
import type {
  IPv6AddressEntry,
  mDNSMode,
  NetworkSettingsResponse,
  NetworkStateResponse,
  NetworkStatus,
  SetNetworkSettings,
  StaticIPv4Config,
  TimeSyncMode,
  VlanConfig,
  VlanSettingsMode,
} from './types';
import SettingBlock from '../SettingBlock';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  ApplyNetworkSettingsDialog,
  type ChangeGroup,
} from './ApplyNetworkSettingsDialog';
import { Switch } from '@/components/ui/switch';
import { NetworkConfigSection } from './VlanNetworkSection';
import type { NetworkConfigValue } from './VlanNetworkSection';
import type { StaticIPv4ConfigRef } from './StaticIPv4Config';
import { buildChangeList } from './utils';
import { useLoadingMap } from '@/hooks/useLoading';

const logger = createLogger('SettingNetwork');
const INPUT_WIDTH = 'w-[150px]';
const DEFAULT_VALUE: StaticIPv4Config = {
  ipAddress: '',
  subnetMask: '',
  gateway: '',
  dnsServers: [''],
};

export const DEFAULT_VLAN_CONFIG: VlanConfig = {
  ...DEFAULT_VALUE,
  vlan_id: '',
  ipv4_mode: null,
};

const DEFAULT_VLAN_SETTINGS: VlanSettingsMode = {
  vlan_enabled: false,
  primaryVlan: DEFAULT_VLAN_CONFIG,
  secondaryVlan: null,
};

const sanitizeHostname = (v: string) =>
  v.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '').slice(0, 253);
// Allow http/https prefix, domain/IP, port and common separators (no spaces)
const sanitizeHttpProxy = (v: string) => v.replace(/[^a-zA-Z0-9.:\/_-]/g, '');

const defaultNetworkSettings: SetNetworkSettings = {
  hostname: '',
  domain: '',
  http_proxy: '',

  ipv4_mode: 'dhcp',
  ipv6_mode: 'slaac',

  lldp_mode: 'basic',
  lldp_tx_tlvs: ['chassis', 'port', 'system', 'vlan'],

  mdns_mode: 'ipv4_only',

  time_sync_mode: 'ntp_and_http',
};

type VlanSettingsRequestEntry = Pick<VlanConfig, 'ipv4_mode' | 'ipv6_mode'> & {
  vlan_id: number
  static_ipv4?: StaticIPv4Config
}

const buildVlanSettingsRequestEntry = (
  vlan: VlanConfig
): VlanSettingsRequestEntry => {
  const entry: VlanSettingsRequestEntry = {
    vlan_id: Number(vlan.vlan_id),
    ipv4_mode: vlan.ipv4_mode,
    ipv6_mode: vlan.ipv6_mode,
  };

  if (vlan.ipv4_mode === 'static' && vlan.static_ipv4) {
    entry.static_ipv4 = vlan.static_ipv4;
    //  entry.static_ipv4.ip_address = vlan.static_ipv4.ipAddress;
  }

  return entry;
};

function isSameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    return a.every((item, index) => {
      return isSameValue(item, b[index]);
    });
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every(key => {
      return isSameValue(a[key], b[key]);
    });
  }

  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

const buildNetworkSettingsFormValue = (
  settings: Partial<NetworkSettingsResponse>,
  state: Partial<NetworkStateResponse>
): SetNetworkSettings => {
  const dhcpLease = state.dhcp_lease;
  const static_ipv4 =
    settings.ipv4_mode === 'dhcp' && dhcpLease
      ? {
          ipAddress: dhcpLease.ip || '',
          subnetMask: dhcpLease.netmask || '',
          gateway: dhcpLease.routers?.[0] || '',
          dnsServers: dhcpLease.dns_servers || [],
        }
      : settings.static_ipv4 || DEFAULT_VALUE;
  return {
    static_ipv4,
    hostname: settings.hostname ?? '',
    domain: settings.domain ?? '',
    http_proxy: settings.http_proxy ?? '',

    ipv4_mode: settings.ipv4_mode ?? 'dhcp',
    ipv6_mode: settings.ipv6_mode ?? 'slaac',

    static_ipv6: settings.static_ipv6,

    lldp_mode: settings.lldp_mode ?? 'basic',
    lldp_tx_tlvs: settings.lldp_tx_tlvs ?? [],

    mdns_mode: settings.mdns_mode ?? 'ipv4_only',

    time_sync_mode: settings.time_sync_mode ?? 'ntp_and_http',
  };
};
const buildNetworkStatusFormValue = (
  state: Partial<NetworkStateResponse>,
  settings: Partial<NetworkSettingsResponse>
): NetworkStatus => {
  const { dhcp_lease, ipv4, ipv4_addresses } = state || {};
  // Fix: sync dhcp_lease.ip to actual ipv4 address when they differ
  const correctedLease =
    dhcp_lease && ipv4 === ipv4_addresses?.[0] && dhcp_lease.ip !== ipv4
      ? { ...dhcp_lease, ip: ipv4 }
      : dhcp_lease;
  return {
    ipv4_mode: settings.ipv4_mode ?? 'dhcp',
    static_ipv4: settings.static_ipv4,
    mac_address: state.mac_address ?? '',
    hostname: settings.hostname,
    dhcp_lease: correctedLease ?? null,
    ipv6_addresses: state.ipv6_addresses || [],
    ipv6_link_local: state.ipv6_link_local || '',
  };
};
type SelectValueLike = unknown
const getSelectValue = (v: SelectValueLike): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'target' in v) {
    const target = (v as { target?: unknown }).target;
    if (typeof target === 'object' && target !== null && 'value' in target) {
      const value = (target as { value?: unknown }).value;
      if (typeof value === 'string') return value;
    }
  }
  return '';
};

interface SettingNetworkProps {
  rpc?: unknown
  /** Cloud mode: callback to reconnect WebRTC instead of page reload */
  onReconnect?: () => void | Promise<void>
}

const SettingNetwork: FC<SettingNetworkProps> = ({ onReconnect }) => {
  const { t } = useTranslation(['settings']);
  const { confirm } = useConfirmDialog();
  const [saveLoading, setSaveLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [networkSettingsFormValue, setNetworkSettingsFormValue] =
    useState<SetNetworkSettings | null>(null);
  const [originalSettings, setOriginalSettings] =
    useState<SetNetworkSettings | null>(null);
  const [send, isChannelReady, sendAsync] = useJsonRpc();
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const networkStaticIpRef = useRef<StaticIPv4ConfigRef>(null);
  const primaryStaticIpRef = useRef<StaticIPv4ConfigRef>(null);
  const secondaryStaticIpRef = useRef<StaticIPv4ConfigRef>(null);
  const [primaryVlanIdError, setPrimaryVlanIdError] = useState<
    string | undefined
  >(undefined);
  const [secondaryVlanIdError, setSecondaryVlanIdError] = useState<
    string | undefined
  >(undefined);
  const [vlanSettingsFormValue, setVlanSettingsFormValue] =
    useState<VlanSettingsMode | null>(null);
  const [originalVlanSettings, setOriginalVlanSettings] =
    useState<VlanSettingsMode | null>(null);
  const updateVlanSettings = useCallback(
    (
      patch:
        | ((prev: VlanSettingsMode) => VlanSettingsMode)
        | Partial<VlanSettingsMode>
    ) => {
      setVlanSettingsFormValue(pre => {
        if (!pre) return pre;
        return typeof patch === 'function' ? patch(pre) : { ...pre, ...patch };
      });
    },
    []
  );
  const { isLoading, start, stop } = useLoadingMap([
    'getVlanSettings',
    'setVlanSettings',
    'confirmVlanSettings',
    'revertVlanSettings',
    'setNetworkSettings',
  ]);
  const [applyDialogData, setApplyDialogData] = useState<{
    title: string
    description: React.ReactNode
    groupedChanges: ChangeGroup[]
    cancelText?: string
    countdownSeconds?: number
    countdownCancelText?: (remaining: number) => string
    redirectAfterSeconds?: number
    originalIpAddress?: string
    newIpAddress?: string
    disableActions?: boolean
    onConfirm: () => Promise<void>
    onCancel?: () => void
    onCountdownExpire?: () => void
  } | null>(null);
  const getNetworkSettings = useCallback(async () => {
    const [networkState, networkSettings] = await Promise.all([
      sendAsync(
        {
          method: 'getNetworkState',
        },
        {
          resultOnly: true,
        }
      ),
      sendAsync(
        {
          method: 'getNetworkSettings',
        },
        {
          resultOnly: true,
        }
      ),
    ]);
    const formValue = buildNetworkSettingsFormValue(
      networkSettings,
      networkState
    );
    const buildNetworkStatus = buildNetworkStatusFormValue(
      networkState,
      networkSettings
    );
    setNetworkStatus(buildNetworkStatus);
    setNetworkSettingsFormValue(formValue);
    setOriginalSettings(formValue);
    const domainValue = formValue.domain ?? '';
    const newSelectedDomain = ['dhcp', 'local'].includes(domainValue)
      ? domainValue
      : 'custom';
    setSelectedDomain(newSelectedDomain);
  }, [sendAsync, networkStatus]);
  const getVlanSettings = useCallback(async () => {
    start('getVlanSettings');
    const resp = await sendAsync(
      { method: 'getVlanSettings' },
      {
        resultOnly: true,
        showUnhandledErrorToast: true,
      }
    );
    stop('getVlanSettings');
    const vlanSettings = resp?.settings;
    if (vlanSettings) {
      const formValue: VlanSettingsMode = { ...vlanSettings };
      const vlan_enabled = vlanSettings.vlan_enabled;
      if (!vlan_enabled) {
        formValue.primaryVlan = {
          ...vlanSettings.primaryVlan,
          static_ipv4: { ...DEFAULT_VALUE },
          vlan_id: '',
          ipv4_mode: null,
        };
      }
      setVlanSettingsFormValue(formValue);
      setOriginalVlanSettings(formValue);
    }

    return vlanSettings;
  }, [sendAsync]);
  useEffect(() => {
    if (!isChannelReady) return;
    let isCancelled = false;
    void (async () => {
      try {
        getNetworkSettings();
        // getVlanSettings();

        if (isCancelled) return;

        // Merge once to avoid multiple renders; base on existing network and override with state/settings
      } catch (e) {
        if (isCancelled) return;
        logger.error('Failed to load network settings', e);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [isChannelReady]);
  const hasNetworkSettingsChanged = useMemo(() => {
    const vlanChangeConsidered = !isSameValue(
      vlanSettingsFormValue,
      originalVlanSettings
    );

    // When VLAN is enabled, only treat VLAN as changed if at least one VLAN ID
    // (primary or secondary) exists and the VLAN settings actually differ.
    // If VLAN is disabled, any difference in vlanSettingsFormValue counts.
    // let vlanChangeConsidered = false;
    // if (vlanSettingsFormValue?.vlan_enabled) {
    //   const primaryHasId = !!vlanSettingsFormValue.primaryVlan?.vlan_id;
    //   const secondaryHasId = !!vlanSettingsFormValue.secondaryVlan?.vlan_id;
    //   vlanChangeConsidered = (primaryHasId || secondaryHasId) && vlanHasChange;
    // } else {
    //   vlanChangeConsidered = vlanHasChange;
    // }

    return (
      !isSameValue(networkSettingsFormValue, originalSettings) ||
      vlanChangeConsidered
    );
  }, [
    networkSettingsFormValue,
    originalSettings,
    vlanSettingsFormValue,
    originalVlanSettings,
  ]);
  const callSetNetworkSettings = useCallback(
    async (settings: SetNetworkSettings): Promise<unknown> => {
      // const {vlan_enabled,secondaryVlan,primaryVlan} = vlanSettingsFormValue||{};
      // if(vlan_enabled&&(primaryVlan?.vlan_id||secondaryVlan?.vlan_id)){
      //   settings.ipv4_mode = originalSettings?.ipv4_mode;
      // }
      setSaveLoading(true);
      try {
        if (!isChannelReady) {
          toast.error('Channel not ready, please connect first');
          return { success: false, error: { message: 'Channel not ready' } };
        }

        // Only redirect when: VLAN disabled + static mode + valid new IP + IP actually changed
        const isVlanDisabled = !vlanSettingsFormValue?.vlan_enabled;
        const isStaticMode = settings.ipv4_mode === 'static';
        const newIp = settings.static_ipv4?.ipAddress?.trim();
        const oldIp =
          originalSettings?.ipv4_mode === 'dhcp'
            ? networkStatus?.dhcp_lease?.ip
            : originalSettings?.static_ipv4?.ipAddress?.trim();
        const hasValidNewIp = !!newIp;
        const ipChanged = oldIp !== newIp;
        const willRedirect =
          isVlanDisabled && isStaticMode && hasValidNewIp && ipChanged;

        // return false;
        start('setNetworkSettings');
        const result = await sendAsync({
          method: 'setNetworkSettings',
          params: { settings },
        },{
          timeout:120000,
          showUnhandledErrorToast:true
        });
        stop('setNetworkSettings');
        const errorCode = result?.error?.code;
        const envTarget = env.target;
        if (
          result?.success ||
          (envTarget === 'cloud' && errorCode === -32003)
        ) {
          if (willRedirect && env.target === 'device') {
            toast.success('Network settings saved, redirecting to new IP...');
            await redirectToIp(settings.static_ipv4!.ipAddress, 2000);
          } else if (
            envTarget === 'cloud' &&
            willRedirect ||
            (!isStaticMode && originalSettings?.ipv4_mode === 'static')
          ) {
            setApplyDialogOpen(false);
            getNetworkSettings();
            await redirectToIp(settings.static_ipv4!.ipAddress, {
              delayMs: env.target === 'cloud' ? 9000 : 2000,
              onCloudReconnect: onReconnect,
            });

          } else {
            toast.success('Network settings saved successfully');
            getNetworkSettings();
          }
        }
        return result;
      } catch (e) {
        toast.error(
          `Failed to save: ${e instanceof Error ? e.message : 'Unknown error'}`
        );
        return { success: false, error: { message: String(e) } };
      } finally {
        setSaveLoading(false);
      }
    },
    [
      send,
      sendAsync,
      isChannelReady,
      vlanSettingsFormValue,
      originalSettings,
      networkStatus,
    ]
  );

  const callSetVlanSettings = useCallback(
    async (settings: VlanSettingsMode): Promise<number | null> => {
      try {
        const {
          primaryVlan,
          secondaryVlan,
          vlan_enabled: oldVlanEnabled,
        } = settings;
        if (
          !oldVlanEnabled &&
          !primaryVlan?.vlan_id &&
          !secondaryVlan?.vlan_id
        ) {
          setApplyDialogOpen(false);
          setSaveLoading(false);

          getVlanSettings();
          return null;
        }
        setSaveLoading(true);
        const vlan_enabled =
          primaryVlan.vlan_id || secondaryVlan?.vlan_id ? oldVlanEnabled : false;
        const vlanSettingsRequest = {
          vlan_enabled,
          primaryVlan: primaryVlan.vlan_id
            ? buildVlanSettingsRequestEntry(primaryVlan)
            : secondaryVlan
              ? buildVlanSettingsRequestEntry(secondaryVlan)
              : null,
          secondaryVlan:
            secondaryVlan && primaryVlan.vlan_id
              ? buildVlanSettingsRequestEntry(secondaryVlan)
              : null,
        };
        start('setVlanSettings');
        const result = await sendAsync(
          {
            method: 'setVlanSettings',
            params: { settings: vlanSettingsRequest },
          },
          {
            timeout: 120000,
            showUnhandledErrorToast: true,
          }
        );
        stop('setVlanSettings');
        setSaveLoading(false);

        return result?.result?.confirm_within_seconds;
      } catch (e) {
        setSaveLoading(false);
        toast.error(
          `Failed to apply VLAN settings: ${e instanceof Error ? e.message : 'Unknown error'}`
        );
        return null;
      }
    },
    [sendAsync]
  );

  const saveNetworkSettings = useCallback(async () => {
    //  || !vlanSettingsFormValue
    if (!networkSettingsFormValue) return;

    // Clear previous inline VLAN ID errors
    setPrimaryVlanIdError(undefined);
    setSecondaryVlanIdError(undefined);
    //
    const { hostname, ipv4_mode, static_ipv4 } = networkSettingsFormValue || {};
    const {
      hostname: originalHostname,
      ipv4_mode: originalIpv4Mode,
      static_ipv4: originalStaticIpv4,
    } = originalSettings ?? {};
    const { vlan_enabled, primaryVlan, secondaryVlan } =
      vlanSettingsFormValue || {};
    const {
      vlan_enabled: oldVlanEnabled,
      primaryVlan: oldPrimaryVlan,
      secondaryVlan: oldSecondaryVlan,
    } = originalVlanSettings ?? {};
    const hasVlanId = Boolean(primaryVlan?.vlan_id || secondaryVlan?.vlan_id);
    const isEmptyVlanEnable = !oldVlanEnabled && vlan_enabled && !hasVlanId;
    const hasVlanChange =
      !isEmptyVlanEnable &&
      !isSameValue(vlanSettingsFormValue, originalVlanSettings);

    const needsDialog =
      !isSameValue(
        {
          hostname: originalHostname,
          ipv4_mode: originalIpv4Mode,
          static_ipv4: originalStaticIpv4,
        },
        { hostname, ipv4_mode, static_ipv4 }
      ) || hasVlanChange;

    if (!needsDialog && vlan_enabled === oldVlanEnabled) {
      await callSetNetworkSettings(networkSettingsFormValue);

      return;
    }
    //  if (!oldVlanEnabled&&vlan_enabled && !primaryVlan?.vlan_id && !secondaryVlan?.vlan_id) {
    //     getVlanSettings();
    //     return;
    //   }
    if (vlan_enabled) {
      // Trigger inline validation in StaticIPv4Config forms before checking values
      const primaryValid =
        primaryVlan?.ipv4_mode === 'static'
          ? ((await primaryStaticIpRef.current?.validate()) ?? true)
          : true;
      const secondaryValid =
        secondaryVlan?.ipv4_mode === 'static'
          ? ((await secondaryStaticIpRef.current?.validate()) ?? true)
          : true;
      if (!primaryValid || !secondaryValid) return;

      if (secondaryVlan) {
        if (
          secondaryVlan.vlan_id &&
          secondaryVlan.vlan_id === primaryVlan.vlan_id
        ) {
          setSecondaryVlanIdError(
            t(
              'settings:network.vlan.validation.vlanIdDuplicate',
              'Must be different from Primary VLAN ID'
            )
          );
          return;
        }
      }
    }

    // Build dialog groups
    const groups: ChangeGroup[] = [];
    const networkGroup = buildChangeList(
      originalSettings,
      networkSettingsFormValue,
      ['hostname', 'static_ipv4.ipAddress', 'ipv4_mode']
    );
    if (
      (!oldVlanEnabled &&
        vlan_enabled &&
        (primaryVlan?.vlan_id || secondaryVlan?.vlan_id)) ||
      (oldVlanEnabled && !vlan_enabled)
    ) {
      networkGroup.push({
        key: 'vlan_enabled',
        label: 'VLAN',
        from: oldVlanEnabled ? 'Enabled' : 'Disabled',
        to: vlan_enabled ? 'Enabled' : 'Disabled',
      });
    } else if (vlan_enabled && oldVlanEnabled) {
      const primaryFrom = originalVlanSettings?.primaryVlan.vlan_id
        ? `${originalVlanSettings?.primaryVlan.vlan_id || '.'}`
        : ' ';
      if (
        !primaryVlan?.vlan_id &&
        oldPrimaryVlan?.vlan_id &&
        oldSecondaryVlan?.vlan_id &&
        !secondaryVlan?.vlan_id
      ) {
        networkGroup.push({
          key: 'primary_vlan_delete',
          label: 'Primary VLAN  ',
          from: `${oldPrimaryVlan?.vlan_id || ''}`,
          to: 'Deleted',
        });
        networkGroup.push({
          key: 'secondary _vlan_delete',
          label: 'Secondary VLAN',
          from: `${oldSecondaryVlan?.vlan_id || ''}`,
          to: 'Deleted',
        });
      } else if (!primaryVlan?.vlan_id && secondaryVlan?.vlan_id) {
        networkGroup.push({
          key: 'primary_vlan_delete',
          label: 'Primary VLAN  ',
          from: primaryFrom,
          to: 'Deleted',
        });
        networkGroup.push({
          key: 'secondary _vlan_delete',
          label: 'Secondary VLAN',
          from: `${secondaryVlan?.vlan_id || ''}`,
          to: `Primary VLAN ${secondaryVlan?.vlan_id || '-'}`,
        });
      } else if (oldSecondaryVlan?.vlan_id && !secondaryVlan?.vlan_id) {
        const secondaryrom = originalVlanSettings?.secondaryVlan?.vlan_id
          ? `${originalVlanSettings?.secondaryVlan?.vlan_id || '.'}`
          : ' ';
        networkGroup.push({
          key: 'secondary _vlan_delete',
          label: 'Secondary VLAN  ',
          from: secondaryrom,
          to: 'Deleted',
        });
      } else if (
        !primaryVlan?.vlan_id &&
        oldPrimaryVlan?.vlan_id &&
        !secondaryVlan?.vlan_id
      ) {
        networkGroup.push({
          key: 'primary_vlan_delete',
          label: 'Primary VLAN  ',
          from: primaryFrom,
          to: 'Deleted',
        });
      }
    }

    const networkIpChanged =
      networkSettingsFormValue.ipv4_mode === 'static' &&
      networkSettingsFormValue.static_ipv4?.ipAddress &&
      originalSettings?.static_ipv4?.ipAddress !==
        networkSettingsFormValue.static_ipv4?.ipAddress;
    if (networkGroup.length)
      groups.push({
        title: t('settings:network.applyDialog.networkGroup', 'Network'),
        fields: networkGroup,
        warning: networkIpChanged
          ? t(
              'settings:network.applyDialog.ipChangeWarning',
              'Changing the IP address will disconnect the current session. The browser will redirect automatically.'
            )
          : undefined,
      });

    let primaryVLANFields = null;
    let secondaryVlanields = null;
    const changeListOptions = {
      valueFormatters: {
        vlan_id: (value: unknown) => {
          return value ? String(value) : 'Not configured';
        },
      },
    };
    if (vlan_enabled) {
      const keys1 = ['vlan_id', 'ipv4_mode', 'static_ipv4.ipAddress'];
      const keys2 = ['vlan_id', 'ipv4_mode'];
      const primaryVlanKeys =
        primaryVlan?.ipv4_mode === 'static' ? keys1 : keys2;
      const secondaryVlanKeys =
        secondaryVlan?.ipv4_mode === 'static' ? keys1 : keys2;

      if (primaryVlan.vlan_id) {
        primaryVLANFields = buildChangeList(
          oldPrimaryVlan || DEFAULT_VLAN_CONFIG,
          primaryVlan,
          primaryVlanKeys,
          changeListOptions
        );
      }

      if (secondaryVlan && primaryVlan.vlan_id && secondaryVlan.vlan_id) {
        secondaryVlanields = buildChangeList(
          oldSecondaryVlan || DEFAULT_VLAN_CONFIG,
          secondaryVlan,
          secondaryVlanKeys,
          changeListOptions
        );
      }

      if (secondaryVlan?.vlan_id && !primaryVlan.vlan_id) {
        primaryVLANFields = buildChangeList(
          oldPrimaryVlan || DEFAULT_VLAN_CONFIG,
          secondaryVlan,
          primaryVlanKeys,
          changeListOptions
        );
      }
      if (primaryVLANFields?.length) {
        const vlanIpChanged =
          primaryVlan?.ipv4_mode === 'static' &&
          primaryVlan?.static_ipv4?.ipAddress &&
          oldPrimaryVlan?.static_ipv4?.ipAddress !==
            primaryVlan?.static_ipv4?.ipAddress;
        groups.push({
          title: t('settings:network.vlan.primaryVlan.title', 'Primary VLAN'),
          fields: primaryVLANFields,
          warning: vlanIpChanged
            ? t(
                'settings:network.applyDialog.ipChangeWarning',
                'Changing the IP address will disconnect the current session. The browser will redirect automatically.'
              )
            : undefined,
        });
      }
      if (secondaryVlanields?.length) {
        groups.push({
          title: t(
            'settings:network.vlan.secondaryVlan.title',
            'Secondary VLAN'
          ),
          fields: secondaryVlanields,
        });
      }
    }
    if (
      primaryVLANFields?.length ||
      secondaryVlanields?.length ||
      vlan_enabled !== oldVlanEnabled ||
      (oldVlanEnabled && (!primaryVlan.vlan_id || !secondaryVlan?.vlan_id))
    ) {
      setApplyDialogData({
        title: t(
          'settings:network.applyDialog.title',
          'Apply network settings'
        ),
        description: hasVlanChange ? (
          <div className="space-y-2 text-sm">
            <p>
              {t(
                'settings:network.applyDialog.vlanDesc1',
                'Applying VLAN settings will temporarily interrupt the connection.'
              )}
            </p>
            <p>
              {t(
                'settings:network.applyDialog.vlanDesc2',
                'ArkKVM may obtain a new IP address. You may need to reconnect using the updated address shown on the ArkKVM screen.'
              )}
            </p>
            <p>
              {t(
                'settings:network.applyDialog.vlanDesc3',
                'The new settings must be confirmed within 90 seconds, otherwise ArkKVM will automatically revert to the previous network configuration.'
              )}
            </p>
          </div>
        ) : (
          t(
            'settings:network.applyDialog.desc',
            'The following network settings will be applied. These changes may require a reboot and cause brief disconnection.'
          )
        ),
        groupedChanges: groups,
        onConfirm: async () => {
          if (!isSameValue(networkSettingsFormValue, originalSettings)) {
            await callSetNetworkSettings(networkSettingsFormValue);
          }
          if (!hasVlanChange) {
            setApplyDialogOpen(false);
            return;
          }

          const seconds = await callSetVlanSettings(vlanSettingsFormValue);
          if (seconds) {
            const originalIp =
              originalVlanSettings?.primaryVlan?.static_ipv4?.ipAddress;
            const newIp =
              vlanSettingsFormValue?.primaryVlan?.static_ipv4?.ipAddress ||
              vlanSettingsFormValue?.secondaryVlan?.static_ipv4?.ipAddress;
            setTimeout(
              async () => {
                if (
                  newIp &&
                  newIp !== originalIp &&
                  vlanSettingsFormValue.primaryVlan.ipv4_mode === 'static' &&
                  env.target !== 'cloud'
                ) {
                  await redirectToIp(newIp);
                } else {
                  window.location.reload();
                }
              },
              env.target === 'cloud' ? 8000 : 3000
            );
            // Note: onReconnect callback is handled by the parent component in cloud mode

            setApplyDialogData(
              prev =>
                prev && {
                  ...prev,
                  groupedChanges: groups,
                  countdownSeconds: seconds,
                  countdownCancelText: (r: number) => `Revert (${r}s)`,
                  disableActions: true,
                  onConfirm: async () => {
                    await sendAsync(
                      { method: 'confirmVlanSettings' },
                      { showUnhandledErrorToast: true }
                    );
                    toast.success('VLAN settings confirmed');
                    setOriginalVlanSettings(vlanSettingsFormValue);
                    setApplyDialogOpen(false);
                  },
                  onCancel: async () => {
                    await sendAsync({ method: 'revertVlanSettings' });
                    toast.info('VLAN settings reverted');
                    setVlanSettingsFormValue(originalVlanSettings);
                  },
                  onCountdownExpire: async () => {
                    await sendAsync({ method: 'revertVlanSettings' });
                    toast.info('VLAN settings reverted (timeout)');
                    setVlanSettingsFormValue(originalVlanSettings);
                    setApplyDialogOpen(false);
                  },
                }
            );
            setApplyDialogOpen(true);
          } else {
            // setApplyDialogOpen(false);

            //  setApplyDialogOpen(false);
            setSaveLoading(false);
          }
        },
      });
    } else if (networkGroup.length) {
      setApplyDialogData({
        title: t(
          'settings:network.applyDialog.title',
          'Apply network settings'
        ),
        description: hasVlanChange ? (
          <div className="space-y-2 text-sm">
            {t(
              'settings:network.applyDialog.desc',
              'The following network settings will be applied. These changes may require a reboot and cause brief disconnection.'
            )}
          </div>
        ) : (
          t(
            'settings:network.applyDialog.desc',
            'The following network settings will be applied. These changes may require a reboot and cause brief disconnection.'
          )
        ),
        groupedChanges: groups,
        onConfirm: async () => {
          if (!isSameValue(networkSettingsFormValue, originalSettings)) {
            const result = await callSetNetworkSettings(
              networkSettingsFormValue
            );
            if (result?.success || env.target === 'cloud') {
              setApplyDialogOpen(false);
            }
          }
        },
      });
    }
    if (!groups.length) {
      setApplyDialogData(null);
      setApplyDialogOpen(false);
      getVlanSettings();
      return;
    }

    setApplyDialogOpen(true);
  }, [
    networkSettingsFormValue,
    originalSettings,
    vlanSettingsFormValue,
    originalVlanSettings,
    t,
    callSetNetworkSettings,
    callSetVlanSettings,
    sendAsync,
  ]);
  const handleVlanEnabledChange = useCallback(
    async (checked: boolean) => {
      if (checked) {
        await confirm({
          title: t('settings:network.vlan.enableWarning.title', 'Enable VLAN?'),
          content: (
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <p>
                {t(
                  'settings:network.vlan.enableWarning.line1',
                  'Enabling VLAN mode replaces the untagged network interface with tagged VLAN interfaces.'
                )}
              </p>
              <p>
                {t(
                  'settings:network.vlan.enableWarning.line2',
                  'Incorrect settings may make the device unreachable.'
                )}
              </p>
            </div>
          ),
          confirmText: t('common:ok', 'OK'),
          cancelText: t('common:cancel', 'Cancel'),
          onConfirm: () => {
            if (!originalVlanSettings?.vlan_enabled) {
              const { ipv4_mode, dhcp_lease, static_ipv4 } = networkStatus || {};
              setVlanSettingsFormValue({
                vlan_enabled: true,
                primaryVlan: {
                  ...vlanSettingsFormValue?.primaryVlan,
                  dhcp_lease: null,
                  ipv4_mode,
                  ipv6_mode: 'slaac',
                  static_ipv4: static_ipv4 || {
                    ipAddress: dhcp_lease?.ip,
                    subnetMask: dhcp_lease?.netmask,
                    gateway: dhcp_lease?.routers?.[0] ?? '',
                    dnsServers: dhcp_lease?.dns_servers ?? [],
                  },
                } as VlanConfig,
                secondaryVlan: null,
              });
            } else {
              setVlanSettingsFormValue(prev => ({
                ...(prev ?? DEFAULT_VLAN_SETTINGS),
                primaryVlan: { ...originalVlanSettings.primaryVlan },
                secondaryVlan: originalVlanSettings.secondaryVlan
                  ? { ...originalVlanSettings.secondaryVlan }
                  : null,
                vlan_enabled: true,
              }));
            }
          },
        });
      } else {
        setVlanSettingsFormValue(prev => ({
          ...(prev ?? DEFAULT_VLAN_SETTINGS),
          vlan_enabled: false,
        }));

        // TODO: add disable logic here
      }
    },
    [
      confirm,
      t,
      updateVlanSettings,
      vlanSettingsFormValue,
      originalVlanSettings,
      networkStatus,
    ]
  );

  const renewDhcpLease = useCallback(async () => {
    await confirm({
      title: t('settings:network.dhcpLease.renewTitle'),
      content: t('settings:network.dhcpLease.renewContent'),
      confirmText: t('settings:network.dhcpLease.renewConfirm'),
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const { success } = await sendAsync(
            { method: 'renewDHCPLease' },
            { showUnhandledErrorToast: true }
          );
          if (success) {
            toast.success('DHCP lease renewed successfully');
          }
        } catch (error) {
          toast.error(
            `Failed to renew DHCP lease: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      },
    });
  }, [confirm, sendAsync, t]);

  return (
    <SettingPageContainer
      title={t('settings:pages.network.title')}
      description={t('settings:pages.network.description')}
      footer={
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="xs"
            onClick={saveNetworkSettings}
            disabled={saveLoading || !hasNetworkSettingsChanged}
          >
            {saveLoading
              ? t('settings:network.savingButton')
              : t('settings:network.saveButton')}
            {hasNetworkSettingsChanged}
          </Button>
        </div>
      }
    >
      {networkSettingsFormValue && (
        <>
          <SettingBlock
            title={t('settings:network.macAddress.title')}
            content={t('settings:network.macAddress.desc')}
          >
            <SettingBlock.Right>
              <Input
                size="xs"
                value={networkStatus?.mac_address ?? ''}
                readOnly
                className={INPUT_WIDTH}
              />
            </SettingBlock.Right>
          </SettingBlock>
          <SettingBlock
            title={t('settings:network.hostname.title')}
            content={t('settings:network.hostname.desc')}
          >
            <SettingBlock.Right>
              <Input
                size="xs"
                value={networkSettingsFormValue?.hostname ?? ''}
                sanitize={sanitizeHostname}
                onChange={e =>
                  setNetworkSettingsFormValue(prev => ({
                    ...(prev ?? defaultNetworkSettings),
                    hostname: sanitizeHostname(e.target.value),
                  }))
                }
                className={INPUT_WIDTH}
              />
            </SettingBlock.Right>
          </SettingBlock>
          <SettingBlock
            title={t('settings:network.httpProxy.title')}
            content={t('settings:network.httpProxy.desc')}
          >
            <SettingBlock.Right>
              <Input
                size="xs"
                value={networkSettingsFormValue?.http_proxy || ''}
                onChange={e =>
                  setNetworkSettingsFormValue(prev => ({
                    ...(prev ?? defaultNetworkSettings),
                    http_proxy: sanitizeHttpProxy(e.target.value),
                  }))
                }
                className={INPUT_WIDTH}
              />
            </SettingBlock.Right>
          </SettingBlock>
          <SettingBlock
            title={t('settings:network.domain.title')}
            content={t('settings:network.domain.desc')}
          >
            <SettingBlock.Right>
              <Select
                value={selectedDomain}
                size="xs"
                onChange={(v: unknown) => {
                  const newValue = getSelectValue(v);
                  const domain = newValue === 'custom' ? '' : newValue;
                  setSelectedDomain(newValue);
                  setNetworkSettingsFormValue(prev => ({
                    ...(prev ?? defaultNetworkSettings),
                    domain,
                  }));
                }}
                options={[
                  { value: 'dhcp', label: 'DHCP provided' },
                  { value: 'local', label: 'None' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            </SettingBlock.Right>
            {selectedDomain === 'custom' && (
              <SettingBlock.Bottom>
                <Input
                  label="Custom Domain"
                  size="xs"
                  labelClassName="text-[12px]"
                  value={networkSettingsFormValue.domain ?? ''}
                  onChange={e =>
                    setNetworkSettingsFormValue(prev => ({
                      ...(prev ?? defaultNetworkSettings),
                      domain: e.target.value,
                    }))
                  }
                  className={INPUT_WIDTH}
                />
              </SettingBlock.Bottom>
            )}
          </SettingBlock>
          <SettingBlock
            title={t('settings:network.mdns.title')}
            content={t('settings:network.mdns.desc')}
          >
            <SettingBlock.Right>
              <Select
                value={networkSettingsFormValue.mdns_mode}
                size="xs"
                onChange={v =>
                  setNetworkSettingsFormValue(prev => ({
                    ...(prev ?? defaultNetworkSettings),
                    mdns_mode: getSelectValue(v) as mDNSMode,
                  }))
                }
                options={[
                  { value: 'disabled', label: 'Disabled' },
                  { value: 'auto', label: 'Auto' },
                  { value: 'ipv4_only', label: 'IPv4 only' },
                  { value: 'ipv6_only', label: 'IPv6 only' },
                ]}
              />
            </SettingBlock.Right>
          </SettingBlock>
          <SettingBlock
            title={t('settings:network.timeSynchronization.title')}
            content={t('settings:network.timeSynchronization.desc')}
          >
            <SettingBlock.Right>
              <Select
                value={networkSettingsFormValue.time_sync_mode}
                size="xs"
                onChange={v =>
                  setNetworkSettingsFormValue(prev => ({
                    ...(prev ?? defaultNetworkSettings),
                    time_sync_mode: getSelectValue(v) as TimeSyncMode,
                  }))
                }
                options={[
                  { value: 'ntp_only', label: 'NTP only' },
                  { value: 'ntp_and_http', label: 'HTTP + NTP' },
                  { value: 'http_only', label: 'HTTP only' },
                ]}
              />
            </SettingBlock.Right>
          </SettingBlock>
          {/* VLAN section */}
          {vlanSettingsFormValue && (
            <SettingBlock
              title={t('settings:network.vlan.title')}
              content={t('settings:network.vlan.desc')}
            >
              <SettingBlock.Right>
                <Switch
                  disabled={isLoading('getVlanSettings')}
                  checked={vlanSettingsFormValue?.vlan_enabled ?? false}
                  onCheckedChange={handleVlanEnabledChange}
                />
              </SettingBlock.Right>

              {/* primaryVlan */}
              {vlanSettingsFormValue?.vlan_enabled && (
                <SettingBlock.Bottom className="pl-[24px]">
                  <SettingBlock
                    paddingBottom="pb-0"
                    title={t('settings:network.vlan.primaryVlan.title')}
                    content={t('settings:network.vlan.primaryVlan.desc')}
                  >
                    <SettingBlock.Bottom className="pl-[24px] pb-0">
                      <NetworkConfigSection
                        title={t('settings:network.vlan.vlanId.title')}
                        description={t(
                          'settings:network.vlan.secondaryVlan.idDesc',
                          'Secondary VLAN must use a different VLAN ID from the Primary VLAN.'
                        )}
                        showVlanId
                        originalIpv4Mode={
                          originalVlanSettings?.primaryVlan?.ipv4_mode
                        }
                        vlanEnabled={originalVlanSettings?.vlan_enabled}
                        staticIpv4Ref={primaryStaticIpRef}
                        vlanIdError={primaryVlanIdError}
                        value={vlanSettingsFormValue.primaryVlan}
                        ipv6Addresses={
                          originalVlanSettings?.primaryVlan
                            ?.ipv6_addresses as IPv6AddressEntry[]
                        }
                        dhcpLease={
                          vlanSettingsFormValue?.primaryVlan?.dhcp_lease
                        }
                        onChange={(value: NetworkConfigValue) => {
                          updateVlanSettings(pre => ({
                            ...pre,
                            primaryVlan: { ...pre.primaryVlan, ...value },
                          }));
                        }}
                        onVlanIdBlur={(value, id) => {
                          if (value === '' && id === 'primary') {
                            // Primary VLAN ID removed
                          }
                        }}
                        footer={
                          <>
                            {!vlanSettingsFormValue.secondaryVlan && (
                              <Button
                                className="mt-[24px] w-full"
                                disabled={
                                  !vlanSettingsFormValue.primaryVlan.vlan_id
                                }
                                onClick={() => {
                                  updateVlanSettings(pre => ({
                                    ...pre,
                                    secondaryVlan: {
                                      vlan_id: '',
                                      ipv4_mode: 'dhcp',
                                      ipv6_mode: 'slaac',
                                      static_ipv4: {
                                        ...DEFAULT_VALUE,
                                      },
                                    },
                                  }));
                                }}
                              >
                                +{' '}
                                {t(
                                  'settings:network.vlan.addSecondary',
                                  'Add Secondary VLAN'
                                )}
                              </Button>
                            )}
                          </>
                        }
                      />
                    </SettingBlock.Bottom>
                  </SettingBlock>

                  {vlanSettingsFormValue.secondaryVlan && (
                    <SettingBlock
                      title={t('settings:network.vlan.secondaryVlan.title')}
                      content={t('settings:network.vlan.secondaryVlan.desc')}
                    >
                      <SettingBlock.Right>
                        <Button
                          variant="primary"
                          size="xs"
                          status="danger"
                          className="shrink-0"
                          onClick={() => {
                            updateVlanSettings(pre => ({
                              ...pre,
                              secondaryVlan: null,
                            }));
                          }}
                        >
                          {t('common:delete', 'Delete')}
                        </Button>
                      </SettingBlock.Right>
                      <SettingBlock.Bottom className="pl-[24px]">
                        {/*  title={t('settings:network.vlan.vlanId.title')}
                          content={t('settings:network.vlan.secondaryVlan.idDesc', 'Secondary VLAN must use a different VLAN ID from the Primary VLAN.')} */}
                        <NetworkConfigSection
                          className="ml-[24px]"
                          title={t('settings:network.vlan.vlanId.title')}
                          description={t(
                            'settings:network.vlan.secondaryVlan.idDesc',
                            'Secondary VLAN must use a different VLAN ID from the Primary VLAN.'
                          )}
                          showVlanId
                          staticIpv4Ref={secondaryStaticIpRef}
                          vlanIdError={secondaryVlanIdError}
                          value={vlanSettingsFormValue.secondaryVlan!}
                          otherVlanId={
                            vlanSettingsFormValue.primaryVlan?.vlan_id
                          }
                          originalIpv4Mode={
                            originalVlanSettings?.secondaryVlan?.ipv4_mode
                          }
                          vlanEnabled={originalVlanSettings?.vlan_enabled}
                          dhcpLease={
                            vlanSettingsFormValue?.secondaryVlan?.dhcp_lease
                          }
                          ipv6Addresses={
                            originalVlanSettings?.secondaryVlan
                              ?.ipv6_addresses as IPv6AddressEntry[]
                          }
                          onChange={(value: NetworkConfigValue) => {
                            updateVlanSettings(pre => ({
                              ...pre,
                              secondaryVlan: {
                                ...(pre.secondaryVlan || {}),
                                ...value,
                              } as VlanConfig,
                            }));
                          }}
                        />
                      </SettingBlock.Bottom>
                    </SettingBlock>
                  )}
                </SettingBlock.Bottom>
              )}
            </SettingBlock>
          )}
          {/*  */}
          {!vlanSettingsFormValue?.vlan_enabled && (
            <NetworkConfigSection
              title={t('settings:network.ipv4Mode.title')}
              value={{
                ipv4_mode: networkSettingsFormValue.ipv4_mode,
                ipv6_mode: networkSettingsFormValue.ipv6_mode,
                static_ipv4: networkSettingsFormValue.static_ipv4 ?? undefined,
              }}
              originalIpv4Mode={originalSettings?.ipv4_mode}
              staticIpv4Ref={networkStaticIpRef}
              onChange={(v: NetworkConfigValue) => {
                setNetworkSettingsFormValue(prev => ({
                  ...(prev ?? defaultNetworkSettings),
                  ipv4_mode: v.ipv4_mode,
                  static_ipv4: v.static_ipv4,
                }));
              }}
              dhcpLease={networkStatus?.dhcp_lease}
              onRenewDhcp={renewDhcpLease}
              ipv6Addresses={
                networkStatus?.ipv6_addresses as IPv6AddressEntry[]
              }
              ipv6LinkLocal={networkStatus?.ipv6_link_local}
            />
          )}
        </>
      )}
      {applyDialogData && (
        <ApplyNetworkSettingsDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          title={applyDialogData.title}
          confirmLoading={
            isLoading('setVlanSettings') || isLoading('setNetworkSettings')
          }
          description={applyDialogData.description}
          groupedChanges={applyDialogData.groupedChanges}
          confirmText={t(
            'settings:network.applyDialog.confirm',
            'Apply changes'
          )}
          cancelText={
            applyDialogData.cancelText ??
            t('settings:network.applyDialog.cancel', 'Cancel')
          }
          changesLabel={t(
            'settings:network.applyDialog.changes',
            'Configuration changes'
          )}
          countdownSeconds={applyDialogData.countdownSeconds}
          countdownCancelText={applyDialogData.countdownCancelText}
          redirectAfterSeconds={applyDialogData.redirectAfterSeconds}
          originalIpAddress={applyDialogData.originalIpAddress}
          newIpAddress={applyDialogData.newIpAddress}
          disableActions={applyDialogData.disableActions || saveLoading}
          onCountdownExpire={applyDialogData.onCountdownExpire}
          onConfirm={applyDialogData.onConfirm}
          onCancel={applyDialogData.onCancel}
        />
      )}
    </SettingPageContainer>
  );
};

export default SettingNetwork;
