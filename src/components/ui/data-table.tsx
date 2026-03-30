import { IconCheckbox, IconUnchecked } from '@/assets/icons'
import { cn } from '@/lib/utils'
import React from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'

export type DataTableColumn<T extends object = any> = {
  key?: React.Key
  title: React.ReactNode
  dataIndex?: keyof T & string
  render?: (value: any, record: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  /**
   * Enable sorting for this column.
   * - true: auto infer by dataIndex (number/string)
   * - function: custom comparator (a,b) => number
   */
  sorter?: boolean | ((a: T, b: T) => number)
  /**
   * Cell click handler for this column (single-column click).
   */
  onCellClick?: (payload: {
    event: React.MouseEvent<HTMLTableCellElement>
    record: T
    value: any
    rowIndex: number
    dataIndex?: keyof T & string
    column: DataTableColumn<T>
  }) => void
}

export type RowKey<T> =
  | (keyof T & string)
  | ((record: T, index: number) => React.Key)

export type SortOrder = 'ascend' | 'descend'
export type DataTableSort<T extends object = any> = {
  dataIndex: keyof T & string
  order: SortOrder
}

export interface DataTableProps<
  T extends object = any,
> extends React.HTMLAttributes<HTMLTableElement> {
  columns: DataTableColumn<T>[]
  list: T[]
  rowKey?: RowKey<T>
  caption?: React.ReactNode
  /** Loading state for the table */
  loading?: boolean
  /** Simple empty text (backward compatible). Ignored if emptyRender provided */
  emptyText?: React.ReactNode
  /** Full custom empty view */
  emptyRender?: React.ReactNode
  /** Configurable empty view without custom rendering */
  emptyProps?: {
    icon?: React.ReactNode
    title?: React.ReactNode
    description?: React.ReactNode // fallback to emptyText
    className?: string
  }
  /**
   * Row hover effect control.
   * - true: always show hover on rows
   * - false: never show hover on rows
   * - 'auto' (default): show hover only when list has data
   */
  rowHover?: boolean | 'auto'
  /** default sort state */
  defaultSort?: DataTableSort<T>
  scroll?: {
    y?: number
    x?: number
  }
  /** notify when sort changes */
  onSortChange?: (next: DataTableSort<T> | null) => void
  /** controlled row selection */
  rowSelection?: {
    selectedRowKeys: React.Key[]
    onChange: (keys: React.Key[], rows: T[]) => void
    columnWidth?: number | string
    /** disable selection for some rows */
    getCheckboxProps?: (record: T) => { disabled?: boolean }
  }
  onCellClick?: (payload: {
    event: React.MouseEvent<HTMLTableCellElement>
    record: T
    value: any
    rowIndex: number
    dataIndex?: keyof T & string
    column: DataTableColumn<T>
  }) => void
}

export function DataTable<T extends object = any>(props: DataTableProps<T>) {
  const {
    columns,
    list,
    rowKey,
    caption,
    loading = false,
    emptyText = 'No data',
    emptyRender,
    emptyProps,
    rowHover = 'auto',
    defaultSort,
    onSortChange,
    rowSelection,
    className,
    onCellClick,
    scroll,
    ...rest
  } = props

  const getRowKey = (record: T, index: number): React.Key => {
    if (typeof rowKey === 'function') return rowKey(record, index)
    if (typeof rowKey === 'string') return (record as any)?.[rowKey] ?? index
    // fallback: use first column dataIndex or index
    const firstKey = columns.find(c => c.dataIndex)?.dataIndex
    return (firstKey ? (record as any)?.[firstKey] : undefined) ?? index
  }

  const [sort, setSort] = React.useState<DataTableSort<T> | null>(
    defaultSort ?? null
  )

  const sortedList = React.useMemo(() => {
    if (!sort) return list
    const col = columns.find(c => c.dataIndex === sort.dataIndex)
    if (!col) return list
    const base = [...list]
    const cmp: (a: T, b: T) => number =
      typeof col.sorter === 'function'
        ? col.sorter
        : (a: T, b: T) => {
            const va = (a as any)?.[sort.dataIndex]
            const vb = (b as any)?.[sort.dataIndex]
            if (va == null && vb == null) return 0
            if (va == null) return -1
            if (vb == null) return 1
            if (typeof va === 'number' && typeof vb === 'number') return va - vb
            return String(va).localeCompare(String(vb))
          }
    base.sort((a, b) => (sort.order === 'ascend' ? cmp(a, b) : -cmp(a, b)))
    return base
  }, [list, columns, sort])

  // -------- selection helpers (controlled) --------
  const selectedSet = React.useMemo(
    () => new Set(rowSelection?.selectedRowKeys ?? []),
    [rowSelection?.selectedRowKeys]
  )
  const visibleKeys: React.Key[] = React.useMemo(
    () => sortedList.map((r, i) => getRowKey(r, i)),
    [sortedList]
  )
  const allEnabledVisibleKeys: React.Key[] = React.useMemo(() => {
    if (!rowSelection) return []
    return sortedList
      .map((r, i) => ({ key: getRowKey(r, i), rec: r }))
      .filter(({ rec }) => !rowSelection.getCheckboxProps?.(rec)?.disabled)
      .map(({ key }) => key)
  }, [sortedList, rowSelection])
  const allSelected = rowSelection
    ? allEnabledVisibleKeys.length > 0 &&
      allEnabledVisibleKeys.every(k => selectedSet.has(k))
    : false
  const partiallySelected = rowSelection
    ? !allSelected && allEnabledVisibleKeys.some(k => selectedSet.has(k))
    : false

  const emitSelection = (keys: React.Key[]) => {
    if (!rowSelection) return
    const rows: T[] = []
    const keyToRow = new Map<React.Key, T>()
    sortedList.forEach((r, i) => keyToRow.set(getRowKey(r, i), r))
    keys.forEach(k => {
      const rec = keyToRow.get(k)
      if (rec) rows.push(rec)
    })
    rowSelection.onChange(keys, rows)
  }

  const toggleRow = (record: T, index: number) => {
    if (!rowSelection) return
    const key = getRowKey(record, index)
    const disabled = rowSelection.getCheckboxProps?.(record)?.disabled
    if (disabled) return
    const next = new Set(selectedSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    emitSelection(Array.from(next))
  }

  const toggleAll = () => {
    if (!rowSelection) return
    if (allSelected) {
      // unselect all visible enabled keys
      const next = rowSelection.selectedRowKeys.filter(
        k => !allEnabledVisibleKeys.includes(k)
      )
      emitSelection(next)
      return
    }
    // select all visible enabled keys + keep previously selected others
    const merged = new Set([
      ...rowSelection.selectedRowKeys,
      ...allEnabledVisibleKeys,
    ])
    emitSelection(Array.from(merged))
  }

  const toggleSort = (
    dataIndex?: keyof T & string,
    enabled?: DataTableColumn<T>['sorter']
  ) => {
    if (!dataIndex || !enabled) return
    setSort(prev => {
      if (!prev || prev.dataIndex !== dataIndex) {
        const next = { dataIndex, order: 'ascend' as SortOrder }
        onSortChange?.(next)
        return next
      }
      if (prev.order === 'ascend') {
        const next = { dataIndex, order: 'descend' as SortOrder }
        onSortChange?.(next)
        return next
      }
      onSortChange?.(null)
      return null // clear sort on third click
    })
  }

  const setSortOrder = (
    dataIndex?: keyof T & string,
    enabled?: DataTableColumn<T>['sorter'],
    order?: SortOrder
  ) => {
    if (!dataIndex || !enabled || !order) return
    setSort(prev => {
      if (prev && prev.dataIndex === dataIndex && prev.order === order) {
        onSortChange?.(null)
        return null // clicking same order again -> clear
      }
      const next = { dataIndex, order } as DataTableSort<T>
      onSortChange?.(next)
      return next
    })
  }

  const hasData = Boolean(sortedList?.length)
  const hoverEnabled =
    rowHover === true ? true : rowHover === false ? false : hasData // 'auto'
  const maxHeight = typeof scroll?.y === 'number' ? `${scroll.y}px` : scroll?.y
  return (
    <div style={{ maxHeight, overflowY: 'auto' }}>
      <Table
        className={cn(className, 'border border-[var(--border-color)]')}
        {...rest}
      >
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader className="text-sm sticky top-0 z-10">
          <TableRow className="text-sm">
            {rowSelection ? (
              <TableHead
                style={{ width: rowSelection.columnWidth ?? 36 }}
                className="pl-2 pr-1 bg-[var(--btn-outline-bg)]"
              >
                <button
                  type="button"
                  className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded-[4px] transition-colors',
                    (allSelected || partiallySelected) &&
                      'border border-[var(--btn-outline-border)]',
                    partiallySelected && 'opacity-90'
                  )}
                  onClick={e => {
                    e.stopPropagation()
                    toggleAll()
                  }}
                  aria-label="Select all"
                >
                  {allSelected ? (
                    <IconCheckbox className="h-3.5 w-3.5" />
                  ) : partiallySelected ? (
                    <span className="h-3.5 w-3.5 flex items-center justify-center text-[var(--text-color)] font-bold text-sm">
                      −
                    </span>
                  ) : (
                    <IconUnchecked className="h-3.5 w-3.5" />
                  )}
                </button>
              </TableHead>
            ) : null}
            {columns.map((col, i) => (
              <TableHead
                key={col.key ?? col.dataIndex ?? i}
                className={cn(
                  col.headerClassName,
                  col.sorter && 'cursor-pointer select-none',
                  'text-sm font-[400] bg-[var(--btn-outline-bg)]'
                )}
                style={{ width: col.width }}
                onClick={() => toggleSort(col.dataIndex, col.sorter)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.title}
                  {col.sorter ? (
                    <span className="ml-1 inline-flex flex-col leading-none   select-none">
                      {/* Asc (up) */}
                      <button
                        type="button"
                        className={cn(
                          'inline-flex h-3 w-3 items-center justify-center hover:opacity-100',
                          sort &&
                            sort.dataIndex === col.dataIndex &&
                            sort.order === 'ascend'
                            ? 'text-[var(--text-color)]'
                            : 'opacity-50'
                        )}
                        onClick={e => {
                          e.stopPropagation()
                          setSortOrder(col.dataIndex, col.sorter, 'ascend')
                        }}
                        title="Ascending"
                        aria-label="Sort ascending"
                      >
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 15 12 9 18 15" />
                        </svg>
                      </button>
                      {/* Desc (down) */}
                      <button
                        type="button"
                        className={cn(
                          'inline-flex h-3 w-3 items-center justify-center hover:opacity-100',
                          sort &&
                            sort.dataIndex === col.dataIndex &&
                            sort.order === 'descend'
                            ? 'text-[var(--text-color)]'
                            : 'opacity-50'
                        )}
                        onClick={e => {
                          e.stopPropagation()
                          setSortOrder(col.dataIndex, col.sorter, 'descend')
                        }}
                        title="Descending"
                        aria-label="Sort descending"
                      >
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </span>
                  ) : null}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length + (rowSelection ? 1 : 0)}
                className="h-24 p-0 text-center whitespace-normal align-middle"
              >
                <div className="py-10 flex flex-col items-center justify-center text-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-color)]"></div>
                  <div className="text-sm text-[var(--text-color)] opacity-70">
                    Loading...
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : sortedList?.length ? (
            sortedList.map((record, rowIndex) => (
              <TableRow
                key={getRowKey(record, rowIndex)}
                className={cn(!hoverEnabled && 'hover:bg-transparent')}
              >
                {rowSelection ? (
                  <TableCell className="pl-2 pr-1">
                    <button
                      type="button"
                      className={cn(
                        'inline-flex h-5 w-5 items-center justify-center rounded-[4px] transition-colors',
                        selectedSet.has(getRowKey(record, rowIndex)) &&
                          'bg-[var(--btn-outline-bg)] border border-[var(--btn-outline-border)]',
                        !selectedSet.has(getRowKey(record, rowIndex)) &&
                          'hover:bg-[var(--btn-outline-bg)]/60',
                        rowSelection.getCheckboxProps?.(record)?.disabled &&
                          'opacity-50 cursor-not-allowed'
                      )}
                      onClick={e => {
                        e.stopPropagation()
                        toggleRow(record, rowIndex)
                      }}
                      disabled={
                        rowSelection.getCheckboxProps?.(record)?.disabled
                      }
                      aria-label="Select row"
                    >
                      {selectedSet.has(getRowKey(record, rowIndex)) ? (
                        <IconCheckbox className="h-3.5 w-3.5" />
                      ) : (
                        <IconUnchecked className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </TableCell>
                ) : null}
                {columns.map((col, colIndex) => {
                  const value = col.dataIndex
                    ? (record as any)[col.dataIndex]
                    : undefined
                  const content = col.render
                    ? col.render(value, record, rowIndex)
                    : value
                  const alignClass =
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                        ? 'text-right'
                        : undefined
                  return (
                    <TableCell
                      key={(col.key ?? col.dataIndex ?? colIndex) as React.Key}
                      className={cn(
                        col.className,
                        alignClass,
                        'text-xs font-[400]',
                        (col.onCellClick || onCellClick) && 'cursor-pointer'
                      )}
                      onClick={event => {
                        if (!(col.onCellClick || onCellClick)) return
                        ;(col.onCellClick ?? onCellClick)!({
                          event,
                          record,
                          value,
                          rowIndex,
                          dataIndex: col.dataIndex as any,
                          column: col,
                        })
                      }}
                    >
                      {content}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length + (rowSelection ? 1 : 0)}
                className="h-24 p-0 text-center whitespace-normal align-middle"
              >
                {emptyRender ?? (
                  <div
                    className={cn(
                      'py-10 flex flex-col items-center justify-center text-center gap-2 break-words',
                      emptyProps?.className
                    )}
                  >
                    {emptyProps?.icon ? (
                      <div className="text-4xl mb-1 text-[var(--text-color)] opacity-80">
                        {emptyProps.icon}
                      </div>
                    ) : null}
                    {emptyProps?.title ? (
                      <div className="text-sm font-medium text-[var(--text-color)]">
                        {emptyProps.title}
                      </div>
                    ) : null}
                    <div className="text-xs  max-w-[520px] px-4">
                      {emptyProps?.description ?? emptyText}
                    </div>
                  </div>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default DataTable
