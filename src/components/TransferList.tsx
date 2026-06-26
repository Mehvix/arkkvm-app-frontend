import type { TransferRow } from '@/stores/slices/fileTransferListSlice';
import { CirclePause, Loader2, Trash2 } from 'lucide-react';
import React, { useMemo, useRef } from 'react';
import DataTable, { DataTableColumn } from './ui/data-table';

/** Formats remaining time using transfer speed and remaining bytes. */
function formatRemainingTime(record: TransferRow): string {
  if (record.state !== 'running') return '';
  const { speedBps, transferredBytes, totalBytes } = record;
  if (!speedBps || speedBps <= 0 || !totalBytes || totalBytes <= 0) return '';
  const remainBytes = totalBytes - (transferredBytes || 0);
  if (remainBytes <= 0) return '';
  const secs = Math.ceil(remainBytes / speedBps);
  if (secs < 60) return `${secs}s left`;
  const m = Math.floor(secs / 60) % 60;
  const h = Math.floor(secs / 3600) % 24;
  const d = Math.floor(secs / 86400);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  if (parts.length === 0) parts.push(`${secs % 60}s`);
  return `${parts.join(' ')} left`;
}

export interface TransferListProps {
  /** Transfer task rows. */
  list: TransferRow[]
  /** Pause action callback. */
  onPause?: (row: TransferRow) => void
  /** Remove action callback. */
  onRemove?: (id: string) => void
  /** Whether to show the actions column. */
  showActions?: boolean
  /** Empty-state display config. */
  emptyProps?: {
    icon?: React.ReactNode
    title?: string
    description?: string
    className?: string
  }
  /** Optional custom class name. */
  className?: string
}

/** Renders action buttons for a transfer row. */
const renderActions = (
  record: TransferRow,
  onPause?: (row: TransferRow) => void,
  onRemove?: (id: string) => void,
  pausingIds?: Set<string>,
  markPausingId?: (id: string) => void
) => {
  if (record.state === 'running') {
    const isPausing = pausingIds?.has(record.id) || false;
    return (
      <div className="flex items-center gap-1">
        {onPause && (
          <button
            type="button"
            className={`p-1 rounded transition-colors ${
              isPausing
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="pause"
            onClick={() => {
              if (isPausing) return;
              markPausingId?.(record.id);
              onPause?.(record);
            }}
            disabled={isPausing}
          >
            {isPausing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CirclePause className="w-4 h-4" />
            )}
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            className="p-1 rounded transition-colors text-red-500 opacity-50 cursor-not-allowed"
            title="Please pause the task before deleting"
            disabled={true}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
  if (record.state === 'paused' || record.state === 'failed' || record.state === 'pending') {
    return (
      <button
        type="button"
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-red-500"
        title="delete"
        onClick={() => onRemove?.(record.id)}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    );
  }
  return null;
};

/** Builds table column definitions. */
const getColumns = (
  onPause?: (row: TransferRow) => void,
  onRemove?: (id: string) => void,
  showActions: boolean = true,
  pausingIds?: Set<string>,
  markPausingId?: (id: string) => void
): DataTableColumn<TransferRow>[] => [
  {
    title: 'Name',
    dataIndex: 'name',
    width: '50%',
    className: 'max-w-0',
    render: name => (
      <span className="truncate min-w-0 block" title={String(name ?? '')}>
        {String(name ?? '')}
      </span>
    ),
  },
  {
    title: 'Transfer Info',
    dataIndex: 'transferredFormatted',
    width: '50%',
    render: (v, record) => {
      const pct = record.progress ?? 0;
      const { state } = record;
      const hasProgress = pct > 0 || record.transferredFormatted;

      // No progress data at all — show placeholder + state
      if (!hasProgress) return `- - - / - - - · ${state}`;

      // Progress bar color by state
      const barColor =
        state === 'failed'
          ? 'bg-red-500'
          : state === 'paused'
            ? 'bg-gray-400'
            : 'bg-[var(--btn-primary-bg)]';

      // Detail text: transferred info + state-specific suffix
      const transferred = `${record.transferredFormatted || '-'} / ${record.totalFormatted || '-'}`;
      let detail = '';
      if (state === 'running') {
        const eta = formatRemainingTime(record);
        const parts = [transferred, record.speedFormatted].filter(Boolean).join(' · ');
        detail = eta ? `${parts} · ${eta}` : `${parts}`;
      } else {
        detail = `${transferred} · ${state}`;
      }
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 w-[250px] overflow-hidden">
            <div className="flex-1 h-1.5 rounded bg-white/10 overflow-hidden max-w-[210px]">
              <div
                className={`h-full w-full rounded ${barColor} transition-all duration-300 transfer-progress-bar`}
                style={{ '--transfer-width': `${Math.min(pct, 100)}%` } as React.CSSProperties}
              />
            </div>
            <span className="text-[11px] tabular-nums whitespace-nowrap opacity-70">{record.progressFormatted || '0%'}</span>
          </div>
          <span className="text-[11px] opacity-80 truncate" title={detail}>{detail}</span>
        </div>
      );
    },
  },

  ...(showActions
    ? [
        {
          title: 'Actions',
          dataIndex: 'actions',
          align: 'left' as const,
          render: (v: unknown, record: TransferRow) =>
            renderActions(record, onPause, onRemove, pausingIds, markPausingId),
        },
      ]
    : []),
];

/** Displays upload/download transfer tasks with pause and remove actions. */
const TransferList: React.FC<TransferListProps> = ({
  list,
  onPause,
  onRemove,
  showActions = true,
  emptyProps,
  className = '',
}) => {
  // Keep pausing IDs in a ref so list refreshes do not reset in-flight pause state.
  const pausingIdsRef = useRef<Set<string>>(new Set());

  // Drop IDs from the pausing set once the task reaches the paused state.
  const currentPausingIds = new Set(pausingIdsRef.current);
  list.forEach(item => {
    if (item.state === 'paused' && currentPausingIds.has(item.id)) {
      pausingIdsRef.current.delete(item.id);
    }
  });

  const markPausingId = (id: string) => {
    pausingIdsRef.current.add(id);
  };

  const columns = useMemo(
    () =>
      getColumns(
        onPause,
        onRemove,
        showActions,
        pausingIdsRef.current,
        markPausingId
      ),
    [onPause, onRemove, showActions, list]
  );

  return (
    <DataTable
      columns={columns}
      list={list}
      rowKey="id"
      className={`text-sm mt-[var(--spacing-base)] [&_table]:table-fixed [&_table]:w-full ${className}`}
      scroll={{ x: 'max-content' }}
      emptyProps={emptyProps}
    />
  );
};

export default TransferList;
