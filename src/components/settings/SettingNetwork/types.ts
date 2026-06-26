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
  | 'unknown'

export type IPv6AddressType = 'LinkLocal' | 'Global' | string

export interface IPv6AddressEntry {
  address: string
  address_type: IPv6AddressType
  flags: number
  scope: number
}

export interface DhcpLeaseEmptyFlags {
  boot_file: boolean
  bootfile: boolean
  bootsize: boolean
  broadcast: boolean
  cookiesvr: boolean
  dhcptype: boolean
  dns: boolean
  domain: boolean
  hostname: boolean
  ip: boolean
  lease: boolean
  lease_expiry: boolean
  logsvr: boolean
  lprsvr: boolean
  message: boolean
  mtu: boolean
  namesvr: boolean
  ntpsrv: boolean
  rootpath: boolean
  router: boolean
  serverid: boolean
  siaddr: boolean
  sname: boolean
  subnet: boolean
  swapsvr: boolean
  tftp: boolean
  timesvr: boolean
  timezone: boolean
  ttl: boolean
  uptime: boolean
  wins: boolean
}

export interface DhcpLease {
  _cookie_servers: string[] | null
  _log_servers: string[] | null
  _name_servers: string[] | null
  _swap_server: string | null
  _time_servers: string[] | null
  _wins_servers: string[] | null

  bootfile: string | null
  bootp_file: string | null
  bootp_next_server: string | null
  bootp_server_name: string | null
  bootsize: number | null

  broadcast: string | null
  dhcp_type: string | null
  dns_servers: string[] | null
  domain: string | null
  hostname: string | null

  ip: string | null
  netmask: string | null
  routers: string[] | null
  server_id: string | null

  lease: number | null
  lease_expiry: string | null

  lpr_servers: string[] | null
  mtu: number | null
  ntp_servers: string[] | null

  reason: string | null
  root_path: string | null
  tftp: string | null
  timezone: string | null
  ttl: number | null
  uptime: number | null

  is_empty: DhcpLeaseEmptyFlags
}

export interface NetworkStateResponse {
  dhcp_lease: DhcpLease | null

  interface_name: string
  mac_address: string

  ipv4: string | null
  ipv4_addresses: string[]

  ipv6_addresses: IPv6AddressEntry[]
  ipv6_link_local: string | null
}
export interface StaticIPv4Config {
  ipAddress: string
  subnetMask: string
  gateway: string
  dnsServers: string[]
}
export interface VlanConfig  {
  vlan_id: number | ''
  ipv4_mode: IPv4Mode|null
  ipv6_mode?: IPv6Mode
  static_ipv4?: StaticIPv4Config
  dhcp_lease?: DhcpLease | null
}

export interface StaticIPv6Config {
  address: string
  prefixLength: string
  gateway: string
  dnsServers: string[]
}

export interface NetworkSettingsResponse {
  domain: string
  hostname: string

  http_proxy: string | null

  ipv4_mode: IPv4Mode
  ipv6_mode: IPv6Mode

  static_ipv4: StaticIPv4Config | null
  static_ipv6: StaticIPv6Config | null

  lldp_mode: LLDPMode
  lldp_tx_tlvs: string[]

  mdns_mode: mDNSMode

  time_sync_disable_fallback: boolean
  time_sync_mode: TimeSyncMode
  time_sync_ordering: string[]
  time_sync_parallel: number
}

export interface SetNetworkSettings {
  hostname: string|null
  domain: string|null
  http_proxy: string|null
  ipv4_mode: IPv4Mode
  static_ipv4?: StaticIPv4Config| null
  static_ipv6?: StaticIPv6Config | null
  ipv6_mode: IPv6Mode
  lldp_mode: LLDPMode
  lldp_tx_tlvs: string[]
  mdns_mode: mDNSMode
  time_sync_mode: TimeSyncMode
}
export interface NetworkStatus extends Partial<SetNetworkSettings> {
  mac_address: string
  dhcp_lease?: DhcpLease | null
  ipv6_addresses: IPv6AddressEntry[]
  ipv6_link_local: string | null
}

export interface VlanSettingsMode {
vlan_enabled:boolean
primaryVlan:VlanConfig
secondaryVlan?:VlanConfig|null
}
