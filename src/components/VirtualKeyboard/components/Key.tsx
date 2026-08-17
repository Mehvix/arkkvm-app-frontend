import { cn } from '@/lib/utils';
import React from 'react';

// Internal imports
import { KeyLabel, LEDIndicator } from '.';
import { useGlobalEventCleanup } from '../hooks';
import type { KeyProps } from '../types';
import { generateKeyStyles } from '../utils';

/**
 * Virtual keyboard key component
 *
 * Renders a customizable keyboard key with support for:
 * - Single or dual-state labels
 * - LED status indicators (for keys like Caps Lock)
 * - Flexible sizing and styling
 * - Accessibility features
 */
const Key: React.FC<KeyProps> = React.memo(
  ({
    keyCode,
    label,
    keyDef,
    getDisplayLabel,
    width = 'auto',
    className = '',
    style,
    onKeyPress,
    onKeyDown,
    onKeyUp,
    compact = false,
    heightClass,
    showStatusIndicator = false,
    isActive = false,
    sendValue,
    title,
    disabled = false,
    isPressed = false,
    pressedColor = 'bg-blue-500',
  }) => {
    // If keyDef and getDisplayLabel are passed, calculate label inside component
    // Otherwise use passed label (backward compatible)
    const computedLabel = React.useMemo(() => {
      if (keyDef && getDisplayLabel) {
        return getDisplayLabel(keyDef);
      }
      return label;
    }, [keyDef, getDisplayLabel, label]);

    // Computed properties
    const isFixedWidth = width !== 'auto' && Boolean(width);
    const heightClass_ = heightClass || (compact ? 'h-5' : 'h-10');
    const isStringLabel = typeof computedLabel === 'string';
    const isArrayLabel = Array.isArray(computedLabel);

    // Determine the value to send on key press
    const computedSendLabel = React.useMemo(() => {
      if (typeof sendValue === 'string') return sendValue;
      if (isStringLabel) return computedLabel as string;
      if (isArrayLabel) return String((computedLabel as string[])[0] ?? '');
      return '';
    }, [sendValue, isStringLabel, isArrayLabel, computedLabel]);

    // Generate tooltip text
    const tooltipText = React.useMemo(() => {
      if (typeof title === 'string') return title;
      if (isStringLabel) return computedLabel as string;
      if (isArrayLabel) {
        const [primary, secondary] = computedLabel as string[];
        return `${primary} / ${secondary ?? ''}`;
      }
      return computedSendLabel || keyCode;
    }, [title, isStringLabel, isArrayLabel, label, computedSendLabel, keyCode]);

    // State for tracking internal press state
    const [internalPressed, setInternalPressed] = React.useState(false);
    const pressedRef = React.useRef(false);

    // Global event cleanup to handle releases outside component
    useGlobalEventCleanup(internalPressed, () => {
      if (pressedRef.current) {
        pressedRef.current = false;
        setInternalPressed(false);
        onKeyUp?.(keyCode, computedSendLabel);
      }
    });

    // Event handlers with mobile support
    const handleKeyDown = React.useCallback(() => {
      if (disabled || pressedRef.current) return;

      pressedRef.current = true;
      setInternalPressed(true);
      onKeyDown?.(keyCode, computedSendLabel);

      // Legacy support
      onKeyPress?.(keyCode, computedSendLabel);
    }, [
      disabled,
      onKeyDown,
      onKeyPress,
      keyCode,
      computedSendLabel,
    ]);

    const handleKeyUp = React.useCallback(() => {
      if (disabled || !pressedRef.current) return;

      pressedRef.current = false;
      setInternalPressed(false);
      onKeyUp?.(keyCode, computedSendLabel);
    }, [disabled, onKeyUp, keyCode, computedSendLabel]);

    // Mouse events
    const handleMouseDown = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        handleKeyDown();
      },
      [handleKeyDown]
    );

    const handleMouseUp = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        handleKeyUp();
      },
      [handleKeyUp]
    );

    const handleMouseLeave = React.useCallback(() => {
      // Release key when mouse leaves while pressed
      if (isPressed) {
        handleKeyUp();
      }
    }, [isPressed, handleKeyUp]);

    // Touch events for mobile
    const handleTouchStart = React.useCallback(
      (e: React.TouchEvent) => {
        e.preventDefault();
        handleKeyDown();
      },
      [handleKeyDown]
    );

    const handleTouchEnd = React.useCallback(
      (e: React.TouchEvent) => {
        e.preventDefault();
        handleKeyUp();
      },
      [handleKeyUp]
    );

    const handleTouchCancel = React.useCallback(() => {
      // Release key when touch is cancelled
      if (isPressed) {
        handleKeyUp();
      }
    }, [isPressed, handleKeyUp]);

    // Keyboard events for accessibility
    const handleKeyboardDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleKeyDown();
        }
      },
      [handleKeyDown]
    );

    const handleKeyboardUp = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleKeyUp();
        }
      },
      [handleKeyUp]
    );

    // Generate full tooltip with status info
    const fullTooltip = React.useMemo(() => {
      const baseTooltip = `${tooltipText} (${keyCode})`;
      if (!showStatusIndicator) return baseTooltip;
      const statusText = isActive ? 'Active' : 'Inactive';
      return `${baseTooltip} - Status: ${statusText}`;
    }, [tooltipText, keyCode, showStatusIndicator, isActive]);

    // Generate styles using utility function
    const keyStyles = React.useMemo(() => {
      // Create style config object
      const styleConfig = {
        disabled,
        isPressed: internalPressed, // Use internal pressed state for default styles
        isActive,
        compact,
        heightClass: heightClass_,
        isFixedWidth,
      };

      const baseStyles = generateKeyStyles(styleConfig);

      // If key is pressed from external events, apply custom pressed color
      if (isPressed && !disabled) {
        // Remove default pressed styles and add custom color
        const filteredStyles = baseStyles.filter(
          style =>
            !style.includes('bg-') ||
            style.includes('hover:') ||
            style.includes('active:')
        );
        return [...filteredStyles, pressedColor, 'text-text', 'shadow-inner'];
      }

      return baseStyles;
    }, [
      disabled,
      internalPressed,
      isPressed,
      isActive,
      compact,
      heightClass_,
      isFixedWidth,
      pressedColor,
    ]);

    return (
      <button
        className={cn([...keyStyles, className])}
        style={{
          ...(isFixedWidth ? { width } : undefined),
          ...style,
        }}
        disabled={disabled}
        title={fullTooltip}
        aria-label={tooltipText}
        aria-pressed={isActive || isPressed || internalPressed}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        // Mouse events
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        // Touch events for mobile
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        // Keyboard events for accessibility
        onKeyDown={handleKeyboardDown}
        onKeyUp={handleKeyboardUp}
        // Prevent context menu on long press (mobile)
        onContextMenu={e => e.preventDefault()}
      >
        {/* LED Status Indicator */}
        {keyCode === 'CapsLock' && <LEDIndicator isActive={isActive} />}

        {/* Key Label */}
        <KeyLabel
          label={label || ''}
          isStringLabel={isStringLabel}
          isArrayLabel={isArrayLabel}
          showDualState={!internalPressed && !isActive}
        />
      </button>
    );
  }
);

// Set displayName for debugging
Key.displayName = 'Key';

export default Key;
