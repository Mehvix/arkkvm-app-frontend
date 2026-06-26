/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-05 21:34:47
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-20 11:53:17
 */
import { cn } from '@/utils';
import { ReactNode } from 'react';

interface SettingPageContainerProps {
  title: string
  description: string
  children: ReactNode
  className?: string
  closeIcon?: ReactNode
  onClose?: () => void
  /** Fixed footer area (e.g. action bar with Save button). */
  footer?: ReactNode
}

export default function SettingPageContainer({
  title,
  description,
  children,
  className,
  closeIcon,
  onClose,
  footer,
}: SettingPageContainerProps) {
  return (
    <div className={cn('flex h-full flex-col bg-[var(--bg-color)]', className)}>
      {/* Fixed top header area */}
      <div className="flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-[20px] font-[400] text-[var(--text-color)]">
              {title}
            </h2>
            <p className="py-[12px] text-sm text-[var(--text-secondary)]">
              {description}
            </p>
          </div>

          {/* Close button */}
          {closeIcon && onClose && (
            <button
              onClick={onClose}
              className="ml-4 flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg-color)] hover:text-[var(--text-color)]"
              aria-label="Close settings"
            >
              {closeIcon}
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0  flex flex-col">
        <div className='pr-[16px] sm:pr-[30px]'>
            <p className=" border-t border-[var(--border-color)]"></p>
        </div>

        <div className="pr-[16px] sm:pr-[30px] flex-1 min-h-0 py-[24px] overflow-y-auto overflow-x-hidden">{children}</div>
      </div>

      {/* Fixed footer action area */}
      {footer && (
        <div className="flex-shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-color)] pr-[16px] sm:pr-[30px] py-[12px]">
          {footer}
        </div>
      )}
    </div>
  );
}
