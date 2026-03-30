import React from 'react'
import { Button } from '../ui/button'

export type PopularImageItem = {
  name: string
  url: string
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode
  description?: string
}

export default function PopularImagesList({
  items,
  onSelectImage,
  className = '',
}: {
  items: PopularImageItem[]
  onSelectImage: (url: string) => void
  className?: string
}) {
  const renderIcon = (icon: PopularImageItem['icon']) => {
    if (!icon) return <span>🖼️</span>

    // Already a React element
    if (React.isValidElement(icon)) return icon

    // Component types: function components OR forwardRef components (lucide-react)
    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' &&
        icon !== null &&
        '$$typeof' in (icon as any) &&
        'render' in (icon as any))
    ) {
      return React.createElement(
        icon as React.ComponentType<{ className?: string }>,
        {
          className: 'size-5',
        }
      )
    }

    // Fallback: treat as ReactNode
    return <>{icon as React.ReactNode}</>
  }

  return (
    <div
      className={
        'rounded-md border border-[var(--border-color)] divide-y divide-[var(--border-color)] ' +
        className
      }
    >
      {items.map(img => (
        <div
          key={img.url}
          className="flex items-center justify-between gap-3 p-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* icon */}
            <div className="shrink-0 grid place-items-center size-8 rounded-[6px] border border-[var(--border-color)] bg-surface-800">
              {renderIcon(img.icon)}
            </div>

            {/* text */}
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{img.name}</div>
              <div className="text-xs  truncate">{img.url}</div>
              {img.description ? (
                <div className="text-xs  truncate">{img.description}</div>
              ) : null}
            </div>
          </div>

          <Button
            variant="default"
            size="mini"
            className="h-[28px] rounded-[4px] px-[10px]"
            onClick={() => onSelectImage(img.url)}
          >
            Select
          </Button>
        </div>
      ))}
    </div>
  )
}
