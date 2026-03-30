/**
 * Virtual keyboard modifier key state manager.
 * Provides a complete, independent modifier key management system for virtual keyboards.
 */

// Modifier key code constants
export const MODIFIER_KEY_CODES = {
  CAPS_LOCK: 'CapsLock',
  SHIFT_LEFT: 'ShiftLeft',
  SHIFT_RIGHT: 'ShiftRight',
  CONTROL_LEFT: 'ControlLeft',
  CONTROL_RIGHT: 'ControlRight',
  ALT_LEFT: 'AltLeft',
  ALT_RIGHT: 'AltRight',
  ALT_GR: 'AltGr',
  META_LEFT: 'MetaLeft',
  META_RIGHT: 'MetaRight',
  FN: 'Fn',
  NUM_LOCK: 'NumLock',
  SCROLL_LOCK: 'ScrollLock',
} as const

export type ModifierKeyCode =
  (typeof MODIFIER_KEY_CODES)[keyof typeof MODIFIER_KEY_CODES]
export const MODIFIER_KEY_GROUPS = {
  SHIFT_KEYS: [MODIFIER_KEY_CODES.SHIFT_LEFT, MODIFIER_KEY_CODES.SHIFT_RIGHT],
  CONTROL_KEYS: [
    MODIFIER_KEY_CODES.CONTROL_LEFT,
    MODIFIER_KEY_CODES.CONTROL_RIGHT,
  ],
  ALT_KEYS: [
    MODIFIER_KEY_CODES.ALT_LEFT,
    MODIFIER_KEY_CODES.ALT_RIGHT,
    MODIFIER_KEY_CODES.ALT_GR,
  ],
  META_KEYS: [MODIFIER_KEY_CODES.META_LEFT, MODIFIER_KEY_CODES.META_RIGHT],
  LOCK_KEYS: [
    MODIFIER_KEY_CODES.CAPS_LOCK,
    MODIFIER_KEY_CODES.NUM_LOCK,
    MODIFIER_KEY_CODES.SCROLL_LOCK,
  ],
  ALL_MODIFIERS: [
    MODIFIER_KEY_CODES.SHIFT_LEFT,
    MODIFIER_KEY_CODES.SHIFT_RIGHT,
    MODIFIER_KEY_CODES.CONTROL_LEFT,
    MODIFIER_KEY_CODES.CONTROL_RIGHT,
    MODIFIER_KEY_CODES.ALT_LEFT,
    MODIFIER_KEY_CODES.ALT_RIGHT,
    MODIFIER_KEY_CODES.ALT_GR,
    MODIFIER_KEY_CODES.META_LEFT,
    MODIFIER_KEY_CODES.META_RIGHT,
  ],
} as const

export const HID_MODIFIERS = {
  ControlLeft: 1 << 0, // 0x01
  ShiftLeft: 1 << 1, // 0x02
  AltLeft: 1 << 2, // 0x04
  MetaLeft: 1 << 3, // 0x08
  ControlRight: 1 << 4, // 0x10
  ShiftRight: 1 << 5, // 0x20
  AltRight: 1 << 6, // 0x40
  MetaRight: 1 << 7, // 0x80
  AltGr: 1 << 6, // 0x40
} as const

export interface VirtualKeyboardModifierState {
  CapsLock: boolean
  ShiftLeft: boolean
  ShiftRight: boolean
  ControlLeft: boolean
  ControlRight: boolean
  AltLeft: boolean
  AltRight: boolean
  AltGr?: boolean
  MetaLeft: boolean
  MetaRight: boolean
  Fn?: boolean
  NumLock?: boolean
  ScrollLock?: boolean
}

export interface ComboModifierStates {
  shiftActive: boolean
  controlActive: boolean
  altActive: boolean
  altGrActive: boolean
  metaActive: boolean
  capsLockActive: boolean
  numLockActive: boolean
  scrollLockActive: boolean
}

/**
 * Create initial modifier key state with all keys set to false.
 */
