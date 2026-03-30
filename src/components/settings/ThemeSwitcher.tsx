/**
 * @Purpose: Theme switcher component
 * @Description: Provides theme switching functionality with Zustand state management
 * @version: 1.0.0
 * @Author: zhanglei
 * @Date: 2025-07-17 15:43:00
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-11 20:48:24
 */
import { useAppStore } from '@/stores'
import { createLogger } from '@/utils/logger'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '../ui/select'

const logger = createLogger('ThemeSwitcher')

interface ThemeSwitcherProps {
  className?: string
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = memo(
  ({ className }) => {
    const { t } = useTranslation()
    const currentTheme = useAppStore(state => state.currentTheme)
    const setTheme = useAppStore(state => state.setTheme)
    const themeOptions = [
      { value: 'dark', label: t('theme.dark') },
      { value: 'light', label: t('theme.light') },
    ]
    const handleThemeChange = (value: string) => {
      logger.info('Theme change requested', { theme: value })

      localStorage.setItem('ui-theme', value)
      setTheme(value)
    }
    return (
      <Select
        value={currentTheme}
        onChange={handleThemeChange}
        options={themeOptions}
        size="mini"
      />
    )
  }
)
