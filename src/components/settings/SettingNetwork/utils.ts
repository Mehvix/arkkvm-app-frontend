export interface ChangeItem {
  key: string
  label: string
  from: string
  to: string
}

export interface SelectOption {
  value: string | number | boolean
  label: string
}

export interface BuildChangeListOptions {
  /**
   * Field name mapping
   * e.g. hostname -> Hostname
   */
  labels?: Record<string, string>

  /**
   * Field value mapping
   * e.g. time_sync_mode: http_only -> HTTP only
   */
  valueMaps?: Record<string, SelectOption[]>

  /**
   * Custom field value formatter
   * Takes priority over valueMaps
   */
  valueFormatters?: Record<string, (value: unknown) => string>
}

export const DEFAULT_CHANGE_KEYS = [
  'hostname',
  'domain',
  'http_proxy',
  'ipv4_mode',
  'static_ipv4.ipAddress',
  'static_ipv4.subnetMask',
  'static_ipv4.gateway',
  'static_ipv4.dnsServers',
  'ipv6_mode',
  'mdns_mode',
  'lldp_mode',
  'time_sync_mode',
] as const;

export const DEFAULT_CHANGE_LABELS: Record<string, string> = {
  hostname: 'Hostname',
  domain: 'Domain',
  http_proxy: 'HTTP Proxy',

  ipv4_mode: 'IPv4 Mode',
  'static_ipv4.ipAddress': 'IPv4 Address',
  'static_ipv4.subnetMask': 'Subnet Mask',
  'static_ipv4.gateway': 'Gateway',
  'static_ipv4.dnsServers': 'DNS Servers',
  'vlan_id':'VLAN ID',
  ipv6_mode: 'IPv6 Mode',

  mdns_mode: 'mDNS',
  lldp_mode: 'LLDP',
  time_sync_mode: 'Time Synchronization',
};

export function buildChangeList(
  original: object | null | undefined,
  current: object | null | undefined,
  keys: readonly string[] = DEFAULT_CHANGE_KEYS,
  options: BuildChangeListOptions = {},
): ChangeItem[] {
  if (!original || !current) return [];

  const labels = {
    ...DEFAULT_CHANGE_LABELS,
    ...(options.labels ?? {}),
  };

  const keyOrder = new Map(keys.map((k, i) => [k, i]));

  return keys.reduce<ChangeItem[]>((result, key) => {
    const fromValue = getValueByPath(original, key);
    const toValue = getValueByPath(current, key);

    if (isSameValue(fromValue, toValue)) {
      return result;
    }

    result.push({
      key,
      label: labels[key] ?? key,
      from: formatDisplayValue(key, fromValue, options),
      to: formatDisplayValue(key, toValue, options),
    });
    return result;
  }, []).sort((a, b) => (keyOrder.get(a.key) ?? 999) - (keyOrder.get(b.key) ?? 999));
}

export function getValueByPath(
  source: object | null | undefined,
  path: string,
): unknown {
  if (!source) return undefined;

  return path.split('.').reduce<unknown>((value, key) => {
    if (value == null) return undefined;
    if (typeof value !== 'object') return undefined;

    return (value as Record<string, unknown>)[key];
  }, source);
}

function formatDisplayValue(
  key: string,
  value: unknown,
  options: BuildChangeListOptions,
): string {
  const formatter = options.valueFormatters?.[key];

  if (formatter) {
    return formatter(value);
  }

  const valueMap = options.valueMaps?.[key];

  if (valueMap) {
    return formatByValueMap(value, valueMap);
  }

  return formatChangeValue(value);
}

function formatByValueMap(value: unknown, valueMap: SelectOption[]): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Not configured';

    return value
      .map((item) => {
        const matched = valueMap.find((option) => option.value === item);
        return matched?.label ?? String(item);
      })
      .join(', ');
  }

  const matched = valueMap.find((option) => option.value === value);

  return matched?.label ?? formatChangeValue(value);
}

export function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Not configured';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'Not configured';
  }

  if (typeof value === 'boolean') {
    return value ? 'Enabled' : 'Disabled';
  }

  return String(value);
}

export function isSameValue(a: unknown, b: unknown): boolean {
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

    return aKeys.every((key) => {
      return isSameValue(a[key], b[key]);
    });
  }

  return false;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}