export function createInitialModifierState(): VirtualKeyboardModifierState {
  return {
    CapsLock: false,
    ShiftLeft: false,
    ShiftRight: false,
    ControlLeft: false,
    ControlRight: false,
    AltLeft: false,
    AltRight: false,
    AltGr: false,
    MetaLeft: false,
    MetaRight: false,
  }
}

const MODIFIER_KEY_TO_CODES: Record<string, ModifierKeyCode[]> = {
  Shift: [MODIFIER_KEY_CODES.SHIFT_LEFT, MODIFIER_KEY_CODES.SHIFT_RIGHT],
  Control: [MODIFIER_KEY_CODES.CONTROL_LEFT, MODIFIER_KEY_CODES.CONTROL_RIGHT],
  Alt: [MODIFIER_KEY_CODES.ALT_LEFT, MODIFIER_KEY_CODES.ALT_RIGHT],
  Meta: [MODIFIER_KEY_CODES.META_LEFT, MODIFIER_KEY_CODES.META_RIGHT],
  AltGraph: [MODIFIER_KEY_CODES.ALT_GR],
}

const MODIFIER_KEY_VALUES = new Set(Object.keys(MODIFIER_KEY_TO_CODES))

const ALL_MODIFIER_CODES_SET = new Set<string>([
  ...MODIFIER_KEY_GROUPS.ALL_MODIFIERS,
  MODIFIER_KEY_CODES.FN,
])

/**
 * Check if a key code or keyboard event is a modifier key.
 * Supports both string (code) and KeyboardEvent input.
 * When code is empty, falls back to event.key for detection.
 */
export function isModifierKey(
  input: string | KeyboardEvent
): input is ModifierKeyCode {
  if (typeof input === 'string') {
    return ALL_MODIFIER_CODES_SET.has(input)
  }
  if (input.code && ALL_MODIFIER_CODES_SET.has(input.code)) {
    return true
  }

  if (input.key && MODIFIER_KEY_VALUES.has(input.key)) {
    return true
  }
  return false
}

/**
 * Resolve modifier key code from KeyboardEvent.
 * When event.code is empty, infers code from event.key + event.location.
 * Returns empty string if not a modifier key.
 */
export function resolveModifierCode(
  event: KeyboardEvent
): ModifierKeyCode | '' {
  if (event.code && ALL_MODIFIER_CODES_SET.has(event.code)) {
    return event.code as ModifierKeyCode
  }

  const candidates = MODIFIER_KEY_TO_CODES[event.key]
  if (!candidates) return ''

  if (candidates.length === 1) return candidates[0]

  if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
    return candidates.find(c => c.endsWith('Right')) || candidates[0]
  }
  return candidates.find(c => c.endsWith('Left')) || candidates[0]
}

/**
 * Check if a key code is a Shift key.
 */
export function isShiftKey(keyCode: string): boolean {
  return MODIFIER_KEY_GROUPS.SHIFT_KEYS.includes(keyCode as ModifierKeyCode)
}

/**
 * Check if a key code is a Control key.
 */
export function isControlKey(keyCode: string): boolean {
  return MODIFIER_KEY_GROUPS.CONTROL_KEYS.includes(keyCode as ModifierKeyCode)
}

/**
 * Check if a key code is an Alt key.
 */
export function isAltKey(keyCode: string): boolean {
  return MODIFIER_KEY_GROUPS.ALT_KEYS.includes(keyCode as ModifierKeyCode)
}

/**
 * Check if a key code is a Meta key.
 */
export function isMetaKey(keyCode: string): boolean {
  return MODIFIER_KEY_GROUPS.META_KEYS.includes(keyCode as ModifierKeyCode)
}

/**
 * Check if a key code is the Caps Lock key.
 */
export function isCapsLockKey(keyCode: string): boolean {
  return keyCode === MODIFIER_KEY_CODES.CAPS_LOCK
}

