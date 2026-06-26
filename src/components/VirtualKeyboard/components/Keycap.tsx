import { cn } from '@/utils';
import type { FC } from 'react';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { KeyLabel, LEDIndicator } from '.';
import type { KeyDefinition, KeyLegends } from '../data/keyboard-types';
import { useGlobalEventCleanup } from '../hooks';
import { generateKeyStyles } from '../utils';

interface KeycapProps {
  keyCode?: string
  label?: React.ReactNode | string | string[]

  className?: string
  shiftActive?: boolean
  capsLockActive?: boolean
  altGrActive?: boolean

  width?: number
  style?: React.CSSProperties
  isActive?: boolean
  isPressed?: boolean
  pressedColor?: string
  disabled?: boolean
  compact?: boolean
  heightClass?: string
  showStatusIndicator?: boolean
  title?: string
  sendValue?: string

  onKeyDown?: (keyCode: string, sendValue?: string) => void
  onKeyUp?: (keyCode: string, sendValue?: string) => void
  keyDef: KeyDefinition
}

interface DisplayLabelParams {
  legends?: KeyLegends
  shiftActive?: boolean
  capsLockActive?: boolean
  altGrActive?: boolean
  isModifier?: boolean
  showDualState?: boolean
  ignoreAltGr?: boolean
}

const getDisplayLabel = ({
  legends,
  shiftActive,
  capsLockActive,
  altGrActive,
  isModifier,
  showDualState,
  ignoreAltGr,
}: DisplayLabelParams) => {
  if (!legends) return '';

  if (isModifier || ignoreAltGr) return legends.base;

  if (altGrActive) return legends.altGr;

  if (legends.caps) {
    return shiftActive ? legends.shift : (showDualState ? [legends.base, legends.shift] : legends.base);
  }

  if (shiftActive && legends.shift) {
    return capsLockActive ? legends.base : legends.shift;
  }

  if (capsLockActive && legends.shift) {
    return legends.shift;
  }

  if (showDualState) return [legends.base, legends.shift];

  return legends.base || '';
};

