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
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Internal imports
import { KeyboardLanguageSelect, MacLayout, WindowsLayout } from './components';

// External imports
import { Button } from '@/components/ui/button';

// Local utils imports
import {
  createInitialModifierState,
  isModifierKey,
  type VirtualKeyboardModifierState,
} from './utils/modifierStateManager';
import type { KeyboardLayout, KeyDefinition } from './data/keyboard-types';

import { getLanguageLayoutModule, languageLayoutOptions } from './data/language-layouts';

// Local i18n (self-contained, no external i18n framework required)
import {
  I18nProvider,
  createT,
  getTranslations,
  type VirtualKeyboardLocale,
  type VirtualKeyboardTranslations,
} from './i18n';

// Utils imports
// import { simulateKeyboardEvent } from './utils'
import { externalModifierMask, toHidReport, type HidReport } from './utils/hidReportGenerator';
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
  /** Whether to listen to physical keyboard events and highlight pressed keys (default: true) */
  syncPhysicalKeys?: boolean;
  /** CSS class name for styling */
  className?: string;
  /** Inline styles for custom styling */
  style?: React.CSSProperties;
  /** Default keyboard layout */
  defaultLayout?: 'windows' | 'mac';
  /** Default language layout ID (e.g., 'cs-CZ-qwerty') */
  defaultLanguage?: string;
  /** Callback when language changes */
  onLanguageChange?: (languageId: string) => void;
  /** Show language switcher (default: true) */
  showLanguageSwitcher?: boolean;
  /** Show header controls (default: true) */
  showControls?: boolean;
  /** Show layout switcher (default: true) */
  showLayoutSwitcher?: boolean;
  /** Currently pressed keys (from external events) */
  pressedKeys?: Set<string> | string[];
  /** Color for pressed key state */
  pressedKeyColor?: string;
  /** Callback when a key is pressed */
  onKeyPress?: (keyCode: string, label: string) => void;
  /** Callback when a key is pressed down */
  onKeyDown?: (data: { keyCode: string; label: string; hidReport: HidReport[] }) => void;
  /** Callback when a key is released */
  onKeyUp?: (data: { keyCode: string; label: string; hidReport: HidReport }) => void;
  /** Callback when modifier key state changes */
  onModifierKeyChange?: (keyCode: string, isActive: boolean) => void;
  /** Callback when keyboard should be hidden */
  onHide?: () => void;
  /** Callback when layout changes */
  _onLayoutChange?: (layout: 'windows' | 'mac') => void;
  /** Modifier key auto-release mode: 'auto' - release after next key press, 'manual' - manual release only (default: 'manual') */
  modifierReleaseMode?: 'auto' | 'manual';
  /** Whether to simulate keyboard events (default: true) */
  simulateEvents?: boolean;
  /** Custom content slot for the left side of header controls */
  leftSlot?: React.ReactNode;
  /** Custom content slot for the right side of header controls (before layout switcher) */
  rightSlot?: React.ReactNode;
  /** Whether the header can be used to drag the component (for floating mode) */
  draggable?: boolean;
  /** UI locale, e.g. 'en' or 'zh' (default: 'en') */
  locale?: VirtualKeyboardLocale;
  /** Partial translations to override bundled strings */
  translations?: Partial<VirtualKeyboardTranslations>;
}

