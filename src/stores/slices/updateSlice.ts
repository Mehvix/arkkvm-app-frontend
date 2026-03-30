/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-07 20:20:57
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-07 02:24:24
 */
import type { StateCreator } from 'zustand'

export interface VersionInfo {
  currentAppVersion: string

  currentSystemVersion: string

  updateAppVersion: string | null

  updateSystemVersion: string | null
}

export type OTAState = {
  updating: boolean
  updateMode: 'auto' | 'manual'
  error: string | null
  metadataFetchedAt: number | null
  appUpdatePending: boolean
  systemUpdatePending: boolean

  versionInfo: VersionInfo
  appDownloadProgress: number
  appDownloadFinishedAt: number | null
  appVerificationProgress: number
  appVerifiedAt: number | null
  systemDownloadProgress: number
  systemDownloadFinishedAt: number | null
  systemVerificationProgress: number
  systemVerifiedAt: number | null
  appUpdateProgress: number
  appUpdatedAt: number | null
  systemUpdateProgress: number
  systemUpdatedAt: number | null
}

export type UpdateModalView =
  | 'loading'
  | 'updateAvailable'
  | 'upToDate'
  | 'download'
  | 'verify'
  | 'preparing'
  | 'updateCompleted'
  | 'error'

export interface UpdateStateData {
  isUpdatePending: boolean
  otaState: OTAState
  updateDialogHasBeenMinimized: boolean
  modalView: UpdateModalView
  updateErrorMessage: string | null

  isDialogOpen: boolean

  isReconnectOverlayVisible: boolean
}

export interface UpdateStateActions {
  setIsUpdatePending: (isPending: boolean) => void
  setOtaState: (
    state: Partial<OTAState> | ((prev: OTAState) => OTAState)
  ) => void
  setUpdateDialogHasBeenMinimized: (minimized: boolean) => void
  setModalView: (view: UpdateStateData['modalView']) => void
  setUpdateErrorMessage: (msg: string | null) => void
  resetOtaState: () => void

  openDialog: () => void

  closeDialog: () => void

  showReconnectOverlay: () => void

  hideReconnectOverlay: () => void
}

export type UpdateSlice = { update: UpdateStateData & UpdateStateActions }

const defaultOTAState = (): OTAState => ({
  updating: false,
  updateMode: 'auto',
  error: null,
  metadataFetchedAt: null,
  appUpdatePending: false,
  systemUpdatePending: false,
  versionInfo: {
    currentAppVersion: '',
    currentSystemVersion: '',
    updateAppVersion: null,
    updateSystemVersion: null,
  },
  appDownloadProgress: 0,
  appDownloadFinishedAt: null,
  appVerificationProgress: 0,
  appVerifiedAt: null,
  systemDownloadProgress: 0,
  systemDownloadFinishedAt: null,
  systemVerificationProgress: 0,
  systemVerifiedAt: null,
  appUpdateProgress: 0,
  appUpdatedAt: null,
  systemUpdateProgress: 0,
  systemUpdatedAt: null,
})

export const createUpdateSlice: StateCreator<UpdateSlice> = set => ({
  update: {
    // data
    isUpdatePending: false,
    otaState: defaultOTAState(),
    updateDialogHasBeenMinimized: false,
    modalView: 'loading',
    updateErrorMessage: null,
    isDialogOpen: false,
    isReconnectOverlayVisible: false,

    // actions
    setIsUpdatePending: isPending =>
      set((state: any) => ({
        update: { ...state.update, isUpdatePending: isPending },
      })),

    setOtaState: next =>
      set((state: any) => ({
        update: {
          ...state.update,
          otaState:
            typeof next === 'function'
              ? (next as any)(state.update.otaState)
              : { ...state.update.otaState, ...(next as Partial<OTAState>) },
        },
      })),

    setUpdateDialogHasBeenMinimized: minimized =>
      set((state: any) => ({
        update: { ...state.update, updateDialogHasBeenMinimized: minimized },
      })),

    setModalView: view =>
      set((state: any) => ({
        update: { ...state.update, modalView: view },
      })),

    setUpdateErrorMessage: msg =>
      set((state: any) => ({
        update: { ...state.update, updateErrorMessage: msg },
      })),

    openDialog: () =>
      set((state: any) => ({
        update: { ...state.update, isDialogOpen: true },
      })),

    closeDialog: () =>
      set((state: any) => ({
        update: { ...state.update, isDialogOpen: false },
      })),

    showReconnectOverlay: () =>
      set((state: any) => ({
        update: { ...state.update, isReconnectOverlayVisible: true },
      })),

    hideReconnectOverlay: () =>
      set((state: any) => ({
        update: { ...state.update, isReconnectOverlayVisible: false },
      })),

    resetOtaState: () =>
      set((state: any) => ({
        update: {
          ...state.update,
          otaState: defaultOTAState(),
          updateErrorMessage: null,
          modalView: 'loading',
          isDialogOpen: false,
        },
      })),
  },
})
