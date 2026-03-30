/**
 * Virtual Keyboard Component - Customizable on-screen keyboard with layout switching
 *
 * @description
 * Provides a fully functional virtual keyboard with:
 * - Multiple keyboard layouts (Windows/Mac)
 * - Modifier keys support (Shift, Ctrl, Alt, Meta, CapsLock)
 * - HID report generation for hardware emulation
 * - Customizable header slots for additional controls
 * - Key press/release event handling
 *
 * @author zhanglei
 */
import { cn } from '@/lib/utils'
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

// Internal imports
import { WindowsLayout } from './components'

// External imports
import { Button } from '@/components/ui/button'

// Local utils imports
import {
  createInitialModifierState,
  type VirtualKeyboardModifierState,
} from './utils/modifierStateManager'

import {
  getLanguageLayoutModule,
  languageLayoutMetaMap,
  languageLayoutOptions,
} from './data/language-layouts'

// Utils imports
// import { simulateKeyboardEvent } from './utils'
import { toHidReport } from './utils/hidReportGenerator'

function simulateKeyboardEvent(_keyCode: string, _options: any) {
  // Placeholder - actual implementation should be imported
}
/**
 * Virtual Keyboard Component Props
 *
 * @example
 * ```tsx
 * <VirtualKeyboard
 *   className="custom-keyboard"
 *   style={{ maxHeight: '300px', backgroundColor: '#f5f5f5' }}
 *   leftSlot={<div>Custom Status</div>}
 *   rightSlot={<button>Custom Action</button>}
 *   onKeyDown={(data) => void data}
 * />
 * ```
 */
export interface VirtualKeyboardProps extends Partial<VirtualKeyboardModifierState> {
  /** CSS class name for styling */
  className?: string
  /** Inline styles for custom styling */
  style?: React.CSSProperties
  /** Default keyboard layout */
  defaultLayout?: 'windows' | 'apple'
  /** Default language layout ID (e.g., 'cs-CZ-qwerty') */
  defaultLanguage?: string
  /** Callback when language changes */
  onLanguageChange?: (languageId: string) => void
  /** Show language switcher (default: true) */
  showLanguageSwitcher?: boolean
  /** Show header controls (default: true) */
  showControls?: boolean
  /** Show layout switcher (default: true) */
  showLayoutSwitcher?: boolean
  /** Currently pressed keys (from external events) */
  pressedKeys?: Set<string> | string[]
  /** Color for pressed key state */
  pressedKeyColor?: string
  /** Callback when a key is pressed */
  onKeyPress?: (keyCode: string, label: string) => void
  /** Callback when a key is pressed down */
  onKeyDown?: (data: { keyCode: string; label: string; hidReport: any }) => void
  /** Callback when a key is released */
  onKeyUp?: (data: { keyCode: string; label: string; hidReport: any }) => void
  /** Callback when modifier key state changes */
  onModifierKeyChange?: (keyCode: string, isActive: boolean) => void
  /** Callback when keyboard should be hidden */
  onHide?: () => void
  /** Callback when layout changes */
  onLayoutChange?: (layout: 'windows' | 'apple') => void
  /** Modifier key auto-release mode: 'auto' - release after next key press, 'manual' - manual release only (default: 'manual') */
  modifierReleaseMode?: 'auto' | 'manual'
  /** Whether to simulate keyboard events (default: true) */
  simulateEvents?: boolean
  /** Custom content slot for the left side of header controls */
  leftSlot?: React.ReactNode
  /** Custom content slot for the right side of header controls (before layout switcher) */
  rightSlot?: React.ReactNode
  /** Whether the header can be used to drag the component (for floating mode) */
  draggable?: boolean
}

/**
 * Virtual Keyboard Component
 */