/**
 * Virtual Keyboard Component
 *
 * Self-contained i18n is managed internally; the effective UI locale follows
 * the keyboard layout language by default and can be overridden via the
 * `locale` prop.
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
  onKeyDown,
  onKeyUp,
  onModifierKeyChange,
  onHide,
  onLanguageChange,
  _onLayoutChange,
  pressedKeyColor = 'bg-red-500/15',
  modifierReleaseMode = 'auto',
  simulateEvents = true,
  syncPhysicalKeys = true,
  leftSlot,
  rightSlot,
  locale,
  translations,
  // Expanded modifier key booleans
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
  const [modifierKeysState, setModifierKeysState] = useState<VirtualKeyboardModifierState>(
    createInitialModifierState()
  );

  // Use ref to store latest modifier key state to avoid useCallback closure issues
  const modifierKeysStateRef = useRef<VirtualKeyboardModifierState>(modifierKeysState);

  // Sync state to ref
  useEffect(() => {
    modifierKeysStateRef.current = modifierKeysState;
  }, [modifierKeysState]);

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
    });
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
  ]);

  // Internal pressed keys state (from physical keyboard)
  const internalPressedKeysRef = useRef<Set<string>>(new Set());
  const [internalPressedKeys, setInternalPressedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!syncPhysicalKeys) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      )
        return;

      internalPressedKeysRef.current.add(event.code);
      setInternalPressedKeys(new Set(internalPressedKeysRef.current));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      )
        return;

      internalPressedKeysRef.current.delete(event.code);
      setInternalPressedKeys(new Set(internalPressedKeysRef.current));
    };

    const clearPressedKeys = () => {
      internalPressedKeysRef.current.clear();
      setInternalPressedKeys(new Set());
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    window.addEventListener('blur', clearPressedKeys);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      window.removeEventListener('blur', clearPressedKeys);
      internalPressedKeysRef.current.clear();
    };
  }, [syncPhysicalKeys]);

  // State management
  const [currentKeyboardLayoutMeta, setCurrentKeyboardLayoutMeta] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [lastPressed, setLastPressed] = useState<string>('');
  const [currentLanguage, setCurrentLanguage] = useState<string>(defaultLanguage);

  // Effective UI locale follows the keyboard layout language by default,
  // but can be overridden via the `locale` prop.
  const effectiveLocale = locale ?? currentLanguage.split('-')[0];
  const t = useMemo(
    () => createT({ ...getTranslations(effectiveLocale), ...translations }),
    [effectiveLocale, translations]
  );
  const globalTargetSystem = useAppStore(s => s.keyboardTargetSystem);
  const setKeyboardTargetSystem = useAppStore.getState().setKeyboardTargetSystem;
  const [currentLayout, setCurrentLayout] = useState<'windows' | 'mac'>(
    globalTargetSystem || defaultLayout
  );
  // Initialize layout
  useEffect(() => {
    setCurrentKeyboardLayoutMeta(getLanguageLayoutModule(defaultLanguage)?.[currentLayout]);
  }, []);
  useEffect(() => {
    if (defaultLanguage) {
      setCurrentLanguage(defaultLanguage);
    }
  }, [defaultLanguage]);
  useEffect(() => {
    const module = getLanguageLayoutModule(currentLanguage);
    // Auto-fallback to 'windows' if current layout is not available for this language
    if (currentLayout === 'mac' && !module?.mac) {
      setCurrentLayout('windows');
      return;
    }
    setCurrentKeyboardLayoutMeta(module?.[currentLayout]);
  }, [currentLanguage, currentLayout]);

  // Handle layout change
  const handleLayoutChange = useCallback(
    (newLayout: 'windows' | 'mac') => {
      setCurrentLayout(newLayout);
      setKeyboardTargetSystem(newLayout);
      _onLayoutChange?.(newLayout);
    },
    [_onLayoutChange, setKeyboardTargetSystem]
  );

  // Handle language switch
  const handleLanguageChange = useCallback(
    (languageId: string) => {
      setCurrentLanguage(languageId);
      onLanguageChange?.(languageId);
    },
    [onLanguageChange]
  );

  // Check if a key is currently pressed (from external events or internal physical keyboard sync)
  // Use useCallback to cache, avoid frequent recreation and calculation
  const checkKeyPressed = useCallback(
    (keyCode: string) => {
      if (internalPressedKeys.has(keyCode)) return true;
      if (pressedKeys instanceof Set) {
        return pressedKeys.has(keyCode);
      }
      if (Array.isArray(pressedKeys)) {
        return pressedKeys.includes(keyCode);
      }
      return false;
    },
    [pressedKeys, internalPressedKeys]
  );

  // Modifier key events - performance optimized
  // prettier-ignore
  const handleModifierKeyDown = useCallback(
    (keyCode: string, _label?: string) => {
      const currentValue = modifierKeysStateRef.current[keyCode];
      const newValue = !currentValue;

      setModifierKeysState(prev => ({
        ...prev,
        [keyCode]: newValue,
      }));

       onModifierKeyChange?.(keyCode, newValue);
    },
    [, onModifierKeyChange]
  );

  // prettier-ignore
  const handleKeyDown = useCallback(
    (keyCode: string, label = '') => {
      setLastPressed(label);
      // Use ref to get latest modifier key state to avoid closure issues
      const currentModifierState = modifierKeysStateRef.current;
      const hidReport = toHidReport(keyCode, {
        ...currentModifierState,
      });

      onKeyDown?.({
        keyCode,
        label,
        hidReport
      });
    },
    [
      onKeyDown,
      simulateEvents,
      onModifierKeyChange,
    ]
  );

  const handleKeyUp = useCallback(
    (keyCode: string, label = '') => {
      let modifier = 0;
      if (modifierReleaseMode === 'manual' && !isModifierKey(keyCode)) {
        const currentModifierState = modifierKeysStateRef.current;
        modifier = externalModifierMask(currentModifierState);
      }
      setLastPressed('');
      onKeyUp?.({
        keyCode,
        label,
        hidReport: {
          keys: [0, 0, 0, 0, 0, 0],
          modifier,
        },
      });
    },
    [onKeyUp, modifierReleaseMode]
  );

  return (
    <I18nProvider locale={effectiveLocale} translations={translations}>
      <div
        className={cn('p-2 w-full select-none overflow-y-auto  overflow-x-hidden', className)}
        style={style}
        data-kvm-ignore="true"
      >
        {/* Header Controls */}
        {showControls && (
          <div
            className={cn(
              ' flex justify-between text-sm text-gray-400 mb-2 items-center relative z-[1000] pointer-events-auto',
              draggable && 'drag-handle cursor-move'
            )}
          >
            {/* Left slot for custom content */}
            {leftSlot ? (
              <div className="hidden md:flex items-center">{leftSlot}</div>
            ) : (
              <div>{lastPressed && <span>{t('lastPressed', { key: lastPressed })}</span>}</div>
            )}

            {/* Right controls area */}
            <div className="flex-1 md:flex-none justify-between flex  items-center gap-[10px] overflow:hidden">
              {/* Right slot for custom content */}
              {rightSlot && <div className="flex items-center">{rightSlot}</div>}

              {/* Layout switcher */}
              {showLayoutSwitcher &&
                (() => {
                  const currentLanguageOption = languageLayoutOptions.find(
                    option => option.id === currentLanguage
                  );
                  const hasMacLayout = currentLanguageOption?.hasMac;

                  if (!hasMacLayout) return null;

                  return (
                    <div className="items-center gap-2 hidden md:flex">
                      <span className="hidden sm:inline">{t('layout')}</span>
                      <div>
                        <Button
                          onClick={() => handleLayoutChange('windows')}
                          size="sm"
                          variant={currentLayout === 'windows' ? 'primary' : 'default'}
                          className="rounded-none"
                        >
                          {t('windows')}
                        </Button>
                        <Button
                          onClick={() => handleLayoutChange('mac')}
                          size="sm"
                          variant={currentLayout === 'mac' ? 'primary' : 'default'}
                          className="rounded-none"
                        >
                          {t('mac')}
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              {/* Language switcher */}
              {showLanguageSwitcher && languageLayoutOptions.length > 0 && (
                <div
                  className="flex items-center gap-2 no-drag"
                  onMouseDown={e => e.stopPropagation()}
                  onTouchStart={e => e.stopPropagation()}
                >
                  <KeyboardLanguageSelect
                    value={currentLanguage}
                    onChange={handleLanguageChange}
                  />
                </div>
              )}
              <Button
                onClick={() => onHide?.()}
                // variant="text"
                size="sm"
                className="text-sm h-6 px-2 relative z-1001"
              >
                {t('hide')}
              </Button>
            </div>
          </div>
        )}

        {/* Main Keyboard - Platform-specific Layout */}
        {currentLayout === 'windows' && currentKeyboardLayoutMeta ? (
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
        ) : currentLayout === 'mac' ? (
          <MacLayout
            layout={currentKeyboardLayoutMeta}
            checkKeyPressed={checkKeyPressed}
            handleModifierKeyDown={handleModifierKeyDown}
            handleKeyDown={handleKeyDown}
            handleKeyUp={handleKeyUp}
            pressedKeyColor={pressedKeyColor}
            {...modifierKeysState}
            CapsLock={CapsLock}
            pressedKeyColor={pressedKeyColor}
          />
        ) : (
          <></>
        )}
      </div>
    </I18nProvider>
  );
};

// Wrap with React.memo to avoid unnecessary re-renders when parent state changes
export default memo(VirtualKeyboard);
