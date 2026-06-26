/**
 * Device info detection. Pure functions + SSR-safe.
 *
 * - Static info (UA / platform / touch capability) cached per session
 * - Viewport size is read fresh on each call, keeping rotation/resize accurate
 * - iPadOS masquerading as Macintosh is corrected back to 'ios'
 */

export type DevicePlatform = 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'unknown'

export interface DeviceInfo {
  userAgent: string
  platform: DevicePlatform

  isIOS: boolean
  isAndroid: boolean
  isWindows: boolean
  isMac: boolean
  isLinux: boolean

  isTouchDevice: boolean
  isCoarsePointer: boolean
  canHover: boolean

  isPhone: boolean
  isTablet: boolean
  isDesktop: boolean

  /** Current viewport width (= window.innerWidth), not physical screen resolution */
  viewportWidth: number
  /** Current viewport height (= window.innerHeight), not physical screen resolution */
  viewportHeight: number
  shortSide: number
  longSide: number
}

interface StaticInfo {
  userAgent: string
  platform: DevicePlatform
  isIOS: boolean
  isAndroid: boolean
  isWindows: boolean
  isMac: boolean
  isLinux: boolean
  isTouchDevice: boolean
  isCoarsePointer: boolean
  canHover: boolean
  isPhoneByUA: boolean
  isTabletByUA: boolean
}

let cachedStatic: StaticInfo | null = null;

function matchPlatform(lowerUA: string): DevicePlatform {
  if (/iphone|ipad|ipod/.test(lowerUA)) return 'ios';
  if (/android/.test(lowerUA)) return 'android';
  if (/windows nt/.test(lowerUA)) return 'windows';
  if (/macintosh|mac os x/.test(lowerUA)) return 'mac';
  if (/linux/.test(lowerUA)) return 'linux';
  return 'unknown';
}

function computeStatic(): StaticInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const lowerUA = ua.toLowerCase();

  const hasWindow = typeof window !== 'undefined';
  const hasNavigator = typeof navigator !== 'undefined';
  const maxTouchPoints =
    hasNavigator && typeof navigator.maxTouchPoints === 'number'
      ? navigator.maxTouchPoints
      : 0;

  const isTouchDevice = maxTouchPoints > 0 || (hasWindow && 'ontouchstart' in window);
  const isCoarsePointer =
    hasWindow &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const canHover =
    hasWindow &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover)').matches;

  // iPadOS 13+ disguises itself as Macintosh; detect via multi-touch points
  const isIPadOS =
    /macintosh/.test(lowerUA) && isTouchDevice && maxTouchPoints > 1;

  const rawPlatform = matchPlatform(lowerUA);
  const platform: DevicePlatform = isIPadOS ? 'ios' : rawPlatform;

  const isIPhone = /iphone/.test(lowerUA);
  const isIPadByUA = /ipad/.test(lowerUA) || isIPadOS;
  const isAndroidMobile = /android/.test(lowerUA) && /mobile/.test(lowerUA);
  const isAndroidTablet = /android/.test(lowerUA) && !/mobile/.test(lowerUA);

  return {
    userAgent: ua,
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWindows: platform === 'windows',
    isMac: platform === 'mac',
    isLinux: platform === 'linux',
    isTouchDevice,
    isCoarsePointer,
    canHover,
    isPhoneByUA: isIPhone || isAndroidMobile,
    isTabletByUA: isIPadByUA || isAndroidTablet,
  };
}

function getStatic(): StaticInfo {
  if (!cachedStatic) cachedStatic = computeStatic();
  return cachedStatic;
}

function getViewport() {
  if (typeof window === 'undefined') {
    return { viewportWidth: 0, viewportHeight: 0, shortSide: 0, longSide: 0 };
  }
  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  return {
    viewportWidth,
    viewportHeight,
    shortSide: Math.min(viewportWidth, viewportHeight),
    longSide: Math.max(viewportWidth, viewportHeight),
  };
}

/**
 * Returns whether the current device uses touch as its primary input method.
 *
 * Criteria: media query `(hover: hover)` is false, or `(pointer: coarse)` is true.
 * More accurate than `isTouchDevice` alone — hybrid devices like Surface with precise hover
 * are classified as non-touch (based on primary input method).
 */
export function isTouchOnly(): boolean {
  const s = getStatic();
  return !s.canHover || s.isCoarsePointer;
}

/**
 * Returns device information.
 *
 * Detection priority:
 * 1. If UA clearly identifies a phone/tablet, trust it directly
 * 2. Otherwise use heuristics: touch + no precise hover + short side size
 * 3. Everything else is desktop (including Windows touch-screen laptops that support hover)
 */
export function getDeviceInfo(): DeviceInfo {
  const s = getStatic();
  const vp = getViewport();

  const isPhone =
    s.isPhoneByUA ||
    (s.isTouchDevice && !s.canHover && vp.shortSide > 0 && vp.shortSide < 768);

  const isTablet =
    !isPhone &&
    (s.isTabletByUA ||
      (s.isTouchDevice && !s.canHover && vp.shortSide >= 768 && vp.shortSide <= 1366));

  const isDesktop = !isPhone && !isTablet;

  return {
    userAgent: s.userAgent,
    platform: s.platform,
    isIOS: s.isIOS,
    isAndroid: s.isAndroid,
    isWindows: s.isWindows,
    isMac: s.isMac,
    isLinux: s.isLinux,
    isTouchDevice: s.isTouchDevice,
    isCoarsePointer: s.isCoarsePointer,
    canHover: s.canHover,
    isPhone,
    isTablet,
    isDesktop,
    ...vp,
  };
}