/**
 * Check if a key code is a lock key (Caps/Num/Scroll Lock).
 */
export function isLockKey(keyCode: string): boolean {
  return MODIFIER_KEY_GROUPS.LOCK_KEYS.includes(keyCode as ModifierKeyCode)
}

/**
 * Get combined modifier key states for display logic.
 */
export function getComboModifierStates(
  state: VirtualKeyboardModifierState
): ComboModifierStates {
  return {
    shiftActive: state.ShiftLeft || state.ShiftRight,
    controlActive: state.ControlLeft || state.ControlRight,
    altActive: state.AltLeft || state.AltRight,
    altGrActive: state.AltGr || false,
    metaActive: state.MetaLeft || state.MetaRight,
    capsLockActive: state.CapsLock,
    numLockActive: state.NumLock || false,
    scrollLockActive: state.ScrollLock || false,
  }
}

/**
 * Virtual keyboard modifier key state manager class.
 * Encapsulates all modifier key operations required by virtual keyboard components.
 */
export class VirtualKeyboardModifierManager {
  private state: VirtualKeyboardModifierState

  constructor(initialState?: Partial<VirtualKeyboardModifierState>) {
    this.state = {
      ...createInitialModifierState(),
      ...initialState,
    }
  }

  /**
   * Get current modifier key state.
   */
  getState(): VirtualKeyboardModifierState {
    return { ...this.state }
  }

  /**
   * Set modifier key state.
   */
  setState(newState: Partial<VirtualKeyboardModifierState>): void {
    this.state = { ...this.state, ...newState }
  }

  /**
   * Toggle a single modifier key state.
   */
  toggleModifierKey(keyCode: ModifierKeyCode): VirtualKeyboardModifierState {
    const newState = {
      ...this.state,
      [keyCode]: !this.state[keyCode as keyof VirtualKeyboardModifierState],
    }
    this.state = newState
    return newState
  }

  /**
   * Set a single modifier key state.
   */
  setModifierKey(
    keyCode: ModifierKeyCode,
    isActive: boolean
  ): VirtualKeyboardModifierState {
    const newState = {
      ...this.state,
      [keyCode]: isActive,
    }
    this.state = newState
    return newState
  }

  /**
   * Reset all modifier key states to initial values.
   */
  resetAllModifiers(): VirtualKeyboardModifierState {
    this.state = createInitialModifierState()
    return this.getState()
  }

  /**
   * Get combined modifier key states for display logic.
   */
  getComboStates(): ComboModifierStates {
    return getComboModifierStates(this.state)
  }

  /**
   * Check if any modifier key is active.
   */
  hasActiveModifiers(): boolean {
    const combo = this.getComboStates()
    return (
      combo.shiftActive ||
      combo.controlActive ||
      combo.altActive ||
      combo.metaActive ||
      combo.capsLockActive
    )
  }

  /**
   * Get list of currently active modifier keys.
   */
  getActiveModifiers(): ModifierKeyCode[] {
    return MODIFIER_KEY_GROUPS.ALL_MODIFIERS.filter(
      keyCode => this.state[keyCode as keyof VirtualKeyboardModifierState]
    )
  }

  /**
   * Check if a specific modifier key is active.
   */
  isModifierActive(keyCode: ModifierKeyCode): boolean {
    return Boolean(this.state[keyCode as keyof VirtualKeyboardModifierState])
  }

  /**
   * Set multiple modifier key states at once.
   */
  setMultipleModifiers(
    modifiers: Record<ModifierKeyCode, boolean>
  ): VirtualKeyboardModifierState {
    const newState = { ...this.state }
    Object.entries(modifiers).forEach(([keyCode, isActive]) => {
      newState[keyCode as keyof VirtualKeyboardModifierState] = isActive
    })
    this.state = newState
    return newState
  }
}

/**
 * Create a virtual keyboard modifier key manager instance.
 */
