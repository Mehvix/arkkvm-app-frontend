import type { TransferState } from '@/hooks/useFileDownload'
import type { StateCreator } from 'zustand'

export interface DownloadItem {
  // === TransferPersistMeta ===
  id: string
  createdAt: number
  updatedAt: number
  path: string
  name: string
  totalBytes: number

  transferredBytes: number

  progress: number

  state: TransferState

  speedBps: number

  dataChannel?: string

  errorMessage?: string

  totalFormatted?: string
  transferredFormatted?: string
  progressFormatted?: string
  speedFormatted?: string
}

export interface DownloadListState {
  byId: Record<string, DownloadItem>
  order: string[]
}

export interface DownloadListActions {
  setDownloadFileList: (items: DownloadItem[]) => void

  updateProgress: (id: string, row: DownloadItem) => void

  removeRow: (id: string) => void
}

export type DownloadListSlice = DownloadListState & DownloadListActions

export const createFileTransferDownloadListSlice: StateCreator<
  any,
  [],
  [],
  DownloadListSlice
> = (set, get) => ({
  byId: {},
  order: [],

  setDownloadFileList: items => {
    if (!Array.isArray(items) || items.length === 0) return
    set((s: any) => {
      const prevById = s.fileDownloadList?.byId || {}
      const prevOrder: string[] = s.fileDownloadList?.order || []
      const nextById = { ...prevById } as Record<string, DownloadItem>
      const nextOrder = [...prevOrder]
      for (const it of items) {
        if (!it || !it.id) continue
        nextById[it.id] = { ...(prevById[it.id] || {}), ...it } as DownloadItem
        if (!prevOrder.includes(it.id)) nextOrder.push(it.id)
      }
      return {
        fileDownloadList: {
          ...s.fileDownloadList,
          byId: nextById,
          order: nextOrder,
        },
      }
    })
  },

  updateProgress: (id, item) => {
    set((s: any) => {
      const it = s.fileDownloadList?.byId?.[id]
      if (!it) return s

      return {
        fileDownloadList: {
          ...s.fileDownloadList,
          byId: {
            ...s.fileDownloadList.byId,
            [id]: {
              ...it,
              ...item,
            },
          },
        },
      }
    })
  },

  removeRow: id => {
    set((s: any) => {
      const { [id]: _, ...rest } = s.fileDownloadList?.byId || {}
      return {
        fileDownloadList: {
          ...s.fileDownloadList,
          byId: rest,
          order: (s.fileDownloadList?.order || []).filter(
            (x: string) => x !== id
          ),
        },
      }
    })
  },
})
