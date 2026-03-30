import type { KeyboardLayout } from '../keyboard-types'
import type { LanguageLayoutModule, LayoutMeta, LayoutOption } from './types'

// ============================================================

// ============================================================
const layoutModules = import.meta.glob<{ default: LanguageLayoutModule }>(
  './*/index.ts',
  { eager: true }
)

const ALL_LAYOUTS: LanguageLayoutModule[] = Object.values(layoutModules)
  .map(module => module.default)
  .filter((module): module is LanguageLayoutModule => !!module && !!module.meta)

// ============================================================

// ============================================================

export const layoutMetaMap: Record<string, LayoutMeta> = {}

export const layoutModuleMap: Record<string, LanguageLayoutModule> = {}

export const layoutOptions: LayoutOption[] = []

ALL_LAYOUTS.forEach(module => {
  const { meta } = module
  layoutMetaMap[meta.id] = meta
  layoutModuleMap[meta.id] = module
  layoutOptions.push({
    ...meta,
    hasWindows: !!module.windows,
    hasMac: !!module.mac,
  })
})

layoutOptions.sort((a, b) => a.priority - b.priority)

// ============================================================

// ============================================================

export function getLayoutMeta(id: string): LayoutMeta | undefined {
  return layoutMetaMap[id]
}

export function getLayoutModule(id: string): LanguageLayoutModule | undefined {
  return layoutModuleMap[id]
}

export function getKeyboardLayout(
  id: string,
  platform: 'windows' | 'mac' = 'windows'
): KeyboardLayout | undefined {
  const module = layoutModuleMap[id]
  if (!module) return undefined
  return platform === 'mac' ? module.mac : module.windows
}

export function getLayoutOptionsByRegion(): Record<string, LayoutOption[]> {
  const grouped: Record<string, LayoutOption[]> = {
    global: [],
    europe: [],
    asia: [],
    americas: [],
  }
  layoutOptions.forEach(option => {
    grouped[option.region]?.push(option)
  })
  return grouped
}

export function getRecommendedLayouts(): LayoutOption[] {
  return layoutOptions.filter(option => option.recommended)
}

export type { LanguageLayoutModule, LayoutMeta, LayoutOption } from './types'
