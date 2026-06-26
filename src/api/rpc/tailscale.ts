/**
 * @Author: zhanglei
 * @Date: 2026-06-11 14:17:55
 * LastEditors: Please set LastEditors
 * LastEditTime: 2026-06-11 19:34:24
 */
export type TailscaleConnectionState =
  | 'connected'
  | 'loggedOut'
  | 'offline'
  | 'connecting'
  | 'unknown'
  | string

export type TailscalePeerState =
  | 'connected'
  | 'offline'
  | 'unknown'
  | string

export interface TailscalePeer {
  ID: string
  PublicKey: string
  HostName: string
  DNSName: string
  OS: string
  State?: TailscalePeerState
  Online?: boolean
  Relay?: string
  TailscaleIPs: string[]
  AllowedIPs: string[]
  Addrs?: string[] | null
  CurAddr?: string
  RxBytes?: number
  TxBytes?: number
  Created?: string
  LastWrite?: string
  LastSeen?: string
  LastHandshake?: string
  ExitNode?: boolean
  ExitNodeOption?: boolean
  Active?: boolean
  PeerAPIURL?: string[]
  InNetworkMap?: boolean
  InMagicSock?: boolean
  InEngine?: boolean
  KeyExpiry?: string
  Capabilities?: string[]
  CapMap?: Record<string, unknown> | null
  UserID?: number
  NoFileSharingReason?: string
  TaildropTarget?: number
  // Legacy fields for compatibility
  ip?: string
  hostname?: string
  dnsName?: string | null
  tailnet?: string | null
  os?: string | null
  state?: TailscalePeerState
  isSelf?: boolean
}

export interface TailscaleCurrentTailnet {
  Name: string
  MagicDNSSuffix: string
  MagicDNSEnabled: boolean
}

export interface TailscaleUser {
  ID: number
  LoginName: string
  DisplayName: string
  ProfilePicURL?: string
}

export interface TailscaleStatus {
  Raw: string
  Version: string
  TUN: boolean
  BackendState: 'Running' | 'NeedsLogin' | 'Stopped' | string
  HaveNodeKey: boolean
  AuthURL: string
  TailscaleIPs: string[]
  connectionState: TailscaleConnectionState
  Health: string[]
  MagicDNSSuffix: string | null
  CurrentTailnet: TailscaleCurrentTailnet | null
  Self: TailscalePeer | null
  Peer: Record<string, TailscalePeer> | null
  User: Record<string, TailscaleUser> | null
  CertDomains: string[] | null
  ClientVersion: string | null
  // Legacy camelCase fields for compatibility
  backendState?: string
  selfPeer?: TailscalePeer | null
}

export interface TailscaleStateResponse {
  connectionState: TailscaleConnectionState
  enabled: boolean
  loginServer: string | null
  status: TailscaleStatus | null
}

export interface SwitchTailscaleParams {
  enabled: boolean
  loginServer?: string | null
}

export type RegisterTailscaleStatus =
  | 'completed'
  | 'needsAuth'
  | 'disabled'
  | 'failed'

export interface RegisterTailscaleResponse {
  status: RegisterTailscaleStatus
  code: number
  stdout: string
  stderr: string
  authUrl: string | null
  auth_url:string | null
}

/**
 * Safely retrieves the Tailscale connection state.
 * Prefers PascalCase connectionState; falls back to legacy camelCase fields.
 * @param state - TailscaleStateResponse object
 * @returns TailscaleConnectionState
 */
