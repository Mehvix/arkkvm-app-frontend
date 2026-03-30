import { useJsonRpc } from '@/hooks/useJsonRpc'
import { useRestartDialog } from '@/hooks/useRestartDialog'
import {
  useActiveDeviceSettings,
  useSettingsActions,
} from '@/stores/devicesStore'
import { createLogger } from '@/utils/logger'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useConfirmDialog } from '../ui/confirm-dialog'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import InfoCard from './InfoCard'
import SettingBlock from './SettingBlock'
import SettingPageContainer from './SettingPageContainer'

// Enable relative time plugin
dayjs.extend(relativeTime)

const logger = createLogger('SettingNetwork')
export type IPv6Mode =
  | 'disabled'
  | 'slaac'
  | 'dhcpv6'
  | 'slaac_and_dhcpv6'
  | 'static'
  | 'link_local'
  | 'unknown'
export type IPv4Mode = 'disabled' | 'static' | 'dhcp' | 'unknown'
export type LLDPMode = 'disabled' | 'basic' | 'all' | 'unknown'
export type mDNSMode =
  | 'disabled'
  | 'auto'
  | 'ipv4_only'
  | 'ipv6_only'
  | 'unknown'
export type TimeSyncMode =
  | 'ntp_only'
  | 'ntp_and_http'
  | 'http_only'
  | 'custom'
  | 'unknown'

export interface SetNetworkSettings {
  hostname: string
  domain: string
  http_proxy: string
  ipv4_mode: IPv4Mode
  ipv6_mode: IPv6Mode
  lldp_mode: LLDPMode
  lldp_tx_tlvs: string[]
  mdns_mode: mDNSMode
  time_sync_mode: TimeSyncMode
}

const defaultNetworkSettings: SetNetworkSettings = {
  hostname: '',
  http_proxy: '',
  domain: '',
  ipv4_mode: 'unknown',
  ipv6_mode: 'unknown',
  lldp_mode: 'unknown',
  lldp_tx_tlvs: [],
  mdns_mode: 'unknown',
  time_sync_mode: 'unknown',
}

type SelectValueLike = unknown

interface IPv6AddressEntry {
  address: string
  address_type: 'UniqueLocal' | 'Global' | 'LinkLocal' | 'SiteLocal' | string
  is_stable: boolean
  state: 'Preferred' | 'Deprecated' | string
  preferred_lifetime: string
  valid_lifetime: string
}

const addrPriority = (a: IPv6AddressEntry): number =>
  (a.state === 'Preferred' ? 2 : 0) + (a.is_stable ? 1 : 0)

const pickBest = (
  addrs: IPv6AddressEntry[],
  allowDeprecated = true
): IPv6AddressEntry | undefined => {
  const candidates = allowDeprecated
    ? addrs
    : addrs.filter(a => a.state === 'Preferred')
  if (candidates.length === 0) return undefined
  return candidates.reduce((best, cur) =>
    addrPriority(cur) > addrPriority(best) ? cur : best
  )
}

function expandIPv6Address(address: string): string {
  if (!address) return address

  let input = address.trim().split('%')[0]

  if (input.startsWith('::')) {
    input = '0' + input
  }

  if (input.endsWith('::')) {
    input = input + '0'
  }

  let groups: string[]

  const doubleColonIdx = input.indexOf('::')
  if (doubleColonIdx !== -1) {
    const before = input.slice(0, doubleColonIdx).split(':').filter(Boolean)
    const after = input
      .slice(doubleColonIdx + 2)
      .split(':')
      .filter(Boolean)
    const missing = 8 - before.length - after.length
    const zeros = Array(missing).fill('0')
    groups = [...before, ...zeros, ...after]
  } else {
    groups = input.split(':')
  }

  return groups
    .slice(0, 8)
    .map(g => g.padStart(4, '0'))
    .join(':')
}

