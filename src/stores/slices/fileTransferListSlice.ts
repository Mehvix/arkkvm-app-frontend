/**
 * File transfer list state management.
 * Manages upload/download tasks with progress tracking and persistence.
 */
import type { StateCreator } from 'zustand'

/**
 * Transfer task state.
 * - `pending`: Waiting (created but not started)
 * - `running`: In progress
 * - `paused`: Paused (user action or interrupted)
 * - `done`: Completed
 * - `failed`: Failed (with error message)
 */
export type TransferState = 'pending' | 'running' | 'paused' | 'done' | 'failed'

/**
 * Transfer direction.
 * - `upload`: Upload (local → remote)
 * - `download`: Download (remote → local)
 */
export type TransferDirection = 'upload' | 'download'

/**
 * Transfer source/entry point.
 * - `virtual-usb`: Virtual USB drive
 * - `storage`: Storage mount
 */
export type TransferSource = 'virtual-usb' | 'storage'

/**
 * File transfer task - core fields (for display and persistence).
 */
export interface TransferItem {
  /** File path (remote save location), e.g., "/" or "/images" */
  path: string

  /** File name, e.g., "DSC00531.JPG" */
  name: string

  /** Total file size in bytes, e.g., 6494874 */
  totalBytes: number

  /** Transferred bytes (resume position), e.g., 5423120 */
  transferredBytes: number

  /** Transfer progress percentage (0-100), e.g., 83.5 */
  progress: number
}

/**
 * Transfer task - runtime fields (not persisted, UI only).
 */
export interface TransferRuntimeFields {
  /** Current transfer state */
  state: TransferState

  /** Real-time transfer speed (bytes/second), e.g., 1048576 = 1 MB/s */
  speedBps: number

  /** Associated DataChannel name (WebRTC scenario) */
  dataChannel?: string

  /** Error message (populated when state is failed) */
  errorMessage?: string

  /** Total size formatted, e.g., "24.1 MB" */
  totalFormatted?: string

  /** Transferred size formatted, e.g., "5.6 MB" */
  transferredFormatted?: string

  /** Progress percentage formatted, e.g., "23.4%" */
  progressFormatted?: string

  /** Speed formatted, e.g., "3.2 MB/s" */
  speedFormatted?: string
}

/**
 * Transfer task - persistence metadata (for resume recovery).
 */
export interface TransferPersistMeta {
  /** Unique identifier */
  id: string

  /** Task creation timestamp (milliseconds), for sorting */
  createdAt: number

  /** Last update timestamp (milliseconds), for expiration check */
  updatedAt: number

  /** Transfer direction: upload / download */
  direction?: TransferDirection

  /** Transfer source: virtual-usb / storage */
  source?: TransferSource

  /** Device ID (for multi-device scenarios) */
  deviceId?: string

  /** File fingerprint (weak validation to avoid wrong file resume) */
  fingerprint?: string

  /** File last modified timestamp (milliseconds), for fingerprint generation */
  lastModified?: number
}

/**
 * Transfer task - complete persistence structure.
 * = TransferItem + TransferPersistMeta
 */
export type TransferRowPersist = TransferItem & TransferPersistMeta

/**
 * Transfer task - complete UI structure.
 * = TransferRowPersist + TransferRuntimeFields
 */
export type TransferRow = TransferRowPersist & TransferRuntimeFields

export interface TransferListState {
  byId: Record<string, TransferRow>
  order: string[]
}

export interface TransferListActions {
  /** Restore from local storage (called on startup) */
  hydrate: () => void

  /** Create a new task */
  createRow: (params: {
    id?: string
    path: string
    name: string
    totalBytes: number
    dataChannel?: string
    source?: TransferSource
    direction?: TransferDirection
  }) => string

  /** Remove a task */
  removeRow: (id: string) => void

  /** Set state (failed/paused/done, etc.) */
  setState: (id: string, state: TransferState, errorMessage?: string) => void

  /** Update progress (with TransferStats fields) */
  updateProgress: (id: string, stats: Partial<TransferRow>) => void

  /** Update speed only (not persisted) */
  setSpeed: (id: string, speedBps: number) => void

  /** Manually persist all tasks */
  persistAll: () => void
}

export type TransferListSlice = TransferListState & TransferListActions

export type UploadState = TransferState
export type UploadSource = TransferSource
export type UploadRow = TransferRow
export type UploadListSlice = TransferListSlice

const STORAGE_KEY = 'transfer:list'

const now = () => Date.now()

function loadPersist(): TransferRowPersist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as TransferRowPersist[]) : []
  } catch {
    return []
  }
}

function savePersist(rows: TransferRowPersist[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  } catch {}
}

