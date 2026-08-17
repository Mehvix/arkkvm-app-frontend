/*
 * @Author: Lei Zhang daisy_zlei@163.com
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: Lei Zhang daisy_zlei@163.com
 * @LastEditTime: 2026-07-02 23:01:03
 */
import type { StateCreator } from 'zustand';
import type { TransferState } from '@/hooks/useFileDownload';
import type { RootState } from '../types';

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
export const createFileTransferDownloadListSlice: StateCreator<RootState, [], [], DownloadListSlice> = (set) => ({
  byId: {},
  order: [],

  setDownloadFileList: items => {
    if (!Array.isArray(items) || items.length === 0) return;
    set((s: RootState) => {
      const prevById = s.fileDownloadList?.byId || {};
      const prevOrder: string[] = s.fileDownloadList?.order || [];
      const nextById = { ...prevById } as Record<string, DownloadItem>;
      const nextOrder = [...prevOrder];
      for (const it of items) {
        if (!it || !it.id) continue;
        nextById[it.id] = { ...(prevById[it.id] || {}), ...it } as DownloadItem;
        if (!prevOrder.includes(it.id)) nextOrder.push(it.id);
      }
      return {
        fileDownloadList: {
          ...s.fileDownloadList,
          byId: nextById,
          order: nextOrder,
        },
      };
    });
  },

  updateProgress: (id, item) => {
    set((s: RootState) => {
      const it = s.fileDownloadList?.byId?.[id];
      if (!it) return s;

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
      };
    });
  },

  removeRow: id => {
    set((s: RootState) => {
      const { [id]: _, ...rest } = s.fileDownloadList?.byId || {};
      return {
        fileDownloadList: {
          ...s.fileDownloadList,
          byId: rest,
          order: (s.fileDownloadList?.order || []).filter(
            (x: string) => x !== id
          ),
        },
      };
    });
  },
});
