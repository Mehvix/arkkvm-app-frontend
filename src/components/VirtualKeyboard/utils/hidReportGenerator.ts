/**
 * HID keyboard report generator.
 * Converts keyboard events and characters to HID reports for virtual keyboard input.
 */
import {
  HID_KEY_USAGE_MAP as HID_KEY_CODES,
  HID_MODIFIER_BITMASK_MAP,
} from '../data/hidKeyCodes';
import { languageLayoutOptions, getLanguageKeyboardLayout } from '../data/language-layouts';
import { generateCharMapFromLayout, type LayoutChars } from './generateCharMap';
import {
  HID_MODIFIERS,
  isModifierKey as isModifierKeyCheck,
  resolveModifierCode,
} from './modifierStateManager';
export type ModifierState = Partial<Record<keyof typeof HID_MODIFIERS, boolean>>

export type LayoutEntry = {
  code: string
  mod?: string[]
  accentKey?: { code: string; mod?: string[] }
}
export type { LayoutChars } from './generateCharMap';
export type HidReport = { keys: number[]; modifier: number }

type KeyInput = KeyboardEvent | string

/**
 * Generate HID keyboard report from keyboard event or key code.
 *
 * @param input - Input type:
 *   - KeyboardEvent: Physical keyboard event (extracts modifiers from event)
 *   - string: Key code, e.g., 'KeyA', 'ShiftLeft', 'Digit1'
 * @param modifiers - Optional modifier state object, only effective when input is string
 *
 * @example
 * toHidReport(event)
 *
 * @example
 * toHidReport('KeyA', { ShiftLeft: true })
 *
 * @example
 * toHidReport('ShiftLeft')
 */
export function toHidReport(
  input: KeyInput,
  modifiers?: ModifierState
): HidReport {

  if (isKeyboardEvent(input)) {
    // Prioritize code; when code is empty, infer through key+location
    const code = input.code || resolveModifierCode(input);
    if (!code || !HID_KEY_CODES[code]) {
      return { keys: [0, 0, 0, 0, 0, 0], modifier: 0 };
    }

    if (isModifierKeyCheck(code)) {

      return {
        keys: [0, 0, 0, 0, 0, 0],
        modifier: (HID_MODIFIERS as Record<string, number>)[code] || 0,
      };
    }

    const modifier = modifiers
      ? externalModifierMask(modifiers)
      : calculateModifierMask(eventModifiers(input));
    return {
      keys: [HID_KEY_CODES[code], 0, 0, 0, 0, 0],
      modifier,
    };
  }

  if (typeof input === 'string') {
    if (!HID_KEY_CODES[input]) {
      return { keys: [0, 0, 0, 0, 0, 0], modifier: 0 };
    }

    if (isModifierKeyCheck(input)) {
      if (
        modifiers &&
        (modifiers as Record<string, boolean>)[input] === false
      ) {
        return {
          keys: [0, 0, 0, 0, 0, 0],
          modifier: 0,
        };
      }

      return {
        keys: [0, 0, 0, 0, 0, 0],
        modifier: (HID_MODIFIERS as Record<string, number>)[input] || 0,
      };
    }

    const modifier = modifiers ? externalModifierMask(modifiers) : 0;
    return {
      keys: [HID_KEY_CODES[input], 0, 0, 0, 0, 0],
      modifier,
    };
  }

  return { keys: [0, 0, 0, 0, 0, 0], modifier: 0 };
}

/**
 * Get layout configuration from layout string with caching.
 *
 * Supports dynamic generation based on layout data.
 */
const layoutConfigCache = new Map<string, { chars: LayoutChars }>();

function getLayoutConfig(
  layout: KeyboardLayout | string,
  layoutType: 'windows' | 'apple' = 'windows'
): {
  chars: LayoutChars
} {
  const cacheKey = `${layout}:${layoutType}`;

  if (layoutConfigCache.has(cacheKey)) {
    return layoutConfigCache.get(cacheKey)!;
  }

  const isoCode = extractIsoCode(layout);
  const layoutId = findLayoutIdByIsoCode(isoCode);
  if (layoutId) {
    const keyboardLayout = getLanguageKeyboardLayout(layoutId, layoutType);
    if (keyboardLayout) {
      const chars = generateCharMapFromLayout(keyboardLayout);
      const config = { chars };
      layoutConfigCache.set(cacheKey, config);
      return config;
    }
  }
}

/**
 * Extract ISO code from layout string.
 * @example 'cs-CZ-qwerty' -> 'cs-CZ'
 * @example 'cs-CZ' -> 'cs-CZ'
 */
function extractIsoCode(layout: string): string {
  const parts = layout.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return layout;
}

/**
 * Find complete layout ID from ISO code.
 * @example 'cs-CZ' -> 'cs-CZ-qwerty'
 */
function findLayoutIdByIsoCode(isoCode: string): string | undefined {
  const option = languageLayoutOptions.find((opt: { id: string }) =>
    opt.id.startsWith(isoCode)
  );

  return option?.id;
}

function isKeyboardEvent(x: unknown): x is KeyboardEvent {
  return !!x && typeof x === 'object' && 'key' in x && 'code' in x;
}

