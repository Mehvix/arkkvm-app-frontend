import React from 'react'

export type RadioIndicatorProps = {
  checked?: boolean
  /** Outer size in px */
  size?: number
  /** Border color when unchecked */
  borderColor?: string
  /** Border color when checked (fallbacks to borderColor) */
  checkedBorderColor?: string
  /** Inner dot color when checked */
  dotColor?: string
  /** Background color of the indicator plate */
  backgroundColor?: string
  className?: string
  style?: React.CSSProperties
}

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
  backgroundColor = 'var(--card)',
  className = '',
  style,
}) => {
  const outer = size
  const inner = Math.max(Math.round(size * 0.625), 6) // ~10px when size=16
  const finalBorder = checked
    ? checkedBorderColor || dotColor || borderColor
    : borderColor

  return (
    <span
      aria-hidden
      className={['grid place-items-center rounded-full', className].join(' ')}
      style={{
        width: outer,
        height: outer,
        border: `1px solid ${finalBorder}`,
        backgroundColor,
        ...style,
      }}
    >
      <span
        className="rounded-full"
        style={{
          width: inner,
          height: inner,
          backgroundColor: checked ? dotColor : 'transparent',
        }}
      />
    </span>
  )
}

export default RadioIndicator
