/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-09 18:51:18
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-28 16:57:25
 */
import { IconRightSmall } from '@/assets/icons'
import type { DownloadFileInfo } from '@/hooks/useWebRtcFile'
import { humanSize } from '@/utils/format'
import type { DataTableColumn } from '../../ui/data-table'
import type { Row } from './types'
import { formatTime, getFileIcon } from './utils'

export const completedColumns: DataTableColumn<Row>[] = [
  {
    title: 'Name',
    dataIndex: 'name',
    sorter: true,
    width: '60%',
    className: 'max-w-0',
    render: (name, record) => {
      const Icon = getFileIcon(String(name ?? ''), record.is_dir)
      const label = String(name ?? '')
      const isDir = !!record?.is_dir
      return (
        <span className="group inline-flex items-center gap-2 max-w-full min-w-0">
          <Icon className="size-4 opacity-80 flex-shrink-0" />
          <span
            className={
              isDir
                ? 'truncate hover:underline cursor-pointer min-w-0'
                : 'truncate min-w-0'
            }
            role={isDir ? 'button' : undefined}
            tabIndex={isDir ? 0 : -1}
            title={label}
          >
            {label}
          </span>
          {isDir ? (
            <IconRightSmall className="size-3 opacity-0 group-hover:opacity-80 transition-opacity flex-shrink-0" />
          ) : null}
        </span>
      )
    },
  },

  {
    title: 'Modified time',
    dataIndex: 'modified',
    className: 'capitalize',
    sorter: true,
    width: '25%',
    render: ts => formatTime(ts as number),
  },
  {
    title: 'File size',
    dataIndex: 'size',
    align: 'left',
    sorter: true,
    width: '15%',
    render: (v, record) => {
      return record.is_dir ? '--' : humanSize(Number(v) || 0)
    },
  },
]

export const downloadsColumns: DataTableColumn<DownloadFileInfo[]> = [
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
    dataIndex: 'speed',
    width: '35%',
    render: (v, record) =>
      `${record.speedFormatted || '-'} · ${record.transferredFormatted || '-'} / ${record.totalFormatted || '-'} · ${record.progressFormatted || '-'}`,
  },
  {
    title: 'Transfer Status',
    dataIndex: 'state',
    align: 'left',
    width: '15%',
  },
]
