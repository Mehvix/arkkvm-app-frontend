import React from 'react'
import { cn } from '@/lib/utils'
import { LED_COLORS, GLOW_ANIMATION } from '../constants'
import type { LEDIndicatorProps } from '../types'

/**
 * LED indicator component for status display
 *
 * Renders a realistic LED indicator with glow effects for active state.
 * Used primarily for keys like Caps Lock, Num Lock, etc.
 *
 * @param isActive - Whether the LED should show active state
 */
export const LEDIndicator: React.FC<LEDIndicatorProps> = ({ isActive }) => {
  const glowStyles = React.useMemo(
    () => ({
      active: {
        background: `radial-gradient(circle, ${LED_COLORS.active.primary} 0%, ${LED_COLORS.active.secondary} 100%)`,
        boxShadow: [
          `0 0 4px ${LED_COLORS.active.primary}`,
          `0 0 8px ${LED_COLORS.active.primary}`,
          `0 0 12px ${LED_COLORS.active.primary}`,
          'inset 0 1px 0 rgba(255,255,255,0.3)',
        ].join(', '),
        filter: 'brightness(1.3)',
      },
      inactive: {
        background: `radial-gradient(circle, ${LED_COLORS.inactive.primary} 0%, ${LED_COLORS.inactive.secondary} 100%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      highlight: {
        background:
          'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 60%, transparent 100%)',
      },
      glow: {
        background: `radial-gradient(circle, ${LED_COLORS.active.glow} 0%, ${LED_COLORS.active.glowSecondary} 70%, transparent 100%)`,
        animation: GLOW_ANIMATION,
      },
    }),
    []
  )

  return (
    <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full transition-all duration-300">
      {/* Outer glow ring */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={glowStyles.glow}
        />
      )}

      {/* Main LED body */}
      <div
        className={cn(
          'relative w-full h-full rounded-full transition-all duration-300',
          isActive ? 'bg-green-400' : 'bg-gray-400 dark:bg-gray-600'
        )}
        style={isActive ? glowStyles.active : glowStyles.inactive}
      >
        {/* Inner highlight */}
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-1 h-1 rounded-full transition-opacity duration-300',
            isActive ? 'opacity-90' : 'opacity-30'
          )}
          style={glowStyles.highlight}
        />
      </div>
    </div>
  )
}
