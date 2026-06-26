/**
 * @Purpose: 16:9 aspect ratio container component
 * @Description: Provides responsive 16:9 aspect ratio container, as large as possible while maintaining ratio
 * @version:
 * @Author: zhanglei
 * @Date: 2025-11-11 18:00:00
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-29 20:03:56
 */
import { IconLogo } from '@/assets/icons';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';

// Cross pattern background constant (defined outside component to avoid recreation on each render)
// Uses 48x48 canvas with three crosses at different positions and opacities for irregular interleaving effect
// Opacities: 0.15, 0.08, 0.05 create depth; positions staggered to avoid regular arrangement
const CROSS_PATTERN = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'56\' viewBox=\'0 0 32 56\'%3E%3Cpath opacity=\'0.12\' fill-rule=\'evenodd\' clip-rule=\'evenodd\' d=\'M4.5 0H3.5V3.5H0V4.5H3.5V8H4.5V4.5H8V3.5H4.5Z\' fill=\'%23ffffff\'/%3E%3Cpath opacity=\'0.12\' fill-rule=\'evenodd\' clip-rule=\'evenodd\' d=\'M20.5 28H19.5V31.5H16V32.5H19.5V36H20.5V32.5H24V31.5H20.5Z\' fill=\'%23ffffff\'/%3E%3C/svg%3E")';

// Background style constants
const BACKGROUND_STYLES = {
  backgroundImage: CROSS_PATTERN,
  backgroundRepeat: 'repeat' as const,
  backgroundSize: '32px 56px',
} as const;

interface AspectRatioContainerProps {
  children: React.ReactNode
  className?: string
  aspectRatio?: string // e.g. '16/9', '4/3'. When undefined, fills parent without ratio constraint.
  style?: React.CSSProperties
  /** Whether to fill parent container, default true. When false, component adapts to content */
  fillParent?: boolean
}

export const AspectRatioContainer = React.memo(function AspectRatioContainer({
  children,
  className = '',
  aspectRatio,
  style = {},
  fillParent = true,
}: AspectRatioContainerProps) {
  const containerStyle = useMemo(
    () => ({
      width: '100%',
      height: '100%',
      ...BACKGROUND_STYLES,
      ...style,
    }),
    [style]
  );

  const adaptiveStyle = useMemo(
    () => ({
      ...(aspectRatio ? { aspectRatio, maxWidth: '100%', maxHeight: '100%' } : { width: '100%', height: '100%' }),
      ...BACKGROUND_STYLES,
      ...style,
    }),
    [aspectRatio, style]
  );

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
    );
  }

  // Adaptive mode: suitable for child elements in flex layout
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
  );
});