function pickIPv6DisplayAddresses(
  addresses: IPv6AddressEntry[],
  linkLocal?: string
): { label: string; value: string }[] {
  const result: { label: string; value: string }[] = []

  const linkLocalAddr =
    linkLocal || addresses.find(a => a.address_type === 'LinkLocal')?.address
  if (linkLocalAddr) {
    result.push({ label: 'Linklocal', value: expandIPv6Address(linkLocalAddr) })
  }

  const ulaAddrs = addresses.filter(a => a.address_type === 'UniqueLocal')
  const ula = pickBest(ulaAddrs, true)
  if (ula) {
    result.push({ label: 'ULA', value: expandIPv6Address(ula.address) })
  }

  const globalAddrs = addresses.filter(a => a.address_type === 'Global')
  const global = pickBest(globalAddrs, false)
  if (global) {
    result.push({ label: 'Global', value: expandIPv6Address(global.address) })
  }

  return result
}
const getSelectValue = (v: SelectValueLike): string => {
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v !== null && 'target' in v) {
    const target = (v as { target?: unknown }).target
    if (typeof target === 'object' && target !== null && 'value' in target) {
      const value = (target as { value?: unknown }).value
      if (typeof value === 'string') return value
    }
  }
  return ''
}

const toNetworkSettings = (
  partial: Partial<SetNetworkSettings> | null
): SetNetworkSettings => ({
  ...defaultNetworkSettings,
  ...Object.fromEntries(
    Object.entries(partial ?? {}).filter(([, v]) => v != null)
  ),
})
function RelativeTime({ lifetime }: { lifetime: string }) {
  const [remaining, setRemaining] = useState<string | null>(null)

  useEffect(() => {
    if (lifetime === '') {
      setRemaining(null)
      return
    }

    setRemaining(dayjs(lifetime).fromNow())

    const interval = setInterval(() => {
      setRemaining(dayjs(lifetime).fromNow())
    }, 1000 * 30)
    return () => clearInterval(interval)
  }, [lifetime])

  if (lifetime === '') {
    return 'N/A'
  }

  return `${remaining || ''} (${dayjs(lifetime).format('YYYY-MM-DD HH:mm')})`
}
export default function SettingNetwork() {
  const { t } = useTranslation(['settings'])
  const [send, isChannelReady, sendAsync] = useJsonRpc()
  const network = useActiveDeviceSettings(s => s.network)
  const [newNetwork, setNewNetwork] = useState(defaultNetworkSettings)
  const { setNestedDeviceSetting } = useSettingsActions()
  const [selectedDomain, setSelectedDomain] = useState(network?.domain || '')
  const [customDomain, setCustomDomain] = useState(network?.domain || '')
  const ranRef = useRef(false)

  const [originalSettings, setOriginalSettings] =
    useState<SetNetworkSettings | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const { confirm } = useConfirmDialog()
  const { showRestartDialog } = useRestartDialog()
  const INPUT_WIDTH = 'w-[150px]'
  // Basic input sanitization: restrict to ASCII and allow only a safe character set
  const sanitizeHostname = (v: string) =>
    v.replace(/[^a-zA-Z0-9.-]/g, '').slice(0, 253)
  // Allow http/https prefix, domain/IP, port and common separators (no spaces)
  const sanitizeHttpProxy = (v: string) => v.replace(/[^a-zA-Z0-9.:\/_-]/g, '')

  // Detect whether settings have changed
  const checkForChanges = useCallback(() => {
    if (!originalSettings) return false

    // Resolve current domain value
    let currentDomain = ''
    if (selectedDomain === 'custom') {
      currentDomain = customDomain
    } else if (selectedDomain === 'local') {
      currentDomain = 'local'
    } else if (selectedDomain === 'dhcp') {
      currentDomain = ''
    } else {
      currentDomain = newNetwork?.domain || ''
    }

    // Compare fields
    const hasHostnameChanged =
      (newNetwork?.hostname || '') !== (originalSettings?.hostname || '')
    const hasHttpProxyChanged =
      (newNetwork?.http_proxy || '') !== (originalSettings?.http_proxy || '')
    const hasDomainChanged = currentDomain !== (originalSettings?.domain || '')
    const hasIpv4ModeChanged =
      (newNetwork?.ipv4_mode || 'dhcp') !==
      (originalSettings?.ipv4_mode || 'dhcp')
    const hasIpv6ModeChanged =
      (newNetwork?.ipv6_mode || 'slaac') !==
      (originalSettings?.ipv6_mode || 'slaac')
    const hasLldpModeChanged =
      (newNetwork?.lldp_mode || 'basic') !==
      (originalSettings?.lldp_mode || 'basic')
    const hasMdnsModeChanged =
      (newNetwork?.mdns_mode || 'ipv6_only') !==
      (originalSettings?.mdns_mode || 'ipv6_only')
    const hasTimeSyncModeChanged =
      (newNetwork?.time_sync_mode || 'ntp_only') !==
      (originalSettings?.time_sync_mode || 'ntp_only')

    return (
      hasHostnameChanged ||
      hasHttpProxyChanged ||
      hasDomainChanged ||
      hasIpv4ModeChanged ||
      hasIpv6ModeChanged ||
      hasLldpModeChanged ||
      hasMdnsModeChanged ||
      hasTimeSyncModeChanged
    )
  }, [originalSettings, newNetwork, selectedDomain, customDomain])

  // Track changes
  useEffect(() => {
    const changes = checkForChanges()
    setHasChanges(changes)
  }, [checkForChanges])

  const domainOptions = [
    { value: '', label: 'None' },
    { value: 'example.com', label: 'example.com' },
    { value: 'example.org', label: 'example.org' },
    { value: 'example.net', label: 'example.net' },
  ]
  useEffect(() => {
    if (!network?.domain) {
      setSelectedDomain('dhcp')
    } else if (['dhcp', 'local'].includes(network?.domain)) {
      setSelectedDomain(network?.domain || '')
    } else {
      setSelectedDomain('custom')
    }
  }, [network?.domain])

  // Sync store network to local editable copy
  useEffect(() => {
    if (network && Object.keys(network).length > 0) {
      setNewNetwork(toNetworkSettings(network))
    }
  }, [network])
  // Define request functions before useEffect dependencies to avoid TDZ issues
  const getNetworkState =
    useCallback(async (): Promise<Partial<SetNetworkSettings> | null> => {
      const resp = await sendAsync({
        method: 'getNetworkState',
      })
      if (!('error' in resp)) {
        const networkState = resp.result
        return (networkState as Partial<SetNetworkSettings>) ?? null
      }
      return null
    }, [sendAsync])

  const getNetworkSettings =
    useCallback(async (): Promise<Partial<SetNetworkSettings> | null> => {
      const resp = await sendAsync({
        method: 'getNetworkSettings',
        params: {},
      })
      if (!('error' in resp)) {
        const networkSettings = resp.result
        return (networkSettings as Partial<SetNetworkSettings>) ?? null
      }
      return null
    }, [sendAsync])

  useEffect(() => {
    if (!isChannelReady) return
    let isCancelled = false
    void (async () => {
      try {
        const [state, settings] = await Promise.all([
          getNetworkState(),
          getNetworkSettings(),
        ])
        if (isCancelled) return

        // Merge once to avoid multiple renders; base on existing network and override with state/settings
        if (state || settings) {
          const mergedSettings = toNetworkSettings({ ...state, ...settings })

          // Update local editable state first
          setNewNetwork(mergedSettings)

          // Then update store to keep data consistent
          setNestedDeviceSetting(prev => {
            const updatedNetwork = { ...prev.network, ...mergedSettings }

            const newSettings = {
              ...prev,
              network: updatedNetwork,
            }
            return newSettings
          })

          // Persist initial settings for change detection
          if (!originalSettings) {
            setOriginalSettings(mergedSettings)
            if (!mergedSettings.domain) {
              setSelectedDomain('dhcp')
            } else if (['dhcp', 'local'].includes(mergedSettings.domain)) {
              setSelectedDomain(mergedSettings.domain)
            } else {
              setCustomDomain(mergedSettings.domain)
              setSelectedDomain('custom')
            }
          }
        }
      } catch (e) {
        if (isCancelled) return
        logger.error('Failed to load network settings', e)
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [isChannelReady, getNetworkState, getNetworkSettings]) // Depends on request function references
  const saveNetworkSettings = useCallback(async () => {
    if (saveLoading) return // Prevent duplicate clicks

    setSaveLoading(true)

    try {
      // Build request params according to API contract
      // Resolve final domain value based on the selected mode
      let finalDomain = ''
      if (selectedDomain === 'custom') {
        finalDomain = customDomain
      } else if (selectedDomain === 'local') {
        finalDomain = 'local'
      } else if (selectedDomain === 'dhcp') {
        finalDomain = '' // DHCP-provided domain is empty
      } else {
        finalDomain = newNetwork?.domain || ''
      }

      const settings = {
        hostname: newNetwork?.hostname || 'arkkvm.local',
        http_proxy: newNetwork?.http_proxy || '',
        domain: finalDomain,
        ipv4_mode: newNetwork?.ipv4_mode || 'dhcp',
        ipv6_mode: newNetwork?.ipv6_mode || 'slaac',
        lldp_mode: newNetwork?.lldp_mode || 'basic',
        lldp_tx_tlvs: newNetwork?.lldp_tx_tlvs || [
          'chassis',
          'port',
          'system',
          'vlan',
        ],
        mdns_mode: newNetwork?.mdns_mode || 'ipv6_only',
        time_sync_mode: newNetwork?.time_sync_mode || 'ntp_only',
        time_sync_ordering: ['ntp', 'http'],
        time_sync_disable_fallback: false,
        time_sync_parallel: 4,
      }

      send({
        method: 'setNetworkSettings',
        params: { settings },
        onResponse: resp => {
          setSaveLoading(false)
          if (!('error' in resp)) {
            logger.info('Network settings saved', resp.result)
            toast.success(`Network settings saved successfully`)
            // Update original settings and reset change state
            setOriginalSettings(settings)
            setHasChanges(false)
            showRestartDialog()
          } else {
            logger.warn('Failed to save network settings', resp.error)
            toast.error(
              `Failed to save network settings: ${resp.error.message || 'Unknown error'}`
            )
          }
        },
      })
    } catch (error) {
      setSaveLoading(false)
      logger.error('Failed to save network settings', error)
      toast.error(
        `Failed to save network settings: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }, [newNetwork, send, selectedDomain, customDomain, saveLoading])

  // Renew DHCP lease
  const renewDhcpLease = useCallback(async () => {
    const confirmed = await confirm({
      title: t('settings:network.dhcpLease.renewTitle'),
      content: t('settings:network.dhcpLease.renewContent'),
      confirmText: t('settings:network.dhcpLease.renewConfirm'),
      cancelText: 'Cancel',

      onConfirm: async () => {
        try {
          const resp = await sendAsync({
            method: 'renewDHCPLease',
            params: {},
          })

          if (!('error' in resp)) {
            toast.success('DHCP lease renewed successfully')
          } else {
            toast.error(
              `Failed to renew DHCP lease: ${resp.error.message || 'Unknown error'}`
            )
          }
        } catch (error) {
          toast.error(
            `Failed to renew DHCP lease: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      },
    })
  }, [confirm, sendAsync])

  return (
    <SettingPageContainer
      title={t('settings:pages.network.title')}
      description={t('settings:pages.network.description')}
    >
      <div className="max-w-[840px]" ref={ranRef}>
        <SettingBlock
          title={t('settings:network.macAddress.title')}
          content={t('settings:network.macAddress.desc')}
        >
          <SettingBlock.Right>
            <Input
              value={network?.mac_address ?? ''}
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
              value={newNetwork?.hostname ?? ''}
              onChange={e =>
                setNewNetwork({
                  ...newNetwork,
                  hostname: sanitizeHostname(e.target.value),
                })
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
              value={newNetwork.http_proxy || ''}
              onChange={e =>
                setNewNetwork(prev => ({
                  ...prev,
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
              onChange={(v: unknown) => {
                const newValue = getSelectValue(v)
                setSelectedDomain(newValue)
                // Clear customDomain when switching to custom
                if (newValue === 'custom') {
                  setCustomDomain('')
                }
              }}
              options={[
                { value: 'dhcp', label: 'DHCP provided' },
                { value: 'local', label: 'None' },
                { value: 'custom', label: 'Custom' },
              ]}
              size="xs"
            />
          </SettingBlock.Right>
          {selectedDomain === 'custom' && (
            <SettingBlock.Bottom>
              <Input
                label="Custom Domain"
                size="xs"
                labelClassName="text-[12px]"
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value)}
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
              value={newNetwork.mdns_mode}
              onChange={(v: unknown) =>
                setNewNetwork({
                  ...newNetwork,
                  mdns_mode: getSelectValue(v) as mDNSMode,
                })
              }
              options={[
                { value: 'disabled', label: 'Disabled' },
                { value: 'auto', label: 'Auto' },
                { value: 'ipv4_only', label: 'IPv4 only' },
                { value: 'ipv6_only', label: 'IPv6 only' },
              ]}
              size="xs"
            />
          </SettingBlock.Right>
        </SettingBlock>

        <SettingBlock
          title={t('settings:network.timeSynchronization.title')}
          content={t('settings:network.timeSynchronization.desc')}
        >
          <SettingBlock.Right>
            <Select
              value={newNetwork.time_sync_mode}
              onChange={(v: unknown) =>
                setNewNetwork({
                  ...newNetwork,
                  time_sync_mode: getSelectValue(v) as TimeSyncMode,
                })
              }
              options={[
                { value: 'ntp_only', label: 'NTP only' },
                { value: 'ntp_and_http', label: 'HTTP + NTP' },
                { value: 'http_only', label: 'HTTP only' },
              ]}
              size="xs"
            />
          </SettingBlock.Right>
          <SettingBlock.Bottom>
            <div className="flex justify-end">
              <Button
                size="xs"
                variant="primary"
                onClick={saveNetworkSettings}
                disabled={!hasChanges || saveLoading}
              >
                {saveLoading
                  ? t('settings:network.savingButton')
                  : t('settings:network.saveButton')}
              </Button>
            </div>
          </SettingBlock.Bottom>
        </SettingBlock>

        <SettingBlock
          title={t('settings:network.ipv4Mode.title')}
          content={t('settings:network.ipv4Mode.desc')}
        >
          <SettingBlock.Right>
            <Select
              value={network.ipv4_mode}
              readOnly
              options={[{ value: 'dhcp', label: 'DHCP' }]}
              size="xs"
            />
          </SettingBlock.Right>
          <SettingBlock.Bottom>
            <InfoCard
              title={t('settings:network.dhcpLease.title')}
              items={
                network?.dhcp_lease
                  ? [
                      {
                        label: t('settings:network.dhcpLease.ipAddress'),
                        value: network?.dhcp_lease?.ip ?? '-',
                      },
                      {
                        label: t('settings:network.dhcpLease.gateway'),
                        value: network?.dhcp_lease?.routers?.[0] ?? '-',
                      },
                      {
                        label: t('settings:network.dhcpLease.subnetMask'),
                        value: network?.dhcp_lease?.netmask ?? '-',
                      },
                      {
                        label: t('settings:network.dhcpLease.dhcpServer'),
                        value: network?.dhcp_lease?.server_id ?? '-',
                      },
                      {
                        label: t('settings:network.dhcpLease.broadcast'),
                        value: network?.dhcp_lease?.broadcast ?? '-',
                      },
                      {
                        label: t('settings:network.dhcpLease.bootNextServer'),
                        value: network?.dhcp_lease?.bootp_next_server ?? '-',
                      },
                      {
                        label: t('settings:network.dhcpLease.hostname'),
                        value: network?.dhcp_lease?.hostname ?? '-',
                      },
                    ]
                  : []
              }
              action={
                <Button
                  size="xs"
                  className="text-[var(--btn-outline-border-danger)]"
                  onClick={renewDhcpLease}
                >
                  {t('settings:network.dhcpLease.renewButton')}
                </Button>
              }
            />
          </SettingBlock.Bottom>
        </SettingBlock>

        <SettingBlock
          title={t('settings:network.ipv6Mode.title')}
          content={t('settings:network.ipv6Mode.desc')}
        >
          <SettingBlock.Right>
            <Select
              value={network.ipv6_mode}
              readOnly
              options={[{ value: 'slaac', label: 'SLAAC' }]}
              size="xs"
            />
          </SettingBlock.Right>
          <SettingBlock.Bottom>
            <>
              {network?.ipv6_addresses ? (
                <InfoCard
                  title={t('settings:network.ipv6Info.title')}
                  singleColumn={true}
                  items={pickIPv6DisplayAddresses(
                    network.ipv6_addresses as IPv6AddressEntry[],
                    network.ipv6_link_local
                  )}
                  action={<></>}
                />
              ) : (
                <Card className=" text-center w-full py-[20px]">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      IPv6 Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="">No IPv6 addresses configured</p>
                  </CardContent>
                </Card>
              )}
            </>
          </SettingBlock.Bottom>
        </SettingBlock>
      </div>
    </SettingPageContainer>
  )
}