function toPersistables(
  byId: Record<string, TransferRow>
): TransferRowPersist[] {
  return Object.values(byId).map(r => ({
    id: r.id,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    lastModified: r.lastModified,
    fingerprint: r.fingerprint,
    source: r.source,
    deviceId: r.deviceId,
    direction: r.direction,
    path: r.path,
    name: r.name,
    totalBytes: r.totalBytes,
    transferredBytes: r.transferredBytes,
    progress: r.progress,
  }))
}

export const createFileTransferUploadListSlice: StateCreator<
  any,
  [],
  [],
  TransferListSlice
> = (set, get) => ({
  byId: {},
  order: [],

  hydrate: () => {
    const list = loadPersist()
    const currentById: Record<string, TransferRow> =
      get().fileTransferList?.byId || {}

    const byId: Record<string, TransferRow> = {}
    const order: string[] = []

    for (const [id, row] of Object.entries(currentById)) {
      const s = (row as TransferRow).state
      if (s === 'running' || s === 'pending') {
        byId[id] = row as TransferRow
        order.push(id)
      }
    }

    for (const r of list) {
      if (byId[r.id]) continue
      if (r.progress >= 100) continue

      const raw = r as any
      const totalBytes = r.totalBytes ?? raw.fileSize ?? 0
      const transferredBytes = r.transferredBytes ?? raw.nextOffset ?? 0

      byId[r.id] = {
        ...r,
        totalBytes,
        transferredBytes,
        speedBps: 0,
        errorMessage: undefined,
        state: 'paused',
        progress:
          typeof r.progress === 'number'
            ? r.progress
            : totalBytes
              ? Math.min(100, (transferredBytes / totalBytes) * 100)
              : 0,
      }
      order.push(r.id)
    }

    set((s: any) => ({
      fileTransferList: {
        ...s.fileTransferList,
        byId,
        order,
      },
    }))
  },

  createRow: ({
    id,
    path,
    name,
    totalBytes,
    dataChannel,
    source,
    direction = 'upload',
  }) => {
    const createdAt = now()
    const finalId = id ?? name

    const row: TransferRow = {
      id: finalId,
      path,
      name,
      totalBytes,
      transferredBytes: 0,
      progress: 0,
      createdAt,
      updatedAt: createdAt,
      direction,
      source,
      dataChannel,
      state: 'pending',
      speedBps: 0,
    }

    set((s: any) => ({
      fileTransferList: {
        ...s.fileTransferList,
        byId: { ...s.fileTransferList.byId, [finalId]: row },
        order: s.fileTransferList.order?.includes(finalId)
          ? s.fileTransferList.order
          : [finalId, ...(s.fileTransferList.order || [])],
      },
    }))

    savePersist(toPersistables(get().fileTransferList.byId))
    return finalId
  },

  removeRow: id => {
    set((s: any) => {
      const { [id]: _, ...rest } = s.fileTransferList?.byId || {}
      return {
        fileTransferList: {
          ...s.fileTransferList,
          byId: rest,
          order: (s.fileTransferList?.order || []).filter(
            (x: string) => x !== id
          ),
        },
      }
    })
    savePersist(toPersistables(get().fileTransferList.byId))
  },

  setState: (id, state, errorMessage) => {
    set((s: any) => {
      const it = s.fileTransferList?.byId?.[id]
      if (!it) return s
      const next: TransferRow = {
        ...it,
        state,
        errorMessage,
        updatedAt: now(),
        progress: state === 'done' ? 100 : it.progress,
        transferredBytes:
          state === 'done' ? it.totalBytes : it.transferredBytes,
        speedBps: state === 'done' ? 0 : it.speedBps,
      }
      return {
        ...s,
        fileTransferList: {
          ...s.fileTransferList,
          byId: { ...s.fileTransferList.byId, [id]: next },
        },
      }
    })
    savePersist(toPersistables(get().fileTransferList.byId))
  },

  updateProgress: (id, stats) => {
    set((s: any) => {
      const it = s.fileTransferList?.byId?.[id]
      if (!it) return s
      const next: TransferRow = {
        ...it,
        ...stats,
        updatedAt: now(),
        state: it.state === 'pending' ? 'running' : it.state,
      }
      return {
        ...s,
        fileTransferList: {
          ...s.fileTransferList,
          byId: { ...s.fileTransferList.byId, [id]: next },
        },
      }
    })
    savePersist(toPersistables(get().fileTransferList.byId))
  },

  setSpeed: (id, speedBps) => {
    set((s: any) => {
      const it = s.fileTransferList?.byId?.[id]
      if (!it) return s
      if (it.speedBps === speedBps) return s
      return {
        ...s,
        fileTransferList: {
          ...s.fileTransferList,
          byId: { ...s.fileTransferList.byId, [id]: { ...it, speedBps } },
        },
      }
    })
  },

  persistAll: () => {
    savePersist(toPersistables(get().fileTransferList.byId))
  },
})
