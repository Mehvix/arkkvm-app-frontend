import React from 'react'
import { Input } from '@/components/ui/input'
import SettingBlock, { type SettingBlockProps } from './SettingBlock'

export interface SettingInputProps extends Omit<SettingBlockProps, 'children'> {
  value: string

  onChange: (value: string) => void

  placeholder?: string

  disabled?: boolean

  type?: 'text' | 'password' | 'email' | 'number' | 'url' | 'tel'

  maxLength?: number

  readOnly?: boolean

  onBlur?: () => void

  onEnter?: () => void

  inputSize?: 'sm' | 'default'

  inputClassName?: string

  children?: React.ReactNode
}

export default function SettingInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  type = 'text',
  maxLength,
  readOnly = false,
  children,
  onBlur,
  onEnter,
  inputSize = 'sm',
  inputClassName,
  ...settingBlockProps
}: SettingInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter()
    }
  }

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
  )
}