export const Keycap: FC<KeycapProps> = memo(
  ({
    keyDef,
    shiftActive = false,
    capsLockActive = false,
    altGrActive = false,
    isActive = false,
    isPressed = false,
    pressedColor = 'bg-blue-500',
    disabled = false,
    compact = false,
    heightClass,
    showStatusIndicator = false,
    title,
    sendValue,
    onKeyDown,
    onKeyUp,
  }) => {
    if (!keyDef) return <span></span>;

    const { keyCode, width, style, className = '' } = keyDef;
    const isFixedWidth = width !== 'auto' && Boolean(width);
    const flexGrow = width || 1;
    const heightClass_ = heightClass || (compact ? 'h-5' : 'h-10');
    const [internalPressed, setInternalPressed] = useState(false);
    const pressedRef = useRef(false);
    const keyStyles = useMemo(() => {
      const styleConfig = {
        disabled,
        isPressed: internalPressed,
        isActive,
        compact,
        heightClass: heightClass_,
        isFixedWidth,
      };

      const baseStyles = generateKeyStyles(styleConfig);

      if (isPressed && !disabled) {
        const filteredStyles = baseStyles.filter(
          style =>
            !style.includes('bg-') ||
            style.includes('hover:') ||
            style.includes('active:')
        );
        return [...filteredStyles, pressedColor, 'text-white', 'shadow-inner'];
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

    const computedLabel = useMemo(() => {
      const label = getDisplayLabel({
        ...keyDef,
        shiftActive,
        capsLockActive,
        altGrActive,
      });
      return {
        label,
        isStringLabel: typeof label === 'string',
        isArrayLabel: Array.isArray(label),
      };
    }, [keyDef, shiftActive, capsLockActive, altGrActive]);

    const computedSendLabel = useMemo(() => {
      if (typeof sendValue === 'string') return sendValue;
      if (computedLabel.isStringLabel) return computedLabel.label as string;
      if (computedLabel.isArrayLabel)
        return String((computedLabel.label as string[])[0] ?? '');
      return '';
    }, [sendValue, computedLabel]);

    const tooltipText = useMemo(() => {
      if (typeof title === 'string') return title;
      if (computedLabel.isStringLabel) return computedLabel.label as string;
      if (computedLabel.isArrayLabel) {
        const [primary, secondary] = computedLabel.label as string[];
        return `${primary} / ${secondary ?? ''}`;
      }
      return computedSendLabel || keyCode;
    }, [title, computedLabel, computedSendLabel, keyCode]);

    const fullTooltip = useMemo(() => {
      const baseTooltip = `${tooltipText} (${keyCode})`;
      if (!showStatusIndicator) return baseTooltip;
      const statusText = isActive ? 'Active' : 'Inactive';
      return `${baseTooltip} - Status: ${statusText}`;
    }, [tooltipText, keyCode, showStatusIndicator, isActive]);

    useGlobalEventCleanup(internalPressed, () => {
      if (pressedRef.current) {
        pressedRef.current = false;
        setInternalPressed(false);
        onKeyUp?.(keyCode, computedSendLabel);
      }
    });

    const handleKeyDown = useCallback(() => {
      if (disabled || pressedRef.current) return;
      pressedRef.current = true;
      setInternalPressed(true);
      onKeyDown?.(keyCode, computedSendLabel);
    }, [disabled, onKeyDown, keyCode, computedSendLabel]);

    const handleKeyUp = useCallback(() => {
      if (disabled || !pressedRef.current) return;
      pressedRef.current = false;
      setInternalPressed(false);
      onKeyUp?.(keyCode, computedSendLabel);
    }, [disabled, onKeyUp, keyCode, computedSendLabel]);

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        handleKeyDown();
      },
      [handleKeyDown]
    );

    const handleMouseUp = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        handleKeyUp();
      },
      [handleKeyUp]
    );

    const handleMouseLeave = useCallback(() => {
      if (internalPressed) {
        handleKeyUp();
      }
    }, [internalPressed, handleKeyUp]);

    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        e.preventDefault();
        handleKeyDown();
      },
      [handleKeyDown]
    );

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        e.preventDefault();
        handleKeyUp();
      },
      [handleKeyUp]
    );

    const handleTouchCancel = useCallback(() => {
      if (internalPressed) {
        handleKeyUp();
      }
    }, [internalPressed, handleKeyUp]);

    const handleKeyboardDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleKeyDown();
        }
      },
      [handleKeyDown]
    );

    const handleKeyboardUp = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleKeyUp();
        }
      },
      [handleKeyUp]
    );

    return (
      <button
        className={cn([...keyStyles, className])}
        style={{
          flex: `${flexGrow} 1 0%`,
          ...style,
        }}
        disabled={disabled}
        title={fullTooltip}
        aria-label={tooltipText}
        aria-pressed={isActive || isPressed || internalPressed}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onKeyDown={handleKeyboardDown}
        onKeyUp={handleKeyboardUp}
        onContextMenu={e => e.preventDefault()}
      >
        {keyCode === 'CapsLock' && showStatusIndicator && (
          <LEDIndicator isActive={isActive} />
        )}

        <KeyLabel
          {...computedLabel}
          showDualState={keyDef.showDualState && !isActive}
        />
      </button>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.isPressed !== nextProps.isPressed) return false;
    if (prevProps.isActive !== nextProps.isActive) return false;

    if (prevProps.keyDef !== nextProps.keyDef) {
      const prevLegends = prevProps.keyDef?.legends;
      const nextLegends = nextProps.keyDef?.legends;
      if (JSON.stringify(prevLegends) !== JSON.stringify(nextLegends)) {
        return false;
      }
    }

    const hasShiftLegend = prevProps.keyDef?.legends?.shift !== undefined;
    const hasDualState = prevProps.keyDef?.showDualState === true;
    const hasAltGrLegend = prevProps.keyDef?.legends?.altGr !== undefined;

    if (hasShiftLegend || hasDualState || hasAltGrLegend) {
      if (prevProps.shiftActive !== nextProps.shiftActive) return false;
      if (prevProps.capsLockActive !== nextProps.capsLockActive) return false;
      if (prevProps.altGrActive !== nextProps.altGrActive) return false;
    }

    return true;
  }
);
