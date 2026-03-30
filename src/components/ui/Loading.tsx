import { cn } from '@/lib/utils'
import React from 'react'

export type LoadingType = 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring'
export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
export type LoadingColor =
  | 'primary'
  | 'secondary'
  | 'white'
  | 'blue'
  | 'green'
  | 'red'
  | 'yellow'
  | string

interface LoadingProps {
  type?: LoadingType

  size?: LoadingSize

  color?: LoadingColor

  className?: string

  speed?: number
}

const sizeMap = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
}

const colorMap = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  white: 'border-white',
  blue: 'border-blue-500',
  green: 'border-green-500',
  red: 'border-red-500',
  yellow: 'border-yellow-500',
}

const getSize = (size: LoadingSize): number => {
  return typeof size === 'number' ? size : sizeMap[size]
}

const getColorClass = (color: LoadingColor, opacity = '30'): string => {
  if (color in colorMap) {
    return colorMap[color as keyof typeof colorMap]
  }

  return ''
}

const getCustomColorStyle = (color: LoadingColor, opacity = 0.3) => {
  if (!(color in colorMap)) {
    return {
      borderColor: `${color}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0')}`,
      borderTopColor: color,
    }
  }
  return {}
}

export const Loading: React.FC<LoadingProps> = ({
  type = 'spinner',
  size = 'md',
  color = 'primary',
  className = '',
  speed = 1,
}) => {
  const actualSize = getSize(size)
  const borderWidth = Math.max(2, Math.round(actualSize / 8))

  const animationStyle = {
    animationDuration: `${speed}s`,
  }

  if (type === 'spinner') {
    const colorClass = getColorClass(color)
    const topColorClass = getColorClass(color).replace('/30', '')
    const customStyle = getCustomColorStyle(color)

    return (
      <div
        className={cn(
          'animate-spin rounded-full',
          colorClass && `border-${color}/30 ${topColorClass}`,
          className
        )}
        style={{
          width: actualSize,
          height: actualSize,
          borderWidth,
          ...customStyle,
          ...animationStyle,
        }}
      />
    )
  }

  if (type === 'pulse') {
    const colorClass = getColorClass(color).replace('border-', 'bg-')
    const customStyle = color in colorMap ? {} : { backgroundColor: color }

    return (
      <div
        className={cn('animate-pulse rounded-full', colorClass, className)}
        style={{
          width: actualSize,
          height: actualSize,
          ...customStyle,
          ...animationStyle,
        }}
      />
    )
  }

  if (type === 'dots') {
    const dotSize = actualSize / 4
    const colorClass = getColorClass(color).replace('border-', 'bg-')
    const customStyle = color in colorMap ? {} : { backgroundColor: color }

    return (
      <div className={cn('flex items-center gap-1', className)}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={cn('animate-bounce rounded-full', colorClass)}
            style={{
              width: dotSize,
              height: dotSize,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${speed}s`,
              ...customStyle,
            }}
          />
        ))}
      </div>
    )
  }

  if (type === 'bars') {
    const barWidth = actualSize / 6
    const barHeight = actualSize
    const colorClass = getColorClass(color).replace('border-', 'bg-')
    const customStyle = color in colorMap ? {} : { backgroundColor: color }

    return (
      <div className={cn('flex items-end gap-1', className)}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn('animate-pulse', colorClass)}
            style={{
              width: barWidth,
              height: barHeight * (0.4 + (i % 2) * 0.6),
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${speed}s`,
              ...customStyle,
            }}
          />
        ))}
      </div>
    )
  }

  if (type === 'ring') {
    const colorClass = getColorClass(color)
    const customStyle = getCustomColorStyle(color, 0.2)

    return (
      <div
        className="relative"
        style={{ width: actualSize, height: actualSize }}
      >
        <div
          className={cn(
            'absolute inset-0 animate-spin rounded-full',
            colorClass && `border-${color}/20`,
            className
          )}
          style={{
            borderWidth,
            ...customStyle,
            ...animationStyle,
          }}
        />
        <div
          className={cn(
            'absolute inset-0 animate-spin rounded-full border-transparent',
            colorClass && getColorClass(color).replace('/30', '')
          )}
          style={{
            borderWidth,
            borderTopColor: color in colorMap ? undefined : color,
            ...animationStyle,
          }}
        />
      </div>
    )
  }

  return null
}

export const SpinnerLoading = (props: Omit<LoadingProps, 'type'>) => (
  <Loading type="spinner" {...props} />
)

export const DotsLoading = (props: Omit<LoadingProps, 'type'>) => (
  <Loading type="dots" {...props} />
)

export const PulseLoading = (props: Omit<LoadingProps, 'type'>) => (
  <Loading type="pulse" {...props} />
)

export const BarsLoading = (props: Omit<LoadingProps, 'type'>) => (
  <Loading type="bars" {...props} />
)

export const RingLoading = (props: Omit<LoadingProps, 'type'>) => (
  <Loading type="ring" {...props} />
)
