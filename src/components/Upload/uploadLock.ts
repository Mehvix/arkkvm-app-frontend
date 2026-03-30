/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-09 20:49:31
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-27 16:26:29
 */
/**
 * Module-level upload lock & queue.
 *
 * Persists across component remounts and instances to ensure
 * only one file uploads at a time via WebRTC DataChannel.
 */
import { useAppStore } from '@/stores'
import { UPLOAD_LOCK_TIMEOUT } from './constants'

let _globalUploading = false
let _globalUploadingTimestamp = 0

export interface QueuedFile {
  file: File
  /** Channel label obtained from the initial RPC call */
  channelLabel: string
  /** Bytes already uploaded (for resume) */
  alreadyUploadedBytes: number
  /** Original dataChannel value from RPC (string or object) */
  dataChannel: any
  /** Callback to start upload directly (skips RPC) */
  onReady: (
    file: File,
    channelLabel: string,
    alreadyUploadedBytes: number,
    dataChannel: any
  ) => void
}
export const uploadQueue: QueuedFile[] = []

export const pausedFiles = new Set<string>()

export function acquireUploadLock(): boolean {
  if (_globalUploading) {
    const timedOut =
      Date.now() - _globalUploadingTimestamp > UPLOAD_LOCK_TIMEOUT

    const controllers = useAppStore.getState().controllers || {}
    const hasActiveUpload = Object.values(controllers).some(
      (ctrl: any) => ctrl?.getState?.()?.readyState === 'open'
    )

    if (timedOut || !hasActiveUpload) {
      console.warn('[Upload] Force releasing stale upload lock', {
        timedOut,
        hasActiveUpload,
        controllerKeys: Object.keys(controllers),
        queueLength: uploadQueue.length,
      })
      _globalUploading = false
    } else {
      return false
    }
  }
  _globalUploading = true
  _globalUploadingTimestamp = Date.now()
  return true
}

export function releaseUploadLock(): void {
  _globalUploading = false
  _globalUploadingTimestamp = 0
}

export function dequeueNextFile(): QueuedFile | undefined {
  return uploadQueue.shift()
}

export function removeFromQueue(filename: string): boolean {
  const idx = uploadQueue.findIndex(q => q.file.name === filename)
  if (idx !== -1) {
    uploadQueue.splice(idx, 1)
    return true
  }
  return false
}
