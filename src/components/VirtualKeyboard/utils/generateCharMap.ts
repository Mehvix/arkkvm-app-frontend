/**
 * Generate character mapping table from keyboard layout data.
 * Extracts legends from layout rows to create character-to-keycode mapping for HID reports.
 */

/**
 * Character mapping entry.
 */
export interface CharMapEntry {
  code: string
  mod?: string[]
  accentKey?: { code: string; mod?: string[] }
}

/**
 * Character mapping table type.
 */
export type LayoutChars = Record<string, CharMapEntry>

/**
 * Keyboard layout data interface (local definition to avoid circular dependency).
 */
export interface KeyboardLayoutData {
  id?: string
  name?: string
  rows: Array<Array<{ keyCode: string; legends?: Record<string, string> }>>
  rightPanel?: Array<
    Array<{ keyCode: string; legends?: Record<string, string> }>
  >
  extraChars?: Record<string, CharMapEntry>
}

/**
 * Generate character mapping table from keyboard layout data.
 *
 * @param layout - Keyboard layout data (includes rows and optional rightPanel)
 * @returns Character-to-keycode mapping table
 *
 * @example
 * const charMap = generateCharMapFromLayout(csLayout)
 * // charMap['z'] = { code: 'KeyY' }
 * // charMap['Z'] = { code: 'KeyY', mod: ['ShiftLeft'] }
 */
export function generateCharMapFromLayout(
  layout: KeyboardLayoutData
): LayoutChars {
  const map: LayoutChars = {
    ' ': { code: 'Space' },
    '\n': { code: 'Enter' },
    '\t': { code: 'Tab' },
    ',': { code: 'Comma' },
    ';': { code: 'Comma', mod: ['ShiftLeft'] },
    '.': { code: 'Period' },
    ':': { code: 'Period', mod: ['ShiftLeft'] },
    '-': { code: 'Slash' },
    _: { code: 'Slash', mod: ['ShiftLeft'] },
  };
  const layoutRows = layout.rows;

  if (layoutRows && Array.isArray(layoutRows)) {
    for (const row of layoutRows) {
      for (const key of row) {
        processKeyDefinition(key, map);
      }
    }
  }

  // if (layout.rightPanel && Array.isArray(layout.rightPanel)) {
  //   for (const row of layout.rightPanel) {
  //     for (const key of row) {
  //       processKeyDefinition(key, map);
  //     }
  //   }
  // }

  if (layout.extraChars) {
    Object.assign(map, layout.extraChars);
  }

  return map;
}

/**
 * Process single key definition, extract legends and add to mapping table.
 */
function processKeyDefinition(
  key: { keyCode: string; legends?: Record<string, string> },
  map: LayoutChars
): void {
  if (!key || !key.keyCode || !key.legends) return;

  const { keyCode, legends } = key;

  for (const [modState, char] of Object.entries(legends)) {
    if (!char) continue;

    const entry: CharMapEntry = { code: keyCode };

    switch (modState) {
      case 'base':
        break;
      case 'shift':
        entry.mod = ['ShiftLeft'];
        break;
      case 'caps':
        continue;
      case 'shift+caps':
        continue;
      case 'altGr':
        entry.mod = ['AltRight'];
        break;
      case 'shift+altGr':
        entry.mod = ['ShiftLeft', 'AltRight'];
        break;
      case 'fn':
        continue;
      case 'fn+shift':
      case 'fn+altGr':
      case 'fn+shift+altGr':
        continue;
      default:
        continue;
    }
    map[char] = entry;
  }
}

/**
 * Cache for generated character mapping tables.
 */
const charMapCache = new Map<string, LayoutChars>();

/**
 * Get or generate character mapping table for specified layout (with cache).
 *
 * @param layoutId - Layout ID (e.g., 'cs-CZ-qwerty')
 * @param layout - Keyboard layout data
 * @returns Character mapping table
 */
export function getOrGenerateCharMap(
  layoutId: string,
  layout: KeyboardLayoutData
): LayoutChars {
  if (charMapCache.has(layoutId)) {
    return charMapCache.get(layoutId)!;
  }

  const charMap = generateCharMapFromLayout(layout);
  charMapCache.set(layoutId, charMap);
  return charMap;
}

/**
 * Clear character mapping cache.
 */
export function clearCharMapCache(): void {
  charMapCache.clear();
}
