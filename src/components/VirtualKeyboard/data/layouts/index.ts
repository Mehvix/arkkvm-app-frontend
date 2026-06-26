/**
 * @Purpose: Keyboard layout unified entry - auto-collect all language layouts
 * @Author: zhanglei
 * @Date: 2026-01-23
 */

import type { KeyboardLayout } from '../keyboard-types';
import type { LanguageLayoutModule, LayoutMeta, LayoutOption } from './types';

// ============================================================
// Auto-import all layout modules (no manual maintenance needed)
// Each xx_XX directory's index.ts will be auto-imported and registered
// ============================================================
const layoutModules = import.meta.glob<{ default: LanguageLayoutModule }>(
  './*/index.ts', // Only match one level of subdirectories, avoid matching self
  { eager: true }
);

// Collect all imported layout modules
const ALL_LAYOUTS: LanguageLayoutModule[] = Object.values(layoutModules)
  .map(module => module.default)
  .filter((module): module is LanguageLayoutModule => !!module && !!module.meta);

// ============================================================
// Auto-generated data structures (no manual maintenance needed)
// ============================================================

/** Metadata mapping for all layouts (id -> meta) */
export const layoutMetaMap: Record<string, LayoutMeta> = {};

/** Module mapping for all layouts (id -> module) */
export const layoutModuleMap: Record<string, LanguageLayoutModule> = {};

/** Layout option list (for UI dropdown selection etc.) */
export const layoutOptions: LayoutOption[] = [];

// Initialize mapping
ALL_LAYOUTS.forEach(module => {
  const { meta } = module;
  layoutMetaMap[meta.id] = meta;
  layoutModuleMap[meta.id] = module;
  layoutOptions.push({
    ...meta,
    hasWindows: !!module.windows,
    hasMac: !!module.mac,
  });
});

// Sort by priority
layoutOptions.sort((a, b) => a.priority - b.priority);

// ============================================================
// Utility functions
// ============================================================

/**
 * Get layout metadata by ID
 */
export function getLayoutMeta(id: string): LayoutMeta | undefined {
  return layoutMetaMap[id];
}

/**
 * Get layout module by ID
 */
export function getLayoutModule(id: string): LanguageLayoutModule | undefined {
  return layoutModuleMap[id];
}

/**
 * Get keyboard layout by ID and platform
 */
export function getKeyboardLayout(
  id: string,
  platform: 'windows' | 'mac' = 'windows'
): KeyboardLayout | undefined {
  const module = layoutModuleMap[id];
  if (!module) return undefined;
  return platform === 'mac' ? module.mac : module.windows;
}

/**
 * Get layout options grouped by region
 */
export function getLayoutOptionsByRegion(): Record<string, LayoutOption[]> {
  const grouped: Record<string, LayoutOption[]> = {
    global: [],
    europe: [],
    asia: [],
    americas: [],
  };
  layoutOptions.forEach(option => {
    grouped[option.region]?.push(option);
  });
  return grouped;
}

/**
 * Get recommended layout options
 */
export function getRecommendedLayouts(): LayoutOption[] {
  return layoutOptions.filter(option => option.recommended);
}

// Export types
export type { LanguageLayoutModule, LayoutMeta, LayoutOption } from './types';
