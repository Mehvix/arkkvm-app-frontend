import { cn } from '@/utils/cn'
import React, { useMemo, useRef, useState } from 'react'
import { Button } from './button'
import { Checkbox } from './checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Input } from './input'

export type MultiSelectOption = {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export type MultiSelectProps = {
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  className?: string
  dropdownClassName?: string
  maxHeight?: number
  searchable?: boolean
  emptyText?: string
  maxSelections?: number
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
  dropdownClassName,
  maxHeight = 260,
  searchable = true,
  emptyText = 'No results',
  maxSelections,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [tempValue, setTempValue] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      o =>
        `${String(o.label)}`.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q)
    )
  }, [options, query])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setTempValue([...value])
      if (searchable) {
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    } else {
      setQuery('')
    }
  }

  const toggle = (val: string) => {
    if (tempValue.includes(val)) {
      setTempValue(tempValue.filter(v => v !== val))
    } else {
      if (maxSelections && tempValue.length >= maxSelections) {
        return
      }
      setTempValue([...tempValue, val])
    }
  }

  const clearAll = () => setTempValue([])

  const handleDone = () => {
    onChange(tempValue)
    setOpen(false)
  }

  const displayText = value.length ? `${value.length} selected` : placeholder

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button size="xs">+</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn('min-w-[200px] sm:min-w-[240px]', dropdownClassName)}
        style={{ maxWidth: '92vw' }}
      >
        {searchable && (
          <div className="p-2 border-b">
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-8"
              autoFocus
            />
          </div>
        )}

        <div
          className="max-h-[var(--ms-height)] overflow-y-auto p-1 nice-scrollbar"
          style={{ ['--ms-height' as any]: `${maxHeight}px` }}
        >
          {filtered.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs ">{emptyText}</div>
          ) : (
            filtered.map(opt => {
              const isSelected = tempValue.includes(opt.value)
              const isDisabled =
                opt.disabled ||
                (!isSelected &&
                  maxSelections &&
                  tempValue.length >= maxSelections)

              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer hover:bg-[var(--btn-outline-bg-hover)] ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggle(opt.value)}
                    disabled={isDisabled}
                  />
                  <span className="flex-1 min-w-0 truncate">{opt.label}</span>
                  <span className="opacity-60 text-xs">{opt.value}</span>
                </label>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-2 border-t">
          <div className="flex items-center gap-2">
            <Button size="xs" onClick={clearAll}>
              Clear
            </Button>
            {maxSelections && (
              <span className="text-xs ">
                {tempValue.length}/{maxSelections}
              </span>
            )}
          </div>
          <Button variant="outline" size="xs" onClick={handleDone}>
            Done
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