export function createVirtualKeyboardModifierManager(
  initialState?: Partial<VirtualKeyboardModifierState>
): VirtualKeyboardModifierManager {
  return new VirtualKeyboardModifierManager(initialState)
}

/**
 * Generate HID modifier key bitmask from modifier state.
 */
export function generateHidModifierMask(
  state: VirtualKeyboardModifierState
): number {
  let mask = 0

  if (state.ControlLeft) mask |= HID_MODIFIERS.ControlLeft
  if (state.ShiftLeft) mask |= HID_MODIFIERS.ShiftLeft
  if (state.AltLeft) mask |= HID_MODIFIERS.AltLeft
  if (state.MetaLeft) mask |= HID_MODIFIERS.MetaLeft
  if (state.ControlRight) mask |= HID_MODIFIERS.ControlRight
  if (state.ShiftRight) mask |= HID_MODIFIERS.ShiftRight
  if (state.AltRight) mask |= HID_MODIFIERS.AltRight
  if (state.MetaRight) mask |= HID_MODIFIERS.MetaRight

  return mask
}

/**
 * Check if modifier key state affects character display.
 */
export function shouldAffectCharacterDisplay(
  keyCode: string,
  state: VirtualKeyboardModifierState
): boolean {
  if (/^Key[A-Z]$/.test(keyCode)) {
    const combo = getComboModifierStates(state)
    return combo.capsLockActive !== combo.shiftActive
  }

  const combo = getComboModifierStates(state)
  return combo.shiftActive
}

/**
 * Get the ModChord to use based on current modifier key state.
 * @param state Modifier key state
 * @returns ModChord to use
 */
export function getCurrentModChord(
  state: VirtualKeyboardModifierState
): ModChord {
  const hasShift = state.ShiftLeft || state.ShiftRight
  const hasCtrl = state.ControlLeft || state.ControlRight
  const hasAlt = state.AltLeft || state.AltRight
  const hasAltGr = state.AltRight || (hasCtrl && hasAlt)
  const hasCaps = state.CapsLock
  const hasFn = state.Fn || false

  if (hasFn) {
    if (hasShift && hasAltGr) return 'fn+shift+altGr'
    if (hasShift) return 'fn+shift'
    if (hasAltGr) return 'fn+altGr'
    return 'fn'
  }

  if (hasAltGr) {
    if (hasShift) return 'shift+altGr'
    return 'altGr'
  }

  if (hasCaps && hasShift) return 'shift+caps'
  if (hasCaps) return 'caps'
  if (hasShift) return 'shift'

  return 'base'
}

/**
 * Get the text to display from key legends based on current modifier state.
 * @param legends Key legend object
 * @param state Modifier key state
 * @returns Text to display
 */
export function getKeyLegendByModifierState(
  legends: Partial<Record<ModChord, string>> | undefined,
  state: VirtualKeyboardModifierState,
  options?: { hasAltGr?: boolean }
): string {
  if (!legends || typeof legends !== 'object') {
    return ''
  }

  const hasAltGr = options?.hasAltGr ?? true

  const chord = getCurrentModChord(state)

  if (legends[chord] !== undefined) {
    return legends[chord]!
  }

  const definedChords = Object.keys(legends) as ModChord[]
  const isFixedDisplayKey =
    definedChords.length === 1 && definedChords[0] === 'base'

  if (isFixedDisplayKey && legends.base) {
    return legends.base
  }

  const isAltGrChord =
    chord === 'altGr' ||
    chord === 'shift+altGr' ||
    chord === 'fn+altGr' ||
    chord === 'fn+shift+altGr'

  if (isAltGrChord) {
    if (!hasAltGr) {
      const shiftActive = state.ShiftLeft || state.ShiftRight
      const capsActive = state.CapsLock
      if (shiftActive && capsActive && legends['shift+caps']) {
        return legends['shift+caps']
      }
      if (shiftActive && legends.shift) {
        return legends.shift
      }
      if (capsActive && legends.caps) {
        return legends.caps
      }
      return legends.base || ''
    }
    return ''
  }

  const fallbackOrder: ModChord[] = ['base', 'shift', 'caps', 'fn']

  for (const fallback of fallbackOrder) {
    if (legends[fallback]) {
      return legends[fallback]!
    }
  }

  return ''
}

