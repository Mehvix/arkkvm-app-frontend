/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-09-10 20:45:39
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-10-11 14:08:17
 */
// components/Panel.tsx
import { memo, ReactNode } from 'react'

type ActionPanelProps = {
  title?: ReactNode
  subtitle?: ReactNode
  footer?: ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
  children?: ReactNode

  rightSlot?: ReactNode
}

export default memo(function ActionPanel({
  title,
  subtitle,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  children,
  rightSlot,
}: ActionPanelProps) {
  return (
    <section
      className={`flex flex-col h-full ${className}`}
      role="region"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div className={`flex-shrink-0 ${headerClassName}`}>
        <div className="flex justify-between items-center">
          {title && <h2 className="text-h1">{title}</h2>}
          {rightSlot ?? null}
        </div>
        {subtitle && (
          <div className="mt-1">
            {typeof subtitle === 'string' ? (
              <p className="text-caption">{subtitle}</p>
            ) : (
              <div className="w-full">{subtitle}</div>
            )}
          </div>
        )}
      </div>

      <div className={`flex-1 min-h-0 flex flex-col ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <footer
          className={`flex items-center mt-[12px] justify-end gap-2 pt-1 flex-shrink-0 ${footerClassName}`}
        >
          {footer}
        </footer>
      )}
    </section>
  )
})
