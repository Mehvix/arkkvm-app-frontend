export type VlanIPv4Mode = 'disabled' | 'static' | 'dhcp' | 'unknown'

export type VlanIPv6Mode =
  | 'disabled'
  | 'slaac'
  | 'dhcpv6'
  | 'slaac_and_dhcpv6'
  | 'static'
  | 'link_local'
  | 'unknown'

export interface VlanStaticIPv4Config {
  ipAddress: string
  subnetMask: string
  gateway: string
  dnsServers: string[]
}

export type VlanIPv6AddressType = 'LinkLocal' | 'Global' | string

export interface VlanIPv6AddressEntry {
  address: string
  address_type: VlanIPv6AddressType
  flags: number
  scope: number
}

export interface VlanDhcpLease {
  ip?: string | null
  ipv4_addresses?: string[] | null
  routers?: string[] | null
  netmask?: string | null
  server_id?: string | null
  dns_servers?: string[] | null
  broadcast?: string | null
  hostname?: string | null
  bootp_next_server?: string | null
}

export interface VlanConfigResponse {
  vlan_id: number
  interface_name?: string
  ipv4?: string | null
  ipv4_addresses?: string[]
  ipv4_mode: VlanIPv4Mode
  ipv6_addresses?: VlanIPv6AddressEntry[]
  ipv6_link_local?: string | null
  ipv6_mode?: VlanIPv6Mode
  static_ipv4?: VlanStaticIPv4Config
  dhcp_lease?: VlanDhcpLease | null
}

export interface VlanSettings {
  vlan_enabled: boolean
  primaryVlan: VlanConfigResponse
  secondaryVlan?: VlanConfigResponse | null
  confirm_seconds_remaining?: number
}

export interface GetVlanSettingsResponse {
  settings: VlanSettings
  pending_settings?: VlanSettings
  confirm_seconds_remaining?: number
  redirect?: Record<string, unknown>
}
