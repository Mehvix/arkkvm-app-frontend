/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-12-04 16:20:54
 */
import { Switch } from '@/components/ui/switch'
import React from 'react'
import SettingBlock, { type SettingBlockProps } from './SettingBlock'

export interface SettingSwitchProps extends Omit<
  SettingBlockProps,
  'children'
> {
  checked: boolean

  onCheckedChange: (checked: boolean) => void

  disabled?: boolean

  switchClassName?: string

  children?: React.ReactNode
}

export default function SettingSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  switchClassName,
  children,
  ...settingBlockProps
}: SettingSwitchProps) {
  return (
    <SettingBlock paddingBottom={10} {...settingBlockProps}>
      <SettingBlock.Right>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={switchClassName}
        />
      </SettingBlock.Right>
      {children && <SettingBlock.Bottom>{children}</SettingBlock.Bottom>}
    </SettingBlock>
  )
}
