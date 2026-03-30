import { IconK, IconLogo, IconM, IconR, IconV } from '@/assets/icons'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores'
import React from 'react'

export type BrandLogoProps = {
  /** Render only the icon or the full wordmark */
  type?: 'icon' | 'full'
  /** Force light/dark colors, or detect from document root class */
  variant?: 'auto' | 'light' | 'dark'
  /** Height in pixels; width scales proportionally */
  size?: number
  /** Override main monochrome color (for text and main icon shape) */
  primaryColor?: string
  /** Accent color of the small triangle */
  accentColor?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * BrandLogo
 * - Supports icon-only or full logo (icon + wordmark)
 * - Light/Dark variants, with optional auto-detect based on `document.documentElement.classList` (expects 'light'/'dark')
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  type = 'full',
  variant = 'auto',
  size = 28,
  primaryColor,
  accentColor = '#EF4444',
  className = 'text-[26px] size-[26px]',

  style,
}) => {
  const theme = useAppStore(state => state.currentTheme)

  const mainColor = primaryColor ?? (theme === 'light' ? '#0A0A0A' : '#FFFFFF')
  const letterPx = Math.max(12, Math.round(size))

  const iconPx = size + 6 // IconLogo is bigger by 8px (~two steps)
  const iconSizeClass = `size-[${iconPx}px] text-[${iconPx}px]`
  const letterSizeClass = `size-[${letterPx}px] text-[${letterPx}px]`
  if (type === 'icon') {
    return <IconLogo className={cn(iconSizeClass, className)} />
  }

  return (
    <div
      className={cn('flex items-center justify-center  gap-[2px]')}
      style={{ color: mainColor }}
    >
      <IconLogo
        className={cn(className, iconSizeClass)}
        style={{ fontSize: iconPx, width: iconPx, height: iconPx }}
      />

      <IconR
        className={cn(className, letterSizeClass)}
        style={{ fontSize: size, width: size, height: size }}
      />
      <IconK
        className={cn(className, letterSizeClass)}
        style={{ fontSize: size, width: size, height: size }}
      />
      <IconK
        className={cn(className, letterSizeClass)}
        style={{ fontSize: size, width: size, height: size }}
      />

      <IconV
        className={cn(className, letterSizeClass)}
        style={{ fontSize: size, width: size, height: size }}
      />
      <IconM
        className={cn(className, letterSizeClass)}
        style={{ fontSize: size, width: size, height: size }}
      />
    </div>
  )
}

export default BrandLogo
