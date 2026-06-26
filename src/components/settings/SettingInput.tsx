import { Input } from '@/components/ui/input';
import React from 'react';
import SettingBlock, { type SettingBlockProps } from './SettingBlock';

export interface SettingInputProps extends Omit<SettingBlockProps, 'children'> {
  /**
   * Current input value
   */
  value: string
  /**
   * Callback triggered when input value changes
   */
  onChange: (value: string) => void
  /**
   * Input placeholder text
   */
  placeholder?: string
  /**
   * Whether input is disabled
   */
  disabled?: boolean
  /**
   * Input type
   */
  type?: 'text' | 'password' | 'email' | 'number' | 'url' | 'tel'
  /**
   * Maximum input length
   */
  maxLength?: number
  /**
   * Whether input is read-only
   */
  readOnly?: boolean
  /**
   * Callback triggered on blur
   */
  onBlur?: () => void
  /**
   * Callback triggered when Enter is pressed
   */
  onEnter?: () => void
  /**
   * Input size
   */
  inputSize?: 'sm' | 'default'
  /**
   * Custom input className
   */
  inputClassName?: string
  /**
   * Extra bottom content (e.g. hint text)
   */
  children?: React.ReactNode
}

/**
 * Reusable settings input component.
 * Combines SettingBlock layout and Input control.
 */
export default function SettingInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  type = 'text',
  maxLength,
  readOnly = false,
  onBlur,
  onEnter,
  inputSize = 'sm',
  inputClassName,
  ...settingBlockProps
}: SettingInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter();
    }
  };

  return (
    <SettingBlock {...settingBlockProps}>
      <SettingBlock.Bottom>
        <Input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          readOnly={readOnly}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className={'text-[var(--text-color)] ' + inputClassName || 'w-48'}
          size={inputSize}
        />
      </SettingBlock.Bottom>
    </SettingBlock>
  );
}