const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  className = '',
  style,
  defaultLayout = 'windows',
  defaultLanguage = 'en-GB-qwerty',
  showControls = true,
  showLayoutSwitcher = true,
  showLanguageSwitcher = true,
  draggable = false,
  pressedKeys = new Set(),
  onKeyPress,
  onKeyDown,
  onKeyUp,
  onModifierKeyChange,
  onHide,
  onLayoutChange,
  onLanguageChange,
  pressedKeyColor = 'bg-red-500/15',
  modifierReleaseMode = 'auto',
  simulateEvents = true,
  leftSlot,
  rightSlot,

  CapsLock = false,
  ShiftLeft = false,
  ShiftRight = false,
  ControlLeft = false,
  ControlRight = false,
  AltLeft = false,
  AltRight = false,
  AltGr = false,
  MetaLeft = false,
  MetaRight = false,
}) => {
  const [modifierKeysState, setModifierKeysState] =
    useState<VirtualKeyboardModifierState>(createInitialModifierState())

  const modifierKeysStateRef =
    useRef<VirtualKeyboardModifierState>(modifierKeysState)

  useEffect(() => {
    modifierKeysStateRef.current = modifierKeysState
  }, [modifierKeysState])

  useEffect(() => {
    setModifierKeysState({
      CapsLock,
      ShiftLeft,
      ShiftRight,
      ControlLeft,
      ControlRight,
      AltLeft,
      AltRight,
      AltGr,
      MetaLeft,
      MetaRight,
    })
  }, [
    CapsLock,
    ShiftLeft,
    ShiftRight,
    ControlLeft,
    ControlRight,
    AltLeft,
    AltRight,
    AltGr,
    MetaLeft,
    MetaRight,
  ])

  // State management
  const [currentKeyboardLayoutMeta, setCurrentKeyboardLayoutMeta] =
    useState<any>(null)
  const [lastPressed, setLastPressed] = useState<string>('')
  const [currentLanguage, setCurrentLanguage] =
    useState<string>(defaultLanguage)

  useEffect(() => {
    setCurrentKeyboardLayoutMeta(
      getLanguageLayoutModule(defaultLanguage)?.[defaultLayout || 'windows']
    )
  }, [])
  useEffect(() => {
    if (defaultLanguage) {
      setCurrentLanguage(defaultLanguage)
    }
  }, [defaultLanguage])
  useEffect(() => {
    setCurrentKeyboardLayoutMeta(
      getLanguageLayoutModule(currentLanguage)?.[defaultLayout || 'windows']
    )
  }, [currentLanguage])

  const layout = defaultLayout

  const hasAltGr = useMemo(() => {
    const meta = languageLayoutMetaMap[currentLanguage]
    return meta?.hasAltGr ?? true
  }, [currentLanguage])

  const handleLanguageChange = useCallback(
    (languageId: string) => {
      setCurrentLanguage(languageId)
      onLanguageChange?.(languageId)
    },
    [onLanguageChange]
  )

  // Check if a key is currently pressed (from external events)

  const checkKeyPressed = useCallback(
    (keyCode: string) => {
      if (pressedKeys instanceof Set) {
        return pressedKeys.has(keyCode)
      }
      if (Array.isArray(pressedKeys)) {
        return pressedKeys.includes(keyCode)
      }
      return false
    },
    [pressedKeys]
  )

  // prettier-ignore
  const handleModifierKeyDown = useCallback(
    (keyCode: string, label?: string) => {
      const currentValue = modifierKeysStateRef.current[keyCode]
      const newValue = !currentValue

      setModifierKeysState(prev => ({
        ...prev,
        [keyCode]: newValue,
      }))

       onModifierKeyChange?.(keyCode, newValue)
    },
    [, onModifierKeyChange]
  )

  // prettier-ignore
  const handleKeyDown = useCallback(
    (keyCode: string, label?: string) => {
      setLastPressed(label)

      const currentModifierState = modifierKeysStateRef.current
      const hidReport = toHidReport(keyCode, {
        ...currentModifierState,
      })

      onKeyDown?.({
        keyCode,
        label,
        hidReport
      })
    },
    [
      onKeyDown,
      simulateEvents,
      onModifierKeyChange,
    ]
  )

  const handleKeyUp = useCallback(
    (keyCode: string, label?: string) => {
      setLastPressed('')

      onKeyUp?.({
        keyCode,
        label,
        hidReport: {
          keys: [0, 0, 0, 0, 0, 0],
          modifier: 0,
        },
      })
    },
    [onKeyUp]
  )

  return (
    <div
      className={cn('p-2 w-full select-none overflow-auto', className)}
      style={style}
    >
      {/* Header Controls */}
      {showControls && (
        <div
          className={cn(
            'flex justify-between text-xs text-gray-400 mb-2 items-center relative z-[1000] pointer-events-auto',
            draggable && 'drag-handle cursor-move'
          )}
        >
          {/* Left slot for custom content */}
          {leftSlot ? (
            <div className="flex items-center">{leftSlot}</div>
          ) : (
            <div>{lastPressed && <span>Last pressed: {lastPressed}</span>}</div>
          )}

          {/* Right controls area */}
          <div className="flex items-center gap-[10px]">
            {/* Right slot for custom content */}
            {rightSlot && <div className="flex items-center">{rightSlot}</div>}

            {/* Language switcher */}
            {showLanguageSwitcher && languageLayoutOptions.length > 0 && (
              <div className="flex items-center gap-2 no-drag">
                <select
                  value={currentLanguage}
                  onChange={e => handleLanguageChange(e.target.value)}
                  onMouseDown={e => e.stopPropagation()}
                  onTouchStart={e => e.stopPropagation()}
                  className="h-6 px-2 text-xs bg-[var(--btn-outline-bg)] border border-[var(--btn-outline-border)] rounded text-[var(--btn-outline-text)] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {languageLayoutOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.tag} - {option.nativeName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Layout switcher */}
            {showLayoutSwitcher && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">Layout:</span>
                <div>
                  <Button
                    onClick={() => onLayoutChange?.('windows')}
                    size="sm"
                    variant={layout === 'windows' ? 'primary' : 'default'}
                    className="rounded-[0]"
                  >
                    Windows
                  </Button>
                  {/* <Button
                    onClick={() => onLayoutChange?.('apple')}
                    size="sm"
                    variant={layout === 'apple' ? 'primary' : 'default'}
                    className="rounded-[0]"
                  >
                    Mac
                  </Button> */}
                </div>
              </div>
            )}
            <Button
              onClick={() => onHide?.()}
              variant="text"
              size="sm"
              className="text-xs h-6 px-2 relative z-[1001]"
            >
              Hide
            </Button>
          </div>
        </div>
      )}

      {/* Main Keyboard - Platform-specific Layout */}
      {layout === 'windows' && currentKeyboardLayoutMeta ? (
        <WindowsLayout
          layout={currentKeyboardLayoutMeta}
          checkKeyPressed={checkKeyPressed}
          handleModifierKeyDown={handleModifierKeyDown}
          handleKeyDown={handleKeyDown}
          handleKeyUp={handleKeyUp}
          pressedKeyColor={pressedKeyColor}
          {...modifierKeysState}
          CapsLock={CapsLock}
        />
      ) : (
        <></>
        // <MacLayout
        //   keyRows={keyRows}
        //   specialKeys={specialKeys}
        //   arrowKeys={arrowKeys}
        //   safeModifierKeys={safeModifierKeys}
        //   getDisplayLabel={getDisplayLabel}
        //   checkKeyPressed={checkKeyPressed}
        //   handleModifierKeyDown={handleModifierKeyDown}
        //   handleKeyDown={handleKeyDown}
        //   handleKeyUp={handleKeyUp}
        //   pressedKeyColor={pressedKeyColor}
        // />
      )}
    </div>
  )
}

export default memo(VirtualKeyboard)