export function getConnectionState(
  state: TailscaleStateResponse | null | undefined
): TailscaleConnectionState {
  if (!state) return 'unknown';

  // Prefer PascalCase field
  if (state.connectionState) {
    return state.connectionState;
  }

  // Get from status object
  const status = state.status;
  if (!status) return 'unknown';

  // Try legacy camelCase fields
  // 1. Prefer selfPeer.state (camelCase)
  const selfPeerState =status?.connectionState|| status.selfPeer?.state;
  if (selfPeerState) {
    return selfPeerState as TailscaleConnectionState;
  }

  // 2. Use Self.State (PascalCase)
  const selfState = status.Self?.State;
  if (selfState) {
    return selfState as TailscaleConnectionState;
  }

  // 3. Infer from backendState
  const backendState = status.backendState || status.BackendState;
  if (backendState === 'Running') {
    // Running state requires further check
    return status.HaveNodeKey ? 'connected' : 'loggedOut';
  }
  if (backendState === 'NeedsLogin') {
    return 'loggedOut';
  }
  if (backendState === 'Stopped') {
    return 'offline';
  }

  return 'unknown';
}

/**
 * Safely retrieves the Tailscale IP (IPv4 preferred).
 * Supports both camelCase and PascalCase field naming.
 * @param status - TailscaleStatus object
 * @returns IPv4 address or empty string
 */
export function getTailscaleIP(status: TailscaleStatus | null | undefined): string {
  if (!status) return '';

  // 1. Prefer PascalCase field Self.TailscaleIPs
  const pascalIPs = status.Self?.TailscaleIPs;
  if (pascalIPs && pascalIPs.length > 0) {
    const ipv4 = pascalIPs.find(ip => !ip.includes(':'));
    if (ipv4) return ipv4;
  }

  // 2. Use legacy camelCase field selfPeer.ip
  const camelIP = status.selfPeer?.ip;
  if (camelIP) return camelIP;

  // 3. Use top-level TailscaleIPs
  const topIPs = status.TailscaleIPs;
  if (topIPs && topIPs.length > 0) {
    const ipv4 = topIPs.find(ip => !ip.includes(':'));
    if (ipv4) return ipv4;
  }

  return '';
}

/**
 * Safely retrieves the MagicDNS hostname.
 * Supports both camelCase and PascalCase field naming.
 * @param status - TailscaleStatus object
 * @returns hostname or empty string
 */
export function getTailscaleHostname(status: TailscaleStatus | null | undefined): string {
  if (!status) return '';

  // 1. Prefer PascalCase field Self.DNSName
  const dnsName = status.Self?.DNSName;
  if (dnsName) {
    return dnsName.replace(/\.$/, '');
  }

  // 2. Use PascalCase field Self.HostName
  const hostName = status.Self?.HostName;
  if (hostName) {
    return hostName;
  }

  // 3. Use legacy camelCase field selfPeer.dnsName
  const camelDnsName = status.selfPeer?.dnsName;
  if (camelDnsName) {
    return camelDnsName.replace(/\.$/, '');
  }

  // 4. Use legacy camelCase field selfPeer.hostname
  const camelHostname = status.selfPeer?.hostname;
  if (camelHostname) {
    return camelHostname;
  }

  return '';
}

/**
 * Safely retrieves the Tailnet name.
 * @param status - TailscaleStatus object
 * @returns Tailnet name or empty string
 */
export function getTailnetName(status: TailscaleStatus | null | undefined): string {
  if (!status) return '';

  // 1. Use PascalCase field CurrentTailnet.Name
  const currentTailnet = status.CurrentTailnet?.Name;
  if (currentTailnet) return currentTailnet;

  // 2. Use legacy camelCase field selfPeer.tailnet
  const camelTailnet = status.selfPeer?.tailnet;
  if (camelTailnet) return camelTailnet;

  return '';
}

/**
 * Safely retrieves the user email (LoginName).
 * @param status - TailscaleStatus object
 * @returns user email or empty string
 */
export function getUserEmail(status: TailscaleStatus | null | undefined): string {
  if (!status) return '';

  // 1. Get LoginName from the first entry in User map
  const userMap = status.User;
  if (userMap) {
    const users = Object.values(userMap);
    if (users.length > 0 && users[0]?.LoginName) {
      return users[0].LoginName;
    }
  }

  // 2. Use legacy camelCase field selfPeer.tailnet (email format)
  const camelTailnet = status.selfPeer?.tailnet;
  if (camelTailnet) return camelTailnet;

  return '';
}
