import { ReactNode } from 'react';
import RadioIndicator from '../../ui/radio-indicator';

type BadgeVariant = 'default' | 'warning' | 'danger' | 'info'

export type SelectVirtualMediaCardProps = {
  name: string // Radio group name
  value: string // Current item value
  checked?: boolean // Controlled selected state
  defaultChecked?: boolean // Uncontrolled default selected state
  disabled?: boolean // Disabled state
  onChange?: (value: string) => void

  icon?: ReactNode // Top-left icon
  badgeText?: string // Badge text, e.g. "Coming Soon"
  badgeVariant?: BadgeVariant // Badge color variant
  title: ReactNode // Title, e.g. "Browser Mount"
  description?: ReactNode // Description text

  className?: string
  // Radio indicator customization
  indicatorSize?: number // px
  indicatorBorderColor?: string
  indicatorCheckedBorderColor?: string
  indicatorDotColor?: string
  indicatorBackgroundColor?: string
}

export default function SelectVirtualMediaCard({
  name,
  value,
  checked,
  defaultChecked,
  disabled,
  onChange,
  icon,
  badgeText,
  badgeVariant = 'info',
  title,
  description,
  className = '',
  indicatorSize = 16,
  indicatorBorderColor = 'var(--inactive-text-color)',
  indicatorCheckedBorderColor,
  indicatorDotColor = 'var(--btn-primary-bg)',
  indicatorBackgroundColor = 'var(--card)',
}: SelectVirtualMediaCardProps) {
  const handleChange = () => !disabled && onChange?.(value);

  const badgeClass =
    badgeVariant === 'danger'
      ? 'text-red-500'
      : badgeVariant === 'warning'
        ? 'text-amber-500'
        : badgeVariant === 'info'
          ? 'text-brand-primary'
          : 'text-ink-mute';

  return (
    <label
      className={[
        'relative block cursor-pointer rounded-[12px] border border-[2px] border-[var(--border-color)] bg-surface-800 p-4 shadow-glow',
        'transition hover:bg-white/5',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
        checked ? 'border-[var(--btn-primary-bg)]' : '',
        className,
      ].join(' ')}
    >
      {/* Hidden radio input */}
      <input
        type="radio"
        className="sr-only"
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={handleChange}
      />

      {/* Top-right selected indicator */}
      <div className="absolute right-3 top-3">
        <RadioIndicator
          checked={!!checked}
          size={indicatorSize}
          borderColor={indicatorBorderColor}
          checkedBorderColor={indicatorCheckedBorderColor}
          dotColor={indicatorDotColor}
          backgroundColor={indicatorBackgroundColor}
        />
      </div>

      {/* Content area */}
      <div className="flex items-start flex-col gap-3">
        {/* Icon */}
        <div className="shrink-0">
          {icon ?? (
            <div className="grid h-8 w-8 place-items-center rounded-[6px] border border-surface-border">
              🌐
            </div>
          )}
        </div>

        <div className="space-y-1">
          {badgeText && (
            <div className={`text-caption font-medium ${badgeClass}`}>
              {badgeText}
            </div>
          )}
          <div className="text-body text-ink font-semibold">{title}</div>
          {description && <p className="text-[12px] !font-light text-[var(--text-secondary)]">{description}</p>}
        </div>
      </div>
    </label>
  );
}
