import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TextareaProps extends React.ComponentProps<'textarea'> {
  label?: string
  description?: string
  labelPosition?: 'top' | 'left'
  labelSize?: string | number
  labelClassName?: string
  descriptionClassName?: string
  containerClassName?: string
}

function Textarea({
  className,
  label,
  description,
  labelPosition = 'top',
  labelSize,
  labelClassName,
  descriptionClassName,
  containerClassName,
  onKeyDownCapture,
  ...props
}: TextareaProps) {
  const defaultKeyDownCapture = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    e.stopPropagation()
  }

  // Helper function to convert size to style
  const getSizeStyle = (size?: string | number) => {
    if (typeof size === 'number') {
      return { fontSize: `${size}px` }
    }
    return {}
  }

  // Helper function to get size class
  const getSizeClass = (size?: string | number, defaultClass: string = '') => {
    if (typeof size === 'string') {
      return size
    }
    return defaultClass
  }

  const textareaElement = (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input font-[400] placeholder: focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm nice-scrollbar',
        className
      )}
      onKeyDownCapture={onKeyDownCapture || defaultKeyDownCapture}
      {...props}
    />
  )

  if (!label) {
    return textareaElement
  }

  const labelElement = (
    <div
      className={cn(
        labelPosition === 'top' ? 'flex flex-col gap-1' : 'flex flex-col',
        labelPosition === 'left' && 'whitespace-nowrap'
      )}
    >
      <label
        className={cn(
          'text-sm font-medium text-[var(--text-color)]',
          getSizeClass(labelSize, 'text-sm'),
          labelClassName
        )}
        style={getSizeStyle(labelSize)}
      >
        {label}
      </label>
      {description && (
        <span
          className={cn(
            'text-xs text-[var(--inactive-text-color)]',
            descriptionClassName
          )}
        >
          {description}
        </span>
      )}
    </div>
  )

  return (
    <div
      className={cn(
        'w-full',
        labelPosition === 'top'
          ? 'flex flex-col gap-2'
          : 'flex items-start gap-3',
        containerClassName
      )}
    >
      {labelElement}

      {textareaElement}
    </div>
  )
}

export { Textarea }
