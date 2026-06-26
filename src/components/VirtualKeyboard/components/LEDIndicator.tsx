import { cn } from '@/lib/utils';
import React from 'react';
import type { LEDIndicatorProps } from '../types';

/**
 * LED indicator component for status display
 *
 * Renders a realistic LED indicator with glow effects for active state.
 * Used primarily for keys like Caps Lock, Num Lock, etc.
 *
 * @param isActive - Whether the LED should show active state
 */
export const LEDIndicator: React.FC<LEDIndicatorProps> = ({ isActive }) => {
  return (
    <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full transition-all duration-300">
      {/* Outer glow ring */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            '--glow-color': 'rgba(74, 222, 128, 0.5)',
            boxShadow: '0 0 8px var(--glow-color), 0 0 16px var(--glow-color)'
          } as React.CSSProperties}
        />
      )}

      {/* Main LED body */}
      <div
        className={cn(
          'relative w-full h-full rounded-full transition-all duration-300',
          isActive ? 'bg-green-400' : 'bg-gray-400 dark:bg-gray-600'
        )}
        style={{
          '--led-shadow': isActive ? '0 0 6px rgba(74, 222, 128, 0.8), 0 0 12px rgba(74, 222, 128, 0.4)' : '0 0 3px rgba(156, 163, 175, 0.5)',
          boxShadow: 'var(--led-shadow)'
        } as React.CSSProperties}
      >
        {/* Inner highlight */}
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-1 h-1 rounded-full transition-opacity duration-300',
            isActive ? 'opacity-90' : 'opacity-30'
          )}
          style={{
            '--highlight-opacity': isActive ? '0.9' : '0.3',
            opacity: 'var(--highlight-opacity)'
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
};
