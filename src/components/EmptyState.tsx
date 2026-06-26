/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-03-26 20:46:11
 */
import { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Optional action area (e.g. button or link). */
  action?: ReactNode
  /** Optional click handler for the whole container. */
  onClick?: () => void
  /** Controls spacing presets. */
  size?: 'sm' | 'md' | 'lg'
  /** Enables bordered style with rounded corners. */
  bordered?: boolean
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  onClick,
  size = 'md',
  bordered = true,
  className = '',
}: EmptyStateProps) {
  const sizeClass =
    size === 'sm' ? 'p-4 gap-2' : size === 'lg' ? 'p-8 gap-4' : 'p-6 gap-3';

  const base =
    'flex flex-col items-center justify-center text-center bg-surface-800 mt-[16px] ' +
    (bordered
      ? 'border border-[var(--border-color)] rounded-xl2 shadow-glow '
      : '') +
    sizeClass;

  const clickable = onClick
    ? 'cursor-pointer hover:bg-white/5 active:bg-white/10'
    : '';

  return (
    <section
      role="status"
      aria-live="polite"
      onClick={onClick}
      className={`${base} ${clickable} ${className}`}
    >
      {icon ? (
        icon
      ) : (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
          <span aria-hidden className="text-body text-ink font-bold">
            ＋
          </span>
        </div>
      )}

      <div className="space-y-1">
        <h3 className="text-body text-ink font-semibold">{title}</h3>
        {description && <p className="text-sub text-ink-mute">{description}</p>}
      </div>

      {action && <div className="pt-1">{action}</div>}
    </section>
  );
}
