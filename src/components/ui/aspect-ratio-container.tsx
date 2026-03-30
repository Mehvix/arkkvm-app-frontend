import { IconLogo } from '@/assets/icons'
import { cn } from '@/lib/utils'
import React, { useMemo } from 'react'

const CROSS_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath opacity='0.15' fill-rule='evenodd' clip-rule='evenodd' d='M7.2 4.8V0H4.8V4.8H0V7.2H4.8V12H7.2V7.2H12V4.8H7.2Z' fill='%23999999'/%3E%3Cpath opacity='0.08' fill-rule='evenodd' clip-rule='evenodd' d='M31.2 20.8V16H28.8V20.8H24V23.2H28.8V28H31.2V23.2H36V20.8H31.2Z' fill='%23999999'/%3E%3Cpath opacity='0.05' fill-rule='evenodd' clip-rule='evenodd' d='M43.2 36.8V32H40.8V36.8H36V39.2H40.8V44H43.2V39.2H48V36.8H43.2Z' fill='%23999999'/%3E%3C/svg%3E")`

const BACKGROUND_STYLES = {
  backgroundImage: CROSS_PATTERN,
  backgroundRepeat: 'repeat' as const,
  backgroundSize: '48px 48px',
} as const

interface AspectRatioContainerProps {
  children: React.ReactNode
  className?: string
  aspectRatio?: string
  style?: React.CSSProperties

  fillParent?: boolean
}

export const AspectRatioContainer = React.memo(function AspectRatioContainer({
  children,
  className = '',
  aspectRatio = '16/9',
  style = {},
  fillParent = true,
}: AspectRatioContainerProps) {
  const { widthRatio, heightRatio } = useMemo(() => {
    const [width, height] = aspectRatio.split('/').map(Number)
    return {
      widthRatio: width / height, // 16/9 = 1.777...
      heightRatio: height / width, // 9/16 = 0.5625
    }
  }, [aspectRatio])

  const containerStyle = useMemo(
    () => ({
      width: '100%',
      height: '100%',
      ...BACKGROUND_STYLES,
      ...style,
    }),
    [style]
  )

  const adaptiveStyle = useMemo(
    () => ({
      aspectRatio,
      maxWidth: '100%',
      maxHeight: '100%',
      ...BACKGROUND_STYLES,
      ...style,
    }),
    [aspectRatio, style]
  )

  if (fillParent) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div
          className={cn(
            'flex items-center justify-center relative overflow-hidden',
            className
          )}
          style={containerStyle}
        >
          <IconLogo
            className="absolute bottom-4 right-[-30%] opacity-10 size-[80%] pointer-events-none"
            size={800}
          />
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center  rounded-[var(--radius)]',
        className
      )}
      style={adaptiveStyle}
    >
      {children}
    </div>
  )
})
