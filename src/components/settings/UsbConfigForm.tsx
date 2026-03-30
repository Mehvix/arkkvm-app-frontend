import React from 'react'
import SettingInput from './SettingInput'
import { USBConfig } from './SettingHardware'

export interface UsbConfigFormProps {
  value: USBConfig

  onChange: (config: USBConfig) => void

  disabled?: boolean

  readOnly?: boolean

  inputSize?: 'sm' | 'default'

  titleSize?: string | number

  contentSize?: string | number

  className?: string

  onBlur?: (field: keyof USBConfig, value: string) => void

  onEnter?: (field: keyof USBConfig, value: string) => void
}

export default function UsbConfigForm({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  inputSize = 'sm',
  titleSize = 12,
  contentSize = 10,
  className,
  onBlur,
  onEnter,
}: UsbConfigFormProps) {
  const handleFieldChange = (field: keyof USBConfig, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue,
    })
  }

  const handleFieldBlur = (field: keyof USBConfig) => {
    onBlur?.(field, value[field])
  }

  const handleFieldEnter = (field: keyof USBConfig) => {
    onEnter?.(field, value[field])
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-[16px]">
        <SettingInput
          title="Vendor ID"
          value={value.vendor_id}
          onChange={val => handleFieldChange('vendor_id', val)}
          onBlur={() => handleFieldBlur('vendor_id')}
          onEnter={() => handleFieldEnter('vendor_id')}
          placeholder="0x413c"
          disabled={disabled}
          readOnly={readOnly}
          inputSize={inputSize}
          titleSize={titleSize}
          contentSize={contentSize}
          inputClassName="w-full"
          paddingBottom={2}
        />
        <SettingInput
          title="Product ID"
          value={value.product_id}
          onChange={val => handleFieldChange('product_id', val)}
          onBlur={() => handleFieldBlur('product_id')}
          onEnter={() => handleFieldEnter('product_id')}
          placeholder="0x2011"
          disabled={disabled}
          readOnly={readOnly}
          inputSize={inputSize}
          titleSize={titleSize}
          contentSize={contentSize}
          inputClassName="w-full"
          paddingBottom={2}
        />
        <SettingInput
          title="Serial Number"
          value={value.serial_number}
          onChange={val => handleFieldChange('serial_number', val)}
          onBlur={() => handleFieldBlur('serial_number')}
          onEnter={() => handleFieldEnter('serial_number')}
          placeholder="1&e90ad4c&0&1"
          disabled={disabled}
          readOnly={readOnly}
          inputSize={inputSize}
          titleSize={titleSize}
          contentSize={contentSize}
          inputClassName="w-full"
          paddingBottom={2}
        />
        <SettingInput
          title="Manufacturer"
          value={value.manufacturer}
          onChange={val => handleFieldChange('manufacturer', val)}
          onBlur={() => handleFieldBlur('manufacturer')}
          onEnter={() => handleFieldEnter('manufacturer')}
          placeholder="Dell Inc."
          disabled={disabled}
          readOnly={readOnly}
          inputSize={inputSize}
          titleSize={titleSize}
          contentSize={contentSize}
          inputClassName="w-full"
          paddingBottom={2}
        />
        <SettingInput
          title="Product Name"
          value={value.product}
          onChange={val => handleFieldChange('product', val)}
          onBlur={() => handleFieldBlur('product')}
          onEnter={() => handleFieldEnter('product')}
          placeholder="Multimedia Pro Keyboard"
          disabled={disabled}
          readOnly={readOnly}
          inputSize={inputSize}
          titleSize={titleSize}
          contentSize={contentSize}
          inputClassName="w-full"
          paddingBottom={2}
        />
      </div>
    </div>
  )
}
