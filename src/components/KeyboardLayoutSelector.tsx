/**
 * @Purpose: Keyboard layout selector - reusable component
 * @Description: Encapsulates keyboard layout selection logic with global state management and custom styling
 * @Author: zhanglei
 * @Date: 2026-01-30
 */
import {
  getDefaultKeyboardLayoutByLanguage,
  languageLayoutOptions,
} from '@/components/VirtualKeyboard/data/language-layouts'
import { useAppStore } from '@/stores'
import { useEffect } from 'react'
import { Select } from './ui/select'

export interface KeyboardLayoutSelectorProps {
  /** Custom class name */
  className?: string
  /** Select component size */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Whether to disable */
  disabled?: boolean
  /** Change callback (optional, for additional side effects) */
  onChange?: (layoutId: string) => void
}

/**
 * Keyboard layout selector component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <KeyboardLayoutSelector />
 *
 * // Custom style and size
 * <KeyboardLayoutSelector
 *   className="w-full"
 *   size="sm"
 *   onChange={(id) => logger.info('Layout changed', { id })}
 * />
 * ```
 */
export function KeyboardLayoutSelector({
  className,
  size = 'xs',
  disabled = false,
  onChange,
}: KeyboardLayoutSelectorProps) {
  const keyboardLanguage = useAppStore(s => s.keyboardLanguage)
  const setKeyboardLanguage = useAppStore(s => s.setKeyboardLanguage)

  // Generate keyboard layout options
  const layoutOptions = languageLayoutOptions.map(layout => ({
    value: layout.id,
    label: layout.nativeName,
  }))

  // Get current selected layout full name (for title attribute)
  const currentLayoutName =
    languageLayoutOptions.find(layout => layout.id === keyboardLanguage)
      ?.nativeName || ''

  // Initialize: if no layout is set, automatically set based on browser language
  useEffect(() => {
    if (!keyboardLanguage) {
      const defaultLayout = getDefaultKeyboardLayoutByLanguage()
      setKeyboardLanguage(defaultLayout)
    }
  }, [keyboardLanguage, setKeyboardLanguage])

  // Handle layout change
  const handleChange = (value: string | number) => {
    const layoutId = String(value)
    setKeyboardLanguage(layoutId)
    onChange?.(layoutId)
  }

  return (
    <div title={currentLayoutName}>
      <Select
        value={keyboardLanguage}
        onChange={handleChange}
        options={layoutOptions}
        size={size}
        disabled={disabled}
        triggerClassName={className}
      />
    </div>
  )
}
