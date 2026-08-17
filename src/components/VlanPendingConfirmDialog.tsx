import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ApplyNetworkSettingsDialog,
  type ChangeGroup,
} from './settings/SettingNetwork/ApplyNetworkSettingsDialog';
import { buildChangeList } from './settings/SettingNetwork/utils';
import { useJsonRpc } from '@/hooks/useJsonRpc';
import { DEFAULT_VLAN_CONFIG } from './settings/SettingNetwork';
import { env, redirectToIp } from '@/utils';
import { ipRegex } from '@/utils/regex';

const hostnameRegex =
  /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

const normalizeHost = (value: unknown) =>
  typeof value === 'string'
    ? value
        .trim()
        .replace(/^\[|\]$/g, '')
        .toLowerCase()
    : '';

const isSafeRedirectHost = (value: string) =>
  ipRegex.ipv4.test(value) || ipRegex.ipv6.test(value) || hostnameRegex.test(value);

const getPrimaryVlanIpv4 = (primaryVlan: unknown) => {
  if (!primaryVlan || typeof primaryVlan !== 'object') return '';

  const vlan = primaryVlan as {
    ipv4?: unknown;
    ipv4_mode?: unknown;
    static_ipv4?: {
      ipAddress?: unknown;
    };
    dhcp_lease?: {
      ip?: unknown;
    };
  };

  if (vlan.ipv4_mode === 'static') {
    return normalizeHost(vlan.static_ipv4?.ipAddress || vlan.ipv4);
  }

  return normalizeHost(vlan.ipv4 || vlan?.dhcp_lease?.ip || vlan.static_ipv4?.ipAddress);
};

