import { cn } from '@/lib/utils';

export type SelectCardProps = {
  title: string
  description?: string
  selected?: boolean
  color?: string
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function SelectCard({
  title,
  description,
  selected = false,
  color = 'var(--btn-primary-bg)',
  className,
  onClick,
  disabled,
}: SelectCardProps) {
  const accentColor = normalizeColor(color);
  const descriptionColor = withAlpha(accentColor, 0.7);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl px-4 py-3 border',
        'transition-colors',
        'bg-[var(--bg-secondary)]',
        selected && 'shadow-sm',
        'flex items-start gap-3',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      style={{
        borderColor: selected ? accentColor : 'var(--border-color)',
      }}
    >
      <span
        className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
        style={{
          backgroundColor: selected ? accentColor : 'var(--inactive-text-color)',
        }}
        aria-hidden
      />

      <div className="min-w-0">
        <div
          className="text-[14px] font-medium leading-6 truncate"
          style={{ color: selected ? accentColor : 'var(--text-color)' }}
        >
          {title}
        </div>
        {description ? (
          <div
            className="mt-0.5 text-[12px] leading-5 break-words"
            style={{
              color: selected ? descriptionColor : 'var(--inactive-text-color)',
            }}
          >
            {description}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function normalizeColor(input: string): string {
  return input;
}

function withAlpha(color: string, alpha: number): string {
  if (isCssVar(color)) {
    const pct = Math.round(alpha * 100);
    return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
  }
  const hex = color.replace('#', '');
  if (/^([\da-f]{3}|[\da-f]{6})$/i.test(hex)) {
    const [red, green, blue] =
      hex.length === 3
        ? hex.split('').map(c => parseInt(c + c, 16))
        : [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(p =>
            parseInt(p, 16)
          );
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
  return color;
}

function isCssVar(v: string): boolean {
  return /^var\(.+\)$/.test(v.trim());
}

export default SelectCard;
