/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-08-25 15:40:48
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-10-12 18:56:36
 */
import { cn } from '@/lib/utils'
import React from 'react'
import { Card } from '../ui/card'

export type InfoItem = {
  label: React.ReactNode
  value: React.ReactNode
}

interface InfoCardProps {
  title: React.ReactNode
  items: InfoItem[]
  action?: React.ReactNode
  className?: string
  singleColumn?: boolean
}

// Renders a titled card with a two-column key-value grid.
// Items are provided as a flat array; left/right columns are split by index parity for simplicity.
export default function InfoCard({
  title,
  items,
  action,
  className,
  singleColumn = false,
}: InfoCardProps) {
  const left = singleColumn ? items : items.filter((_, i) => i % 2 === 0)
  const right = singleColumn ? [] : items.filter((_, i) => i % 2 === 1)

  return (
    <Card
      className={cn(
        'p-4 bg-[var(--secondary-bg-color)] border border-[var(--border-color)]',
        className
      )}
    >
      <div className="text-lg font-semibold mb-4 text-[var(--text-color)]">
        {title}
      </div>

      <div
        className={cn(
          'font-[10px]',
          singleColumn
            ? 'space-y-2'
            : 'grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2'
        )}
      >
        {singleColumn ? (
          items.map((it, idx) => (
            <Row key={idx} label={it.label} value={it.value} />
          ))
        ) : (
          <>
            <div className="space-y-2">
              {left.map((it, idx) => (
                <Row key={idx} label={it.label} value={it.value} />
              ))}
            </div>
            <div className="space-y-2">
              {right.map((it, idx) => (
                <Row key={idx} label={it.label} value={it.value} />
              ))}
            </div>
          </>
        )}
      </div>

      {action ? <div className="mt-4 flex justify-end">{action}</div> : null}
    </Card>
  )
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-[var(--inactive-text-color)]">{label}</span>
      <span className="ml-[10px] text-[var(--text-color)] font-medium">
        {value}
      </span>
    </div>
  )
}
