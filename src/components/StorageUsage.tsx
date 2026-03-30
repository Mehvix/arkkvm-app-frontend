import { cn } from '@/lib/utils'
import { humanSize } from '@/utils/format'
import React from 'react'

export interface StorageUsageProps extends React.HTMLAttributes<HTMLDivElement> {
  total: number

  used: number

  free?: number
  /** Loading state */
  loading?: boolean

  title?: React.ReactNode

  rightText?: (pct: number) => React.ReactNode

  usedText?: (usedBytes: number) => React.ReactNode

  freeText?: (freeBytes: number) => React.ReactNode

  precision?: number

  barContainerClassName?: string

  barClassName?: string
}

export const StorageUsage: React.FC<StorageUsageProps> = props => {
  const {
    total,
    used,
    free,
    loading = false,
    title = 'Available Storage',
    rightText,
    usedText,
    freeText,
    precision = 1,
    className,
    barContainerClassName,
    barClassName,
    ...rest
  } = props

  const safeTotal = Math.max(0, Number(total) || 0)
  const safeUsed = Math.max(0, Math.min(safeTotal, Number(used) || 0))
  const safeFree =
    free != null
      ? Math.max(0, Number(free) || 0)
      : Math.max(0, safeTotal - safeUsed)

  const pct = safeTotal
    ? Number(((safeUsed / safeTotal) * 100).toFixed(precision))
    : 0

  const renderRight = rightText ?? ((p: number) => <>{p}% used</>)
  const renderUsed = usedText ?? ((u: number) => <>{humanSize(u)} used</>)
  const renderFree = freeText ?? ((f: number) => <>{humanSize(f)} free</>)

  if (loading) {
    return (
      <div className={cn('space-y-2', className)} {...rest}>
        <div className="flex items-center justify-between text-xs">
          <div>{title}</div>
          <div className="animate-pulse bg-gray-300 h-3 w-12 rounded"></div>
        </div>
        <div className={cn('h-2 rounded bg-white/10', barContainerClassName)}>
          <div
            className="h-full rounded bg-gray-300 animate-pulse"
            style={{ width: '30%' }}
          />
        </div>
        <div className="flex items-center justify-between text-xs ">
          <div className="animate-pulse bg-gray-300 h-3 w-16 rounded"></div>
          <div className="animate-pulse bg-gray-300 h-3 w-16 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)} {...rest}>
      <div className="flex items-center justify-between text-xs">
        <div>{title}</div>
        <div>{renderRight(pct)}</div>
      </div>
      <div className={cn('h-2 rounded bg-white/10', barContainerClassName)}>
        <div
          className={cn(
            'h-full rounded bg-[var(--btn-primary-bg)]',
            barClassName
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs ">
        <div>{renderUsed(safeUsed)}</div>
        <div>{renderFree(safeFree)}</div>
      </div>
    </div>
  )
}

export default StorageUsage
