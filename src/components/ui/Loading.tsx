/**
 * @Purpose: Configurable Loading component
 * @Description: Loading indicator supporting multiple styles, colors and sizes
 * @Author: zhanglei
 * @Date: 2025-11-11 21:22:00
 */
import { cn } from '@/lib/utils';
import React from 'react';

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
  /** Loading type */
  type?: LoadingType
  /** Size */
  size?: LoadingSize
  /** Color */
  color?: LoadingColor
  /** Custom class name */
  className?: string
  /** Animation speed (seconds) */
  speed?: number
}

// Size mapping
const sizeMap = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

// Color mapping
const colorMap = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  white: 'border-white',
  blue: 'border-blue-500',
  green: 'border-green-500',
  red: 'border-red-500',
  yellow: 'border-yellow-500',
};

// Get actual size
const getSize = (size: LoadingSize): number => {
  return typeof size === 'number' ? size : sizeMap[size];
};

// Get color class name
const getColorClass = (color: LoadingColor, _opacity = '30'): string => {
  if (color in colorMap) {
    return colorMap[color as keyof typeof colorMap];
  }
  // For custom colors, return empty string and use style instead
  return '';
};

// Get custom color style
const getCustomColorStyle = (color: LoadingColor, opacity = 0.3) => {
  if (!(color in colorMap)) {
    return {
      borderColor: `${color}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0')}`,
      borderTopColor: color,
    };
  }
  return {};
};

export const Loading: React.FC<LoadingProps> = ({
  type = 'spinner',
  size = 'md',
  color = 'primary',
  className = '',
  speed = 1,
}) => {
  const actualSize = getSize(size);
  const borderWidth = Math.max(2, Math.round(actualSize / 8));

  const animationStyle = {
    animationDuration: `${speed}s`,
  };

  // Spinner type
  if (type === 'spinner') {
    const colorClass = getColorClass(color);
    const topColorClass = getColorClass(color).replace('/30', '');
    const customStyle = getCustomColorStyle(color);

    return (
      <div
        className={cn(
          'animate-spin rounded-full border loading-spinner',
          colorClass && `border-${color}/30 ${topColorClass}`,
          className
        )}
        style={{
          '--loading-size': `${actualSize}px`,
          '--loading-border-width': `${borderWidth}px`,
          '--loading-animation-duration': `${speed}s`,
          ...customStyle,
          ...animationStyle,
        } as React.CSSProperties}
      />
    );
  }

  // Pulse type
  if (type === 'pulse') {
    const colorClass = getColorClass(color).replace('border-', 'bg-');
    const customStyle = color in colorMap ? {} : { backgroundColor: color };

    return (
      <div
        className={cn(
          'animate-pulse rounded-full loading-spinner',
          colorClass,
          className
        )}
        style={{
          '--loading-size': actualSize,
          '--loading-animation-duration': `${speed}s`,
          ...customStyle,
          ...animationStyle,
        } as React.CSSProperties}
      />
    );
  }

  // Dots type
  if (type === 'dots') {
    const dotSize = actualSize / 4;
    const colorClass = getColorClass(color).replace('border-', 'bg-');
    const customStyle = color in colorMap ? {} : { backgroundColor: color };

    return (
      <div className={cn('flex items-center gap-1', className)}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={cn(
              'animate-bounce rounded-full loading-dot',
              colorClass,
              i === 0 ? 'animate-delay-0-0s' : i === 1 ? 'animate-delay-0-1s' : 'animate-delay-0-2s'
            )}
            style={{
              '--loading-dot-size': dotSize,
              '--loading-dot-animation-duration': `${speed}s`,
              ...customStyle,
            } as React.CSSProperties}
          />
        ))}
      </div>
    );
  }

  // Bars type
  if (type === 'bars') {
    const barWidth = actualSize / 6;
    const barHeight = actualSize;
    const colorClass = getColorClass(color).replace('border-', 'bg-');
    const customStyle = color in colorMap ? {} : { backgroundColor: color };

    return (
      <div className={cn('flex items-end gap-1', className)}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'animate-pulse loading-bar',
              colorClass,
              i === 0 ? 'animate-delay-0-0s' : i === 1 ? 'animate-delay-0-1s' : i === 2 ? 'animate-delay-0-2s' : 'animate-delay-0-1s'
            )}
            style={{
              '--loading-bar-width': barWidth,
              '--loading-bar-height': `${barHeight * (0.4 + (i % 2) * 0.6)}px`,
              '--loading-bar-animation-duration': `${speed}s`,
              ...customStyle,
            } as React.CSSProperties}
          />
        ))}
      </div>
    );
  }

  // Ring type
  if (type === 'ring') {
    const colorClass = getColorClass(color);
    const customStyle = getCustomColorStyle(color, 0.2);

    return (
      <div
        className="relative loading-spinner"
        style={{
          '--loading-size': actualSize,
          '--loading-border-width': borderWidth,
          '--loading-animation-duration': `${speed}s`,
        } as React.CSSProperties}
      >
        <div
          className={cn(
            'absolute inset-0 animate-spin rounded-full',
            colorClass && `border-${color}/20`,
            className
          )}
          style={{
            ...customStyle,
            ...animationStyle,
          }}
        />
        <div
          className={cn(
            'absolute inset-0 animate-spin rounded-full',
            colorClass && `border-t-${color}`,
            className
          )}
          style={{
            borderTopColor: color in colorMap ? undefined : color,
            ...animationStyle,
          }}
        />
      </div>
    );
  }

  return null;
};

// Preset components
export const SpinnerLoading = (props: Omit<LoadingProps, 'type'>) => (
  <Loading type="spinner" {...props} />
);

export const DotsLoading = (props: Omit<LoadingProps, 'type'>) => (
  <Loading type="dots" {...props} />
);

export const PulseLoading = (props: Omit<LoadingProps, 'type'>) => (
  <Loading type="pulse" {...props} />
);

export const BarsLoading = (props: Omit<LoadingProps, 'type'>) => (
  <Loading type="bars" {...props} />
);

export const RingLoading = (props: Omit<LoadingProps, 'type'>) => (
  <Loading type="ring" {...props} />
);