function eventModifiers(e: KeyboardEvent): string[] {
  const mod: string[] = [];
  if (e.ctrlKey) mod.push('ControlLeft');
  if (e.shiftKey) mod.push('ShiftLeft');
  if (e.altKey) mod.push('AltLeft');
  if (e.metaKey) mod.push('MetaLeft');
  return mod;
}

// isModifierKey is now imported from modifierStateManager as isModifierKeyCheck

export function externalModifierMask(ms: ModifierState): number {
  let m = 0
  ;(Object.keys(HID_MODIFIERS) as Array<keyof typeof HID_MODIFIERS>).forEach(
    k => {
      if (ms[k]) m |= HID_MODIFIERS[k];
    }
  );
  return m;
}

/**
 * Calculate modifier key bitmask.
 * @param modifiers Modifier key array
 * @returns Modifier bitmask
 */
function calculateModifierMask(modifiers?: string[]): number {
  let mask = 0;
  if (modifiers && modifiers.length > 0) {
    for (const modKey of modifiers) {
      const bitMask = HID_MODIFIER_BITMASK_MAP[modKey];
      if (bitMask !== undefined) {
        mask |= bitMask;
      }
    }
  }
  return mask;
}

/**
 * Generate HID keyboard report sequence for a single character.
 *
 * Converts characters to HID reports, supporting dead key combinations.
 * Dead keys are special keys that don't output immediately but wait for the next key
 * to combine into accented characters.
 *
 * @param char - Single character to input (e.g., 'a', 'á', 'ü')
 * @param options - Optional configuration
 * @param options.layout - Keyboard layout identifier, defaults to 'cs-CZ-qwerty'
 * @param options.layoutType - Keyboard type (Windows or Apple), defaults to 'windows'
 *
 * @returns HID report array containing complete key sequence (press and release)
 */
export function toHidReportForChar(
  char: string,
  options?: {
    layout?: KeyboardLayout | string
    layoutType?: 'windows' | 'apple'
  }
): HidReport[] {
  const { layout = 'cs-CZ-qwerty', layoutType = 'windows' } = options || {};

  const layoutConfig = getLayoutConfig(layout, layoutType);
  const entry = layoutConfig.chars[char];

  if (!entry) {
    return [];
  }

  const { code, mod, deadKey } = entry;
  const keyCode = HID_KEY_CODES[code];
  if (!keyCode) {
    return [];
  }
  if (deadKey) {
    const deadKeyReports = createDeadKeyReports(deadKey);
    if (deadKeyReports) {
      return deadKeyReports.concat(createCharacterReports(keyCode, mod));
    } else {
      return createMergedDeadKeyReports(deadKey, keyCode, mod);
    }
  }

  return createCharacterReports(keyCode, mod);
}

/**
 * Create HID report sequence for character key (press + release).
 *
 * @param keyCode - HID key code
 * @param modifiers - Modifier key array (e.g., ['ShiftLeft'])
 * @returns Report array containing press and release
 */
function createCharacterReports(
  keyCode: number,
  modifiers?: string[]
): HidReport[] {
  const modifierMask = calculateModifierMask(modifiers);

  return [
    {
      keys: [keyCode, 0, 0, 0, 0, 0],
      modifier: modifierMask,
    },
    {
      keys: [0, 0, 0, 0, 0, 0],
      modifier: 0,
    },
  ];
}

/**
 * Create HID report sequence for dead key (only when dead key requires modifiers).
 *
 * When dead key requires modifiers (e.g., Shift+Equal produces `), sends independent
 * dead key report sequence. If dead key doesn't require modifiers, returns null
 * for caller to handle with merge logic.
 *
 * @param deadKey - Dead key definition (contains code and optional mod)
 * @returns Dead key report array, or null if dead key doesn't require modifiers
 */
function createDeadKeyReports(deadKey: {
  code: string
  mod?: string[]
}): HidReport[] | null {
  const deadKeyCode = HID_KEY_CODES[deadKey.code];

  if (!deadKeyCode) {
    return null;
  }

  if (deadKey.mod && deadKey.mod.length > 0) {
    const deadModifierMask = calculateModifierMask(deadKey.mod);

    return [
      {
        keys: [deadKeyCode, 0, 0, 0, 0, 0],
        modifier: deadModifierMask,
      },
      {
        keys: [0, 0, 0, 0, 0, 0],
        modifier: 0,
      },
    ];
  }

  return null;
}

/**
 * Create merged HID report sequence for dead key and character key.
 *
 * When dead key doesn't require modifiers (e.g., Equal produces ´), merges
 * dead key and character key in the same report to reduce report count
 * and improve input efficiency.
 *
 * @param deadKey - Dead key definition
 * @param charKeyCode - Character key HID code
 * @param charModifiers - Character key modifier array
 * @returns Merged report array (press + release)
 */
function createMergedDeadKeyReports(
  deadKey: { code: string; mod?: string[] },
  charKeyCode: number,
  charModifiers?: string[]
): HidReport[] {
  const deadKeyCode = HID_KEY_CODES[deadKey.code];
  const modifierMask = calculateModifierMask(charModifiers);

  return [
    {
      keys: [deadKeyCode || 0, charKeyCode, 0, 0, 0, 0],
      modifier: modifierMask,
    },
    {
      keys: [0, 0, 0, 0, 0, 0],
      modifier: 0,
    },
  ];
}
