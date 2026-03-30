/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-08-26 20:32:39
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-10-14 19:04:12
 */
import type {
  JsonRpcResponse,
  JsonRpcSend,
  MethodParamsMap,
} from '@/hooks/useJsonRpc'
import type { DeviceSettings } from '@/stores/devicesStore'

// Helper: unwrap JSON-RPC response
function getResult(resp: JsonRpcResponse): any {
  if ('error' in resp) throw new Error(resp.error.message || 'RPC error')
  return (resp as any).result
}

export type SendAsync = <M extends keyof MethodParamsMap>(
  call: JsonRpcSend<M>,
  opts?: { timeout?: number }
) => Promise<JsonRpcResponse>

export async function fetchDeviceSettings(
  sendAsync: SendAsync
): Promise<Partial<DeviceSettings>> {
  const [
    updateStatusResp,
    netSettingsResp,
    tlsStateResp,
    jigglerResp,
    autoUpdateResp,
  ] = await Promise.all([
    sendAsync({ method: 'getUpdateStatus' }).catch(e => e),
    sendAsync({ method: 'getNetworkSettings' }).catch(e => e),
    sendAsync({ method: 'getTLSState' }).catch(e => e),
    sendAsync({ method: 'getJigglerState' }).catch(e => e),
    sendAsync({ method: 'getAutoUpdateState' }).catch(e => e),
  ])

  const out: Partial<DeviceSettings> = {}

  try {
    const u = getResult(updateStatusResp as any) as any

    out.appVersion = String(u?.local?.appVersion ?? '')
    out.systemVersion = String(u?.local?.systemVersion ?? '')
  } catch {}

  try {
    const s = getResult(netSettingsResp as any) as any
    out.network = {
      mac: String(s?.mac ?? ''),
      hostname: String(s?.hostname ?? ''),
      httpProxy: String(s?.httpProxy ?? ''),
      domainMode: (s?.domainMode ?? 'dhcp') as any,
      domainSuffix: String(s?.domainSuffix ?? ''),
      mdns: (s?.mdns ?? 'auto') as any,
      timeSync: (s?.timeSync ?? 'ntp+http') as any,
      ntpServer: String(s?.ntpServer ?? ''),
      httpTimeUrl: String(s?.httpTimeUrl ?? ''),
      ipv4Mode: (s?.ipv4Mode ?? 'dhcp') as any,
      ipv6Mode: (s?.ipv6Mode ?? 'slaac') as any,
    }
  } catch {}

  try {
    const j = getResult(jigglerResp as any) as any
    out.jiggler = !!j?.enabled
  } catch {}

  try {
    const a = getResult(autoUpdateResp as any) as any
    out.autoUpdate = !!a?.enabled
  } catch {}

  try {
    const t = getResult(tlsStateResp as any) as any
  } catch {}

  return out
}
