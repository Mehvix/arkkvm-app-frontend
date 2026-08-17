import React from 'react';

export type RadioIndicatorProps = {
  checked?: boolean;
  /** Outer size in px */
  size?: number;
  /** Border color when unchecked */
  borderColor?: string;
  /** Border color when checked (fallbacks to borderColor) */
  checkedBorderColor?: string;
  /** Inner dot color when checked */
  dotColor?: string;
  /** Background color of the indicator plate */
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * RadioIndicator: a small circular selection indicator with an outer ring and inner dot.
 * - Controlled by `checked`.
 * - Colors are customizable; sensible defaults use CSS variables.
 */
export const RadioIndicator: React.FC<RadioIndicatorProps> = ({
  checked = false,
  size = 16,
  borderColor = 'var(--inactive-text-color)',
  checkedBorderColor,
  dotColor = 'var(--btn-primary-bg)',
  className = '',
}) => {
  const outer = size;
  const inner = Math.max(Math.round(size * 0.625), 6); // ~10px when size=16
  const finalBorder = checked ? checkedBorderColor || dotColor || borderColor : borderColor;

  return (
    <div
      className={['grid place-items-center rounded-full radio-indicator-outer', className].join(
        ' '
      )}
      style={
        {
          '--radio-outer-size': `${outer}px`,
          '--radio-border-color': finalBorder,
          '--radio-inner-size': `${inner}px`,
          '--radio-inner-color': checked ? dotColor : 'transparent',
        } as React.CSSProperties
      }
    >
      <div className="rounded-full radio-indicator-inner" />
    </div>
  );
};

export default RadioIndicator;
