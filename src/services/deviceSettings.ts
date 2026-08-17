/*
 * @Author: Lei Zhang daisy_zlei@163.com
 * @Date: 2026-06-26 14:34:26
 * @LastEditors: Lei Zhang daisy_zlei@163.com
 * @LastEditTime: 2026-07-03 20:39:51
 */
import type {
  JsonRpcResponse,
  JsonRpcSend,
  MethodParamsMap,
} from '@/hooks/useJsonRpc';
import type { DeviceSettings } from '@/stores/devicesStore';

// Helper: unwrap JSON-RPC response
function getResult(resp: JsonRpcResponse): unknown {
  if ('error' in resp) throw new Error(resp.error.message || 'RPC error');
  return (resp as { result?: unknown }).result;
}

export type SendAsync = <M extends keyof MethodParamsMap>(
  call: JsonRpcSend<M>,
  opts?: { timeout?: number }
) => Promise<JsonRpcResponse>

export async function fetchDeviceSettings(
  sendAsync: SendAsync
): Promise<Partial<DeviceSettings>> {
  // Fetch required settings in parallel.
  const [
    updateStatusResp,
    netSettingsResp,
    jigglerResp,
    autoUpdateResp,
  ] = await Promise.all([
    sendAsync({ method: 'getUpdateStatus' }).catch(e => e),
    sendAsync({ method: 'getNetworkSettings' }).catch(e => e),
    sendAsync({ method: 'getJigglerState' }).catch(e => e),
    sendAsync({ method: 'getAutoUpdateState' }).catch(e => e),
  ]);
  const settings: Partial<DeviceSettings> = {};

  // Version information.
  try {
    const updateStatus = getResult(updateStatusResp as JsonRpcResponse) as Record<string, Record<string, unknown>>;
    // Device response shape: local.appVersion / local.systemVersion.
    settings.appVersion = String(updateStatus?.local?.appVersion ?? '');
    settings.systemVersion = String(updateStatus?.local?.systemVersion ?? '');
  } catch {}

  // Network settings mapping.
  try {
    const networkSettings = getResult(netSettingsResp as JsonRpcResponse) as Record<string, unknown>;
    settings.network = {
      mac_address: String(networkSettings?.mac_address ?? ''),
      hostname: String(networkSettings?.hostname ?? ''),
      http_proxy: String(networkSettings?.http_proxy ?? ''),
      domain: String(networkSettings?.domain ?? ''),
      ipv4_mode: String(networkSettings?.ipv4_mode ?? 'dhcp'),
      ipv6_mode: String(networkSettings?.ipv6_mode ?? 'slaac'),
      lldp_mode: String(networkSettings?.lldp_mode ?? ''),
      mdns_mode: String(networkSettings?.mdns_mode ?? 'auto'),
      time_sync_mode: String(networkSettings?.time_sync_mode ?? 'ntp+http'),
    };
  } catch {}

  // Mouse jiggler state.
  try {
    const jigglerState = getResult(jigglerResp as JsonRpcResponse) as Record<string, unknown>;
    settings.jiggler = !!jigglerState?.enabled;
  } catch {}

  // Auto-update state.
  try {
    const autoUpdateState = getResult(autoUpdateResp as JsonRpcResponse) as Record<string, unknown>;
    settings.autoUpdate = !!autoUpdateState?.enabled;
  } catch {}


  return settings;
}
