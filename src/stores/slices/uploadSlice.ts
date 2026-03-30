import { StateCreator } from 'zustand'

export type UploadTask = {
  id: string // unique key, e.g. filename or composite
  filename: string
  channelLabel?: string
  startedAt: number
  // total size in bytes (if known)
  size?: number
  // uploaded bytes so far (for restoring progress)
  uploaded?: number
}

export interface UploadStateData {
  uploads: Record<string, UploadTask>
  // runtime controllers, not intended for persistence
  controllers: Record<
    string,
    {
      pause: () => void
      resume: () => void
      getState?: () => any
      channel?: RTCDataChannel | null
    }
  >
}

export interface UploadStateActions {
  registerUpload: (
    key: string,
    task: Omit<UploadTask, 'id'> & { id?: string }
  ) => void
  unregisterUpload: (key: string) => void
  getUpload: (key: string) => UploadTask | undefined
  getFileNameByKey: (key: string) => string | undefined
  clearUploads: () => void
  updateUploadProgress: (key: string, uploaded: number, size?: number) => void
  setUploadController: (
    key: string,
    ctrl: UploadStateData['controllers'][string]
  ) => void
  getUploadController: (
    key: string
  ) => UploadStateData['controllers'][string] | undefined
  removeUploadController: (key: string) => void
}

export type UploadSlice = UploadStateData & UploadStateActions

export const createUploadSlice: StateCreator<any, [], [], UploadSlice> = (
  set,
  get
) => ({
  uploads: {},
  controllers: {},
  registerUpload: (key, task) => {
    const id = task.id ?? key
    set((state: any) => ({
      uploads: {
        ...(state.uploads || {}),
        [key]: {
          id,
          filename: task.filename,
          channelLabel: task.channelLabel,
          startedAt: task.startedAt,
          size: task.size,
          uploaded: task.uploaded,
        },
      },
    }))
  },
  unregisterUpload: key => {
    set((state: any) => {
      const next = { ...(state.uploads || {}) } as Record<string, UploadTask>
      delete next[key]
      const ctrls = { ...(state.controllers || {}) } as Record<string, any>
      delete ctrls[key]
      return { uploads: next, controllers: ctrls }
    })
  },
  getUpload: key => (get().uploads || {})[key],
  getFileNameByKey: key => (get().uploads || {})[key]?.filename,
  clearUploads: () => set(() => ({ uploads: {} })),
  updateUploadProgress: (key, uploaded, size) => {
    set((state: any) => {
      const next = { ...(state.uploads || {}) } as Record<string, UploadTask>
      const cur = next[key]
      if (!cur) return { uploads: state.uploads || {} }
      next[key] = {
        ...cur,
        uploaded,
        size: size ?? cur.size,
      }
      return { uploads: next }
    })
  },
  setUploadController: (key, ctrl) => {
    set((state: any) => ({
      controllers: { ...(state.controllers || {}), [key]: ctrl },
    }))
  },
  getUploadController: key => (get().controllers || {})[key],
  removeUploadController: key => {
    set((state: any) => {
      const ctrls = { ...(state.controllers || {}) } as Record<string, any>
      delete ctrls[key]
      return { controllers: ctrls }
    })
  },
})