export function VlanPendingConfirmDialog() {
  const { t } = useTranslation();
  const [, isChannelReady, sendAsync] = useJsonRpc();
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [actionsDisabled, setActionsDisabled] = useState(false);
  const [groups, setGroups] = useState<ChangeGroup[]>([]);
  const [currentPrimaryIpv4, setCurrentPrimaryIpv4] = useState('');
  const redirectToCurrentPrimary = async () => {
    if (env.target === 'cloud') {
      window.location.reload();
      return;
    }
    if (currentPrimaryIpv4 && isSafeRedirectHost(currentPrimaryIpv4)) {
      await redirectToIp(currentPrimaryIpv4);
    }
  };
  useEffect(() => {
    if (!isChannelReady) return;

    let cancelled = false;
    let openTimer: ReturnType<typeof window.setTimeout> | undefined;

    (async () => {
      const resp = await sendAsync<'getVlanSettings'>(
        { method: 'getVlanSettings' },
        { resultOnly: true, showUnhandledErrorToast: false }
      );
      if (cancelled) return;
      const builtGroups: ChangeGroup[] = [];
      const pending = resp?.pending_settings;
      const current = resp?.settings;

      if (!pending) {
        setOpen(false);
        return;
      }
      const currentHost = normalizeHost(window.location.hostname);
      const pendingPrimaryIpv4 = getPrimaryVlanIpv4(pending.primaryVlan);
      const pendingSecondaryIpv4 = getPrimaryVlanIpv4(pending.secondaryVlan);
      const previousPrimaryIpv4 = getPrimaryVlanIpv4(current?.primaryVlan);

      if (
        (!currentHost || ![pendingPrimaryIpv4, pendingSecondaryIpv4].includes(currentHost)) &&
        pending.vlan_enabled &&
        env.target !== 'cloud'
      )
        return;

      const confirmWithin = pending?.confirm_seconds_remaining;
      const canConfirm = typeof confirmWithin === 'number' && confirmWithin > 0;
      const { vlan_enabled, primaryVlan, secondaryVlan } = pending;
      const {
        vlan_enabled: oldVlanEnabled,
        primaryVlan: oldPrimaryVlan,
        secondaryVlan: oldSecondaryVlan,
      } = current ?? {};

      const networkGroup = [];
      if (vlan_enabled !== oldVlanEnabled) {
        networkGroup.push({
          key: 'vlan_enabled',
          label: 'VLAN',
          from: oldVlanEnabled ? 'Enabled' : 'Disabled',
          to: vlan_enabled ? 'Enabled' : 'Disabled',
        });
      } else if (vlan_enabled && oldVlanEnabled) {
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
          const primaryFrom = oldPrimaryVlan?.vlan_id ? `${oldPrimaryVlan.vlan_id || '.'}` : ' ';
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
          const secondaryFrom = oldSecondaryVlan?.vlan_id
            ? `${oldSecondaryVlan?.vlan_id || '.'}`
            : ' ';
          networkGroup.push({
            key: 'secondary _vlan_delete',
            label: 'Secondary VLAN  ',
            from: secondaryFrom,
            to: 'Deleted',
          });
        }
      }

      if (networkGroup.length) {
        builtGroups.push({
          title: t('settings:network.applyDialog.networkGroup', 'Network'),
          fields: networkGroup,
        });
      }

      let primaryFields = null;
      let secondaryFields = null;
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
        const primaryVlanKeys = primaryVlan?.ipv4_mode === 'static' ? keys1 : keys2;
        const secondaryVlanKeys = secondaryVlan?.ipv4_mode === 'static' ? keys1 : keys2;

        if (primaryVlan?.vlan_id) {
          primaryFields = buildChangeList(
            oldPrimaryVlan || DEFAULT_VLAN_CONFIG,
            primaryVlan,
            primaryVlanKeys,
            changeListOptions
          );
        }

        if (secondaryVlan && primaryVlan?.vlan_id && secondaryVlan.vlan_id) {
          secondaryFields = buildChangeList(
            oldSecondaryVlan || DEFAULT_VLAN_CONFIG,
            secondaryVlan,
            secondaryVlanKeys,
            changeListOptions
          );
        }

        if (secondaryVlan?.vlan_id && !primaryVlan?.vlan_id) {
          primaryFields = buildChangeList(
            oldPrimaryVlan || DEFAULT_VLAN_CONFIG,
            secondaryVlan,
            primaryVlanKeys,
            changeListOptions
          );
        }
      }

      if (primaryFields?.length)
        builtGroups.push({
          title: t('settings:network.vlan.primaryVlan.title', 'Primary VLAN'),
          fields: primaryFields,
        });
      if (secondaryFields?.length)
        builtGroups.push({
          title: t('settings:network.vlan.secondaryVlan.title', 'Secondary VLAN'),
          fields: secondaryFields,
        });

      setGroups(builtGroups);
      setCountdown(confirmWithin ?? 0);
      setActionsDisabled(!canConfirm);
      setCurrentPrimaryIpv4(previousPrimaryIpv4);

      const openWhenNoOtherDialog = () => {
        if (cancelled) return;

        const hasOpenDialog = document.querySelector(
          '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'
        );
        if (hasOpenDialog) {
          openTimer = window.setTimeout(openWhenNoOtherDialog, 100);
          return;
        }

        setOpen(true);
      };

      openWhenNoOtherDialog();
    })();

    return () => {
      cancelled = true;
      if (openTimer !== undefined) {
        window.clearTimeout(openTimer);
      }
    };
  }, [isChannelReady, sendAsync, t]);

  if (!open) return null;

  return (
    <ApplyNetworkSettingsDialog
      open={open}
      onOpenChange={setOpen}
      title={t('settings:network.applyDialog.title', 'Apply network settings')}
      description={
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
      }
      groupedChanges={groups}
      countdownSeconds={countdown}
      countdownCancelText={r => `Revert (${r}s)`}
      confirmText={t('settings:network.applyDialog.keepChanges', 'Keep changes')}
      disableConfirmAction={actionsDisabled}
      onConfirm={async () => {
        if (actionsDisabled) return;
        const { success } = await sendAsync(
          { method: 'confirmVlanSettings' },
          { showUnhandledErrorToast: true }
        );
        if (success) {
          toast.success(t('settings:network.applyDialog.confirmed', 'VLAN settings confirmed'));
          setOpen(false);
        }
      }}
      onCancel={async () => {
        const { success } = await sendAsync({ method: 'revertVlanSettings' });
        if (success) {
          toast.info(t('settings:network.applyDialog.reverted', 'VLAN settings reverted'));
          setOpen(false);
          await redirectToCurrentPrimary();
        }
      }}
      onCountdownExpire={async () => {
        setActionsDisabled(true);
        await sendAsync({ method: 'revertVlanSettings' });
        toast.warning(
          t('settings:network.applyDialog.revertedTimeout', 'Configuration reverted automatically.')
        );
        setOpen(false);
        await redirectToCurrentPrimary();
      }}
    />
  );
}