export function getModifierAwareKeyLabel(
  keyCode: string,
  baseLabel: string | string[],
  state: VirtualKeyboardModifierState
): string {
  if (!Array.isArray(baseLabel)) {
    return baseLabel
  }

  if (shouldAffectCharacterDisplay(keyCode, state)) {
    return baseLabel[0]
  }

  return baseLabel[1]
}

/**
 * Create a safe modifier key state (prevents undefined values).
 */
export function createSafeModifierState(
  state?: Partial<VirtualKeyboardModifierState>
): VirtualKeyboardModifierState {
  return {
    ...createInitialModifierState(),
    ...state,
  }
}

/**
 * Toggle a single modifier key state.
 */
export function toggleModifierKey(
  state: VirtualKeyboardModifierState,
  keyCode: ModifierKeyCode
): VirtualKeyboardModifierState {
  return {
    ...state,
    [keyCode]: !state[keyCode as keyof VirtualKeyboardModifierState],
  }
}

/**
 * Reset all modifier key states.
 */
export function resetAllModifierKeys(): VirtualKeyboardModifierState {
  return createInitialModifierState()
}

/**
 * Detect system modifier key state from keyboard event.
 */
export function getModifierStateFromEvent(
  event: KeyboardEvent
): Partial<VirtualKeyboardModifierState> {
  if (!event.getModifierState) {
    return {}
  }

  return {
    CapsLock: event.getModifierState('CapsLock'),
    ShiftLeft:
      event.getModifierState('Shift') &&
      event.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT,
    ShiftRight:
      event.getModifierState('Shift') &&
      event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT,
    ControlLeft:
      event.getModifierState('Control') &&
      event.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT,
    ControlRight:
      event.getModifierState('Control') &&
      event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT,
    AltLeft:
      event.getModifierState('Alt') &&
      event.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT,
    AltRight:
      event.getModifierState('Alt') &&
      event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT,
    MetaLeft:
      event.getModifierState('Meta') &&
      event.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT,
    MetaRight:
      event.getModifierState('Meta') &&
      event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT,
    NumLock: event.getModifierState('NumLock'),
    ScrollLock: event.getModifierState('ScrollLock'),
  }
}

/**
 * Compatibility alias for detecting system modifier keys.
 */
export function detectSystemModifierKeys(
  event: KeyboardEvent
): Partial<VirtualKeyboardModifierState> {
  return getModifierStateFromEvent(event)
}

/**
 * Compatibility alias (legacy naming).
 */
export function detectShiftModifierKeys(
  event: KeyboardEvent
): Partial<VirtualKeyboardModifierState> {
  return getModifierStateFromEvent(event)
}

/**
 * Virtual keyboard modifier key utility functions collection.
 */
export const VirtualKeyboardModifierUtils = {
  isModifierKey,
  isShiftKey,
  isControlKey,
  isAltKey,
  isMetaKey,
  isCapsLockKey,
  isLockKey,
  resolveModifierCode,

  createInitialModifierState,
  createSafeModifierState,
  getComboModifierStates,
  toggleModifierKey,
  resetAllModifierKeys,

  generateHidModifierMask,
  shouldAffectCharacterDisplay,
  getCurrentModChord,
  getKeyLegendByModifierState,
  getModifierAwareKeyLabel,
  detectSystemModifierKeys,
}

/**
 * Default export: complete virtual keyboard modifier key management system.
 */
export default {
  MODIFIER_KEY_CODES,
  MODIFIER_KEY_GROUPS,
  HID_MODIFIERS,

  ...VirtualKeyboardModifierUtils,

  VirtualKeyboardModifierManager,
  createVirtualKeyboardModifierManager,
}
