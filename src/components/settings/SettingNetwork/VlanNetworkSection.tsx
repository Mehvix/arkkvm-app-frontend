/*
 * @Author: Lei Zhang daisy_zlei@163.com
 * @Date: 2026-06-03 22:12:20
 * @LastEditors: Lei Zhang daisy_zlei@163.com
 * @LastEditTime: 2026-06-17 12:06:21
 * @FilePath: /git-arkkvm-app-frontend/src/components/settings/VlanNetworkSection.tsx
 */
import React from 'react';
import SettingBlock from '../SettingBlock';
import { useTranslation } from 'react-i18next';
import { Input } from '../../ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import InfoCard from './InfoCard';
import { StaticIPv4ConfigComponent, type StaticIPv4ConfigRef } from './StaticIPv4Config';
import type { IPv4Mode, IPv6Mode, DhcpLease, IPv6AddressEntry, StaticIPv4Config } from './types';
import EmptyState from '@/components/EmptyState';

import { IconInfo } from '@/assets/icons';

export interface NetworkConfigValue {
  vlan_id?: number | ''
  ipv4_mode: IPv4Mode
  ipv6_mode: IPv6Mode
  static_ipv4?: StaticIPv4Config
}

function pickIPv6DisplayAddresses(
  addresses: IPv6AddressEntry[],
  linkLocal?: string | null
): { label: string; value: string }[] {
  const result: { label: string; value: string }[] = [];
  const linkLocalAddr =
    linkLocal || addresses.find(a => a.address_type === 'LinkLocal')?.address;
  if (linkLocalAddr) {
    result.push({ label: 'Linklocal', value: linkLocalAddr });
  }
  const globalAddr = addresses.find(a => a.address_type === 'Global')?.address;
  if (globalAddr) {
    result.push({ label: 'Global', value: globalAddr });
  }
  return result;
}

type SelectValueLike = unknown;
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

const INPUT_WIDTH = 'w-[150px]';

interface NetworkConfigSectionProps {
  title: string
  description?: string
  value: NetworkConfigValue
  onChange: (value: NetworkConfigValue) => void
  showVlanId?: boolean
  dhcpLease?: DhcpLease | null
  onRenewDhcp?: () => void
  ipv6Addresses?: IPv6AddressEntry[]
  ipv6LinkLocal?: string | null
  footer?: React.ReactNode
  staticIpv4Ref?: React.Ref<StaticIPv4ConfigRef>
  vlanIdError?: string
  /** Unique identifier for this VLAN section (e.g., 'primary', 'secondary') */
  uniqueId?: string
  /** Other VLAN ID to check for duplicates */
  otherVlanId?: number | '' | null
  /** Callback when VLAN ID input loses focus */
  onVlanIdBlur?: (value: number | '', uniqueId: string) => void
  /** Optional custom title for the IPv4 block (defaults to i18n 'dhcpLease' title) */
  ipv4Title?: React.ReactNode
  /** Optional custom title for the IPv6 block (defaults to i18n 'ipv6Info' title) */
  ipv6Title?: React.ReactNode
  /** Original system ipv4 mode for comparison (if 'static', hide DHCP info until save) */
  originalIpv4Mode?: IPv4Mode | null
  /** Whether VLAN is currently enabled (used to determine IPv6 empty state) */
  vlanEnabled?: boolean
}

