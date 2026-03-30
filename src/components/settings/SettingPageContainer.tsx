/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-05 21:34:47
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-11 02:21:45
 */
import { cn } from '@/utils'
import { ReactNode } from 'react'

interface SettingPageContainerProps {
  title: string
  description: string
  children: ReactNode
  className?: string
  closeIcon?: ReactNode
  onClose?: () => void
}

export default function SettingPageContainer({
  title,
  description,
  children,
  className,
  closeIcon,
  onClose,
}: SettingPageContainerProps) {
  return (
    <div className={cn('flex h-full flex-col bg-[var(--bg-color)]', className)}>
      {}
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

          {}
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

      {}
      <div className="flex-1 pr-[30px] ">
        <p className=" border-t border-[var(--border-color)]"></p>
        <div className="h-full py-[24px] overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
