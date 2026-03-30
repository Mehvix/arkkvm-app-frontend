import { cn } from '@/lib/utils'

export type SelectCardProps = {
  title: string
  description?: string
  selected?: boolean
  color?: string // any CSS color, e.g. '#ef4444' | 'rgb(239 68 68)' | 'hsl(0,84%,60%)'
  className?: string
  onClick?: () => void
  disabled?: boolean
}

/**
 * A selectable card with an accent dot, colored title, and optional description.
 * Color is fully customizable via `color` prop.
 */
export function SelectCard({
  title,
  description,
  selected = false,
  color = 'var(--btn-primary-bg)', // default to theme primary color
  className,
  onClick,
  disabled,
}: SelectCardProps) {
  const accent = normalizeColor(color)
  const descColor = withAlpha(accent, 0.7)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl px-4 py-3 border',
        'transition-colors',
        'bg-[var(--bg-secondary)]',
        selected ? 'shadow-sm' : '',
        'flex items-start gap-3',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      style={{
        borderColor: selected ? accent : 'var(--border-color)',
      }}
    >
      {/* dot */}
      <span
        className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
        style={{
          backgroundColor: selected ? accent : 'var(--inactive-text-color)',
        }}
        aria-hidden
      />

      {/* text area */}
      <div className="min-w-0">
        <div
          className="text-[14px] font-medium leading-6 truncate"
          style={{ color: selected ? accent : 'var(--text-color)' }}
        >
          {title}
        </div>
        {description ? (
          <div
            className="mt-0.5 text-[12px] leading-5 break-words"
            style={{
              color: selected ? descColor : 'var(--inactive-text-color)',
            }}
          >
            {description}
          </div>
        ) : null}
      </div>
    </button>
  )
}

function normalizeColor(input: string): string {
  // Simple passthrough; browsers accept hex/rgb/hsl. Could add more checks if needed.
  return input
}

function withAlpha(color: string, alpha: number): string {
  // Support CSS variable via color-mix
  if (isCssVar(color)) {
    // mix with transparent to achieve perceived alpha
    const pct = Math.round(alpha * 100)
    return `color-mix(in srgb, ${color} ${pct}%, transparent)`
  }
  // If hex like #RRGGBB or #RGB, convert to rgba, else fallback using current color and opacity.
  const hex = color.replace('#', '')
  if (/^([\da-f]{3}|[\da-f]{6})$/i.test(hex)) {
    const [r, g, b] =
      hex.length === 3
        ? hex.split('').map(c => parseInt(c + c, 16))
        : [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(p =>
            parseInt(p, 16)
          )
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  // rgb/rgba/hsl: rely on CSS color + opacity through rgba() not trivial; fallback to same color
  return color
}

function isCssVar(v: string): boolean {
  return /^var\(.+\)$/.test(v.trim())
}

export default SelectCard
