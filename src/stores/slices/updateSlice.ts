import type { StateCreator } from 'zustand';
import type { RootState } from '../types';

/** Version information. */
export interface VersionInfo {
  /** Current app version. */
  currentAppVersion: string
  /** Current system version. */
  currentSystemVersion: string
  /** Available app update version. */
  updateAppVersion: string | null
  /** Available system update version. */
  updateSystemVersion: string | null
}

export type OTAState = {
  updating: boolean
  updateMode: 'auto' | 'manual'
  error: string | null
  metadataFetchedAt: number | null
  appUpdatePending: boolean
  systemUpdatePending: boolean
  /** Version information. */
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

/**
 * Update dialog view state.
 * - loading: initial state
 * - updateAvailable: update detected after manual check
 * - upToDate: no update available after manual check
 * - download: download progress view (systemDownloadProgress)
 * - verify: verification progress view (systemVerificationProgress)
 * - preparing: update progress view (systemUpdateProgress)
 * - updateCompleted: update finished and waiting for restart
 * - error: error state requiring manual action
 */
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
  /** Whether the dialog is open (ephemeral, reset on refresh). */
  isDialogOpen: boolean
  /** Whether to show reconnect overlay after update completion. */
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
  /** Open the dialog. */
  openDialog: () => void
  /** Close the dialog. */
  closeDialog: () => void
  /** Show reconnect overlay. */
  showReconnectOverlay: () => void
  /** Hide reconnect overlay. */
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
});

export const createUpdateSlice: StateCreator<RootState, [], [], UpdateSlice> = set => ({
  update: {
    // Data
    isUpdatePending: false,
    otaState: defaultOTAState(),
    updateDialogHasBeenMinimized: false,
    modalView: 'loading',
    updateErrorMessage: null,
    isDialogOpen: false, // Closed by default and reset on refresh.
    isReconnectOverlayVisible: false, // Hidden by default.

    // Actions
    setIsUpdatePending: isPending =>
      set((state: UpdateSlice) => ({
        update: { ...state.update, isUpdatePending: isPending },
      })),

    setOtaState: next =>
      set((state: UpdateSlice) => ({
        update: {
          ...state.update,
          otaState:
            typeof next === 'function'
              ? (next as (prev: OTAState) => OTAState)(state.update.otaState)
              : { ...state.update.otaState, ...(next as Partial<OTAState>) },
        },
      })),

    setUpdateDialogHasBeenMinimized: minimized =>
      set((state: UpdateSlice) => ({
        update: { ...state.update, updateDialogHasBeenMinimized: minimized },
      })),

    setModalView: view =>
      set((state: UpdateSlice) => ({
        update: { ...state.update, modalView: view },
      })),

    setUpdateErrorMessage: msg =>
      set((state: UpdateSlice) => ({
        update: { ...state.update, updateErrorMessage: msg },
      })),

    // Open dialog.
    openDialog: () =>
      set((state: UpdateSlice) => ({
        update: { ...state.update, isDialogOpen: true },
      })),

    // Close dialog.
    closeDialog: () =>
      set((state: UpdateSlice) => ({
        update: { ...state.update, isDialogOpen: false },
      })),

    // Show reconnect overlay after update completion.
    showReconnectOverlay: () =>
      set((state: UpdateSlice) => ({
        update: { ...state.update, isReconnectOverlayVisible: true },
      })),

    // Hide reconnect overlay.
    hideReconnectOverlay: () =>
      set((state: UpdateSlice) => ({
        update: { ...state.update, isReconnectOverlayVisible: false },
      })),

    // Reset OTA state to defaults for retry or restart of the flow.
    resetOtaState: () =>
      set((state: UpdateSlice) => ({
        update: {
          ...state.update,
          otaState: defaultOTAState(),
          updateErrorMessage: null,
          modalView: 'loading',
          isDialogOpen: false,
        },
      })),
  },
});
