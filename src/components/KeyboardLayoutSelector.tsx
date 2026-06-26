/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-01-30 17:37:43
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-03-26 20:47:49
 */
import {
  getDefaultKeyboardLayoutByLanguage,
  languageLayoutOptions,
} from '@/components/VirtualKeyboard/data/language-layouts';
import { useAppStore } from '@/stores';
import { useEffect } from 'react';
import { Select } from './ui/select';

export interface KeyboardLayoutSelectorProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  /** Optional callback invoked after layout changes. */
  onChange?: (layoutId: string) => void
}

export function KeyboardLayoutSelector({
  className,
  size = 'xs',
  disabled = false,
  onChange,
}: KeyboardLayoutSelectorProps) {
  const keyboardLanguage = useAppStore(s => s.keyboardLanguage);
  const setKeyboardLanguage = useAppStore(s => s.setKeyboardLanguage);

  const layoutOptions = languageLayoutOptions.map(layout => ({
    value: layout.id,
    label: layout.nativeName,
  }));

  const currentLayoutName = languageLayoutOptions.find(
    layout => layout.id === keyboardLanguage
  )?.nativeName || '';

  useEffect(() => {
    if (!keyboardLanguage) {
      const defaultLayout = getDefaultKeyboardLayoutByLanguage();
      setKeyboardLanguage(defaultLayout);
    }
  }, [keyboardLanguage, setKeyboardLanguage]);

  const handleChange = (value: string | number) => {
    const layoutId = String(value);
    setKeyboardLanguage(layoutId);
    onChange?.(layoutId);
  };

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
  );
}