export const NetworkConfigSection = ({
  title,
  description,
  value,
  onChange,
  showVlanId = false,
  dhcpLease,
  onRenewDhcp,
  ipv6Addresses,
  ipv6LinkLocal,
  footer,
  staticIpv4Ref,
  vlanIdError,
  uniqueId = 'vlan',
  onVlanIdBlur,
  ipv4Title,
  originalIpv4Mode,
  vlanEnabled,
}: NetworkConfigSectionProps) => {
  const { t } = useTranslation(['settings']);
  const updateValue = (patch: Partial<NetworkConfigValue>) => {
    onChange({ ...value, ...patch });
  };

  const ipv4Block = (
    <SettingBlock
      title={t('settings:network.ipv4Mode.title')}
      content={t('settings:network.ipv4Mode.desc')}
    >
      <SettingBlock.Right>
        <Select
          value={value.ipv4_mode}
           size="xs"
          options={[
            { value: 'dhcp', label: t('settings:network.ipv4Mode.options.dhcp') },
            { value: 'static', label: t('settings:network.ipv4Mode.options.static') },
          ]}

          onChange={v => updateValue({ ipv4_mode: getSelectValue(v) as IPv4Mode })}
        />
      </SettingBlock.Right>
      <SettingBlock.Bottom>
        {value.ipv4_mode === 'dhcp' ? (
          originalIpv4Mode === 'static'||!originalIpv4Mode&&!dhcpLease ? (
             <EmptyState
              className="rounded-[4px]"
                    icon={
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)] ">
                        <IconInfo className="w-5 h-5" />
                      </div>
                    }
                    title={t('settings:network.emptyState.switchToDhcp.title')}
                    description={t('settings:network.emptyState.switchToDhcp.desc')}
                  />
          ) : dhcpLease ? (
            <InfoCard
              title={ipv4Title ?? t('settings:network.dhcpLease.title')}
              items={[
                { label: t('settings:network.dhcpLease.ipAddress'),     value: dhcpLease.ipv4_addresses?.[0] ?? dhcpLease.ip ?? '-' },
                { label: t('settings:network.dhcpLease.gateway'),        value: dhcpLease.routers?.[0] ?? '-' },
                { label: t('settings:network.dhcpLease.subnetMask'),     value: dhcpLease.netmask ?? '-' },
                { label: t('settings:network.dhcpLease.dhcpServer'),     value: dhcpLease.server_id ?? '-' },
                { label: t('settings:network.dhcpLease.dnsServers'),     value: dhcpLease.dns_servers?.join(', ') ?? '-' },
                { label: t('settings:network.dhcpLease.broadcast'),      value: dhcpLease.broadcast ?? '-' },
                { label: t('settings:network.dhcpLease.hostname'),       value: dhcpLease.hostname ?? '-' },
                { label: t('settings:network.dhcpLease.bootNextServer'), value: dhcpLease.bootp_next_server ?? '-' },
              ]}
              action={
                onRenewDhcp && (
                  <Button variant="primary"  size="xs" onClick={onRenewDhcp}>
                    {t('settings:network.dhcpLease.renewButton')}
                  </Button>
                )
              }
            />
          ) : (
             <EmptyState
              className="rounded-[4px]"
                    icon={
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-(--primary-color)/10 text-primary-strong ">
                        <IconInfo className="w-5 h-5" />
                      </div>
                    }
                    title={t('settings:network.emptyState.ipv4Info.title')}
                    description={t('settings:network.emptyState.ipv4Info.desc')}
                  />
          )
        ) : value.ipv4_mode === 'static' ? (
          <StaticIPv4ConfigComponent
            ref={staticIpv4Ref}
            value={value.static_ipv4}
            onChange={v => updateValue({ static_ipv4: v })}
          />
        ) : (
          <EmptyState
          className="rounded-[4px]"
            icon={
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-(--primary-color)/10 text-primary-strong">
                <IconInfo className="w-5 h-5" />
              </div>
            }
            title={t('settings:network.emptyState.switchToDhcp.title')}
            description={t('settings:network.emptyState.switchToDhcp.desc')}
          />
        )}
      </SettingBlock.Bottom>
    </SettingBlock>
  );

  const ipv6Block = (
    <SettingBlock
      title={t('settings:network.ipv6Mode.title')}
      content={t('settings:network.ipv6Mode.desc')}
      paddingBottom={0}
    >
      <SettingBlock.Right>
        <Select
          value={value.ipv6_mode}
          size="xs"
          options={[{ value: 'slaac', label: 'SLAAC' }]}

          onChange={v => updateValue({ ipv6_mode: getSelectValue(v) as IPv6Mode })}
        />
      </SettingBlock.Right>
      <SettingBlock.Bottom >
        {ipv6Addresses && ipv6Addresses.length > 0 ? (
          <InfoCard
            title={t('settings:network.ipv6Info.title')}
            singleColumn={true}
            items={pickIPv6DisplayAddresses(ipv6Addresses, ipv6LinkLocal)}
            action={<></>}
          />
        ) : (
          vlanEnabled||!showVlanId ?
          <EmptyState
          className="rounded-[4px] "
            icon={
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-(--primary-color)/10 text-primary-strong">
                <IconInfo className="w-5 h-5" />
              </div>
            }
            title={t('settings:network.emptyState.ipv6Info.title')}
            description={t('settings:network.emptyState.ipv6Info.desc')}
          />: <EmptyState
              className="rounded-[4px]"
                    icon={
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-(--primary-color)/10 text-primary-strong ">
                        <IconInfo className="w-5 h-5" />
                      </div>
                    }
                    title={t('settings:network.emptyState.ipv6Pending.title')}
                    description={t('settings:network.emptyState.ipv6Pending.desc')}
                  />

        )}
      </SettingBlock.Bottom>
    </SettingBlock>
  );

  // VLAN ID validation removed - handled by parent component
  const vlanIdDisplayError = vlanIdError;

  if (showVlanId) {
    return (
      <SettingBlock title={title} content={description}>
        <SettingBlock.Right>
          <div className="flex flex-col gap-1">
            <Input
              placeholder="VLAN ID"
              size="xs"
              className={`${INPUT_WIDTH} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${vlanIdDisplayError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              value={value.vlan_id ?? ''}
	              onChange={e => {
	                const rawValue = e.target.value;
	                if (rawValue === '') {
	                  updateValue({ vlan_id: '' });
	                  return;
	                }

	                if (!/^\d+$/.test(rawValue)) return;
	                const v = Number(rawValue);
	                if (v < 1 || v > 4094) return;
	                updateValue({ vlan_id: v });
	              }}
              onBlur={() => {
                onVlanIdBlur?.(value.vlan_id ?? '', uniqueId);
              }}
            />
            {vlanIdDisplayError && (
              <p className="text-xs text-red-500">{vlanIdDisplayError}</p>
            )}
          </div>
        </SettingBlock.Right>
        <SettingBlock.Bottom>
          {ipv4Block}
          {ipv6Block}
          {footer}
        </SettingBlock.Bottom>
      </SettingBlock>
    );
  }

  return (
    <>
      {ipv4Block}
      {ipv6Block}
      {footer}
    </>
  );
};
